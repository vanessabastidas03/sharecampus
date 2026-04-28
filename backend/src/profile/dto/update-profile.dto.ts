import { IsOptional, IsString, IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  full_name?: string;

  @IsOptional()
  @IsString()
  faculty?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(12)
  @Type(() => Number)
  semester?: number;

  @IsOptional()
  @IsString()
  ciudad?: string | null;

  @IsOptional()
  @IsString()
  departamento?: string | null;
}
