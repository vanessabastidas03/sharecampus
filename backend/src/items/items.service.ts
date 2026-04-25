import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ILike } from 'typeorm';
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
    const duplicate = await this.itemsRepository.findOne({
      where: { title: ILike(dto.title), campus: dto.campus, status: ItemStatus.DISPONIBLE },
    });
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

  async findAll(filters?: { category?: string; campus?: string; offer_type?: string }) {
    const where: any = {};
    if (filters?.category) where.category = filters.category;
    if (filters?.campus) where.campus = filters.campus;
    if (filters?.offer_type) where.offer_type = filters.offer_type;

    return this.itemsRepository.find({
      where,
      relations: ['user'],
      order: { created_at: 'DESC' },
    });
  }

  async findOne(id: string): Promise<Item> {
    const item = await this.itemsRepository.findOne({ where: { id }, relations: ['user'] });
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