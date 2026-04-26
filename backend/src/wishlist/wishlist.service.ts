import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Wishlist } from './wishlist.entity';
import { NotificationsService } from '../notifications/notifications.service';
import { Item } from '../items/item.entity';

@Injectable()
export class WishlistService {
  constructor(
    @InjectRepository(Wishlist)
    private wishlistRepository: Repository<Wishlist>,
    @InjectRepository(Item)
    private itemsRepository: Repository<Item>,
    private notificationsService: NotificationsService,
  ) {}

  async addToWishlist(userId: string, search_query: string, category?: string, campus?: string): Promise<Wishlist> {
    const wishlist = this.wishlistRepository.create({
      user_id: userId,
      search_query,
      category: category || null,
      campus: campus || null,
    });
    return this.wishlistRepository.save(wishlist);
  }

  async getWishlist(userId: string): Promise<Wishlist[]> {
    return this.wishlistRepository.find({
      where: { user_id: userId, is_active: true },
      order: { created_at: 'DESC' },
    });
  }

  async removeFromWishlist(userId: string, id: string): Promise<void> {
    await this.wishlistRepository.update(
      { id, user_id: userId },
      { is_active: false }
    );
  }

  async checkWishlistMatches(newItem: Item): Promise<void> {
    const wishlists = await this.wishlistRepository.find({
      where: { is_active: true },
    });

    for (const wishlist of wishlists) {
      if (wishlist.user_id === newItem.user_id) continue;

      const titleMatch = newItem.title.toLowerCase().includes(
        wishlist.search_query.toLowerCase()
      );
      const categoryMatch = !wishlist.category || wishlist.category === newItem.category;
      const campusMatch = !wishlist.campus || wishlist.campus === newItem.campus;

      if (titleMatch && categoryMatch && campusMatch) {
        await this.notificationsService.notifyWishlistMatch(
          wishlist.user_id,
          newItem.title,
          newItem.category,
        );
      }
    }
  }
}