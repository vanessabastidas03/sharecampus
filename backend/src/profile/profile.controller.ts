import { Controller, Get, Patch, Post, Body, UseInterceptors, UploadedFile, Request, UseGuards } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ProfileService } from './profile.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('profile')
@UseGuards(JwtAuthGuard)
export class ProfileController {
  constructor(private readonly profileService: ProfileService) {}

  @Get()
  getProfile(@Request() req) {
    return this.profileService.getProfile(req.user.sub);
  }

  @Patch()
  updateProfile(@Request() req, @Body() dto: UpdateProfileDto) {
    return this.profileService.updateProfile(req.user.sub, dto);
  }

  @Post('photo')
  @UseInterceptors(FileInterceptor('photo', { storage: require('multer').memoryStorage() }))
  uploadPhoto(@Request() req, @UploadedFile() file: Express.Multer.File) {
    return this.profileService.uploadPhoto(req.user.sub, file);
  }

  @Post('rate')
  rateUser(@Body() body: { userId: string; rating: number }) {
    return this.profileService.addRating(body.userId, body.rating);
  }
}