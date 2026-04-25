import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards, Request, UseInterceptors, UploadedFiles } from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { ItemsService } from './items.service';
import { CreateItemDto } from './dto/create-item.dto';
import { UpdateItemDto } from './dto/update-item.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('items')
export class ItemsController {
  constructor(private readonly itemsService: ItemsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  create(@Request() req, @Body() dto: CreateItemDto) {
    return this.itemsService.create(req.user.sub, dto);
  }

  @Get()
  findAll(
    @Query('category') category?: string,
    @Query('campus') campus?: string,
    @Query('offer_type') offer_type?: string,
  ) {
    return this.itemsService.findAll({ category, campus, offer_type });
  }

  @Get('my-items')
  @UseGuards(JwtAuthGuard)
  findMyItems(@Request() req) {
    return this.itemsService.findByUser(req.user.sub);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.itemsService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  update(@Request() req, @Param('id') id: string, @Body() dto: UpdateItemDto) {
    return this.itemsService.update(req.user.sub, id, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  remove(@Request() req, @Param('id') id: string) {
    return this.itemsService.remove(req.user.sub, id);
  }

  @Post(':id/photos')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FilesInterceptor('photos', 5, { storage: require('multer').memoryStorage() }))
  uploadPhotos(@Request() req, @Param('id') id: string, @UploadedFiles() files: Express.Multer.File[]) {
    return this.itemsService.uploadPhotos(req.user.sub, id, files);
  }

  @Post(':id/report')
  @UseGuards(JwtAuthGuard)
  reportItem(@Param('id') id: string) {
    return this.itemsService.reportItem(id);
  }
}