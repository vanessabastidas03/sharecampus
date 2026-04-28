import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { WishlistService } from './wishlist.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('wishlist')
@UseGuards(JwtAuthGuard)
export class WishlistController {
  constructor(private readonly wishlistService: WishlistService) {}

  @Post()
  addToWishlist(
    @Request() req,
    @Body() body: { search_query: string; category?: string; campus?: string },
  ) {
    return this.wishlistService.addToWishlist(
      req.user.sub,
      body.search_query,
      body.category,
      body.campus,
    );
  }

  @Get()
  getWishlist(@Request() req) {
    return this.wishlistService.getWishlist(req.user.sub);
  }

  @Delete(':id')
  removeFromWishlist(@Request() req, @Param('id') id: string) {
    return this.wishlistService.removeFromWishlist(req.user.sub, id);
  }
}
