import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Item, ItemStatus } from './item.entity';
import { CreateItemDto } from './dto/create-item.dto';
import { UpdateItemDto } from './dto/update-item.dto';
import { v2 as cloudinary } from 'cloudinary';

@Injectable()
export class ItemsService {
  constructor(
    @InjectRepository(Item)
    private itemsRepository: Repository<Item>,
  ) {
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });
  }

  async create(userId: string, dto: CreateItemDto): Promise<Item> {
    const duplicate = await this.itemsRepository
      .createQueryBuilder('item')
      .where('LOWER(item.title) = LOWER(:title)', { title: dto.title })
      .andWhere('item.campus = :campus', { campus: dto.campus })
      .andWhere('item.status = :status', { status: ItemStatus.DISPONIBLE })
      .getOne();

    if (duplicate) {
      throw new BadRequestException(
        'Ya existe un ítem similar disponible en este campus. ¿Es el mismo?'
      );
    }

    const item = this.itemsRepository.create({
      ...dto,
      user_id: userId,
      photos: [],
    });
    return this.itemsRepository.save(item);
  }

  async findAll(filters?: {
    category?: string;
    campus?: string;
    offer_type?: string;
    search?: string;
    order_by?: 'recent' | 'rating';
    user_campus?: string;
  }) {
    const query = this.itemsRepository.createQueryBuilder('item')
      .leftJoin('item.user', 'user')
      .addSelect(['user.id', 'user.full_name', 'user.photo_url', 'user.rating', 'user.faculty', 'user.campus', 'user.is_verified'])
      .where('item.status = :status', { status: 'Disponible' });

    if (filters?.search) {
      query.andWhere('item.title ILIKE :search', { search: `%${filters.search}%` });
    }
    if (filters?.category) {
      query.andWhere('item.category = :category', { category: filters.category });
    }
    if (filters?.campus) {
      query.andWhere('item.campus = :campus', { campus: filters.campus });
    }
    if (filters?.offer_type) {
      query.andWhere('item.offer_type = :offer_type', { offer_type: filters.offer_type });
    }

    if (filters?.order_by === 'rating') {
      query.orderBy('user.rating', 'DESC');
    } else {
      query.orderBy('item.created_at', 'DESC');
    }

    const items = await query.getMany();

    if (filters?.user_campus) {
      const sameCampus = items.filter(i => i.campus === filters.user_campus);
      const otherCampus = items.filter(i => i.campus !== filters.user_campus);
      return [...sameCampus, ...otherCampus];
    }

    return items;
  }

  async getRecommended(userId: string, campus?: string) {
    const query = this.itemsRepository.createQueryBuilder('item')
      .leftJoin('item.user', 'user')
      .addSelect(['user.id', 'user.full_name', 'user.photo_url', 'user.rating', 'user.faculty', 'user.is_verified'])
      .where('item.status = :status', { status: 'Disponible' })
      .andWhere('item.user_id != :userId', { userId })
      .orderBy('item.created_at', 'DESC')
      .take(10);

    if (campus) {
      query.andWhere('item.campus = :campus', { campus });
    }

    return query.getMany();
  }

  async findOne(id: string): Promise<Item> {
    const item = await this.itemsRepository.createQueryBuilder('item')
      .leftJoin('item.user', 'user')
      .addSelect(['user.id', 'user.full_name', 'user.photo_url', 'user.rating', 'user.faculty', 'user.is_verified'])
      .where('item.id = :id', { id })
      .getOne();
    if (!item) throw new NotFoundException('Ítem no encontrado');
    return item;
  }

  async findByUser(userId: string): Promise<Item[]> {
    return this.itemsRepository.find({
      where: { user_id: userId },
      order: { created_at: 'DESC' },
    });
  }

  async update(userId: string, id: string, dto: UpdateItemDto): Promise<Item> {
    const item = await this.findOne(id);
    if (item.user_id !== userId) throw new ForbiddenException('No puedes editar este ítem');
    if (item.status === ItemStatus.ENTREGADO) {
      throw new ForbiddenException('No puedes editar un ítem ya entregado');
    }
    await this.itemsRepository.update(id, dto);
    return this.findOne(id);
  }

  async remove(userId: string, id: string): Promise<void> {
    const item = await this.findOne(id);
    if (item.user_id !== userId) throw new ForbiddenException('No puedes eliminar este ítem');
    await this.itemsRepository.delete(id);
  }

  async uploadPhotos(userId: string, id: string, files: Express.Multer.File[]): Promise<Item> {
    const item = await this.findOne(id);
    if (item.user_id !== userId) throw new ForbiddenException('No puedes modificar este ítem');

    if (item.photos.length + files.length > 5) {
      throw new BadRequestException('No puedes subir más de 5 fotos por ítem');
    }

    const allowed = ['image/jpeg', 'image/png', 'image/webp'];
    const maxSize = 5 * 1024 * 1024;
    const uploadedUrls: string[] = [];

    for (const file of files) {
      if (!allowed.includes(file.mimetype)) throw new BadRequestException('Solo JPG, PNG o WebP');
      if (file.size > maxSize) throw new BadRequestException('Cada imagen no puede superar 5MB');

      const result = await new Promise<any>((resolve, reject) => {
        cloudinary.uploader.upload_stream(
          { folder: 'sharecampus/items', format: 'webp', transformation: [{ width: 800, quality: 'auto' }] },
          (error, result) => { if (error) reject(error); else resolve(result); }
        ).end(file.buffer);
      });
      uploadedUrls.push(result.secure_url);
    }

    const newPhotos = [...item.photos, ...uploadedUrls];
    await this.itemsRepository.update(id, { photos: newPhotos });
    return this.findOne(id);
  }

  async reportItem(id: string): Promise<void> {
    const item = await this.findOne(id);
    const newCount = item.report_count + 1;
    await this.itemsRepository.update(id, {
      report_count: newCount,
      is_reported: newCount >= 1,
    });
  }
}