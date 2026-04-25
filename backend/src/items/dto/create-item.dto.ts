import { ItemCategory, ItemOfferType } from '../item.entity';

export class CreateItemDto {
  title: string;
  description?: string;
  category: ItemCategory;
  offer_type: ItemOfferType;
  campus?: string;
}