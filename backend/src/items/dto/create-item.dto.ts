import { IsString, IsOptional, IsEnum, IsNumber, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ItemCategory, ItemOfferType } from '../item.entity';

export class CreateItemDto {
  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsEnum(ItemCategory)
  category: ItemCategory;

  @IsEnum(ItemOfferType)
  offer_type: ItemOfferType;

  @IsOptional()
  @IsString()
  campus?: string;

  @IsOptional()
  @IsString()
  ciudad?: string;

  @IsOptional()
  @IsString()
  departamento?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  rental_price?: number;

  @IsOptional()
  @IsString()
  rental_time_unit?: string;
}
