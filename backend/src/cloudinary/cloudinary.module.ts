import { Module } from '@nestjs/common';
import { CloudinaryProvider } from './cloudinary.config';

@Module({
  providers: [CloudinaryProvider],
  exports: [CloudinaryProvider],
})
export class CloudinaryModule {}
