import { ItemCategory, ItemOfferType, ItemStatus } from '../item.entity';

export class UpdateItemDto {
  title?: string;
  description?: string;
  category?: ItemCategory;
  offer_type?: ItemOfferType;
  status?: ItemStatus;
  campus?: string;
}
