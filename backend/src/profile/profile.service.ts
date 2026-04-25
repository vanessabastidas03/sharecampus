import { Injectable, BadRequestException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { v2 as cloudinary } from 'cloudinary';

@Injectable()
export class ProfileService {
  constructor(private usersService: UsersService) {
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });
  }

  async getProfile(userId: string) {
    return this.usersService.getProfile(userId);
  }

  async updateProfile(userId: string, dto: UpdateProfileDto) {
    const updateData: any = {};
    if (dto.full_name) updateData.full_name = dto.full_name;
    if (dto.faculty) updateData.faculty = dto.faculty;
    if (dto.semester) updateData.semester = dto.semester;

    const user = await this.usersService.findById(userId);
    const isComplete = !!(
      (dto.full_name || user?.full_name) &&
      (dto.faculty || user?.faculty) &&
      (dto.semester || user?.semester)
    );
    updateData.is_profile_complete = isComplete;

    await this.usersService.update(userId, updateData);
    return this.usersService.getProfile(userId);
  }

  async uploadPhoto(userId: string, file: Express.Multer.File) {
    if (!file) throw new BadRequestException('No se proporcionó ninguna imagen');

    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) throw new BadRequestException('La imagen no puede superar 5MB');

    const allowed = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowed.includes(file.mimetype)) {
      throw new BadRequestException('Solo se permiten imágenes JPG, PNG o WebP');
    }

    const result = await new Promise<any>((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        {
          folder: 'sharecampus/profiles',
          transformation: [{ width: 400, height: 400, crop: 'fill' }],
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      ).end(file.buffer);
    });

    await this.usersService.update(userId, { photo_url: result.secure_url });
    return { photo_url: result.secure_url };
  }

  async addRating(targetUserId: string, rating: number) {
    if (rating < 1 || rating > 5) throw new BadRequestException('La calificación debe ser entre 1 y 5');
    const user = await this.usersService.findById(targetUserId);
    if (!user) throw new BadRequestException('Usuario no encontrado');

    const newCount = user.rating_count + 1;
    const newRating = ((user.rating * user.rating_count) + rating) / newCount;

    await this.usersService.update(targetUserId, {
      rating: Math.round(newRating * 10) / 10,
      rating_count: newCount,
    });
    return { rating: Math.round(newRating * 10) / 10, rating_count: newCount };
  }
}