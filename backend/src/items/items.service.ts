import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Item, ItemStatus } from './item.entity';
import { User } from '../users/user.entity';
import { CreateItemDto } from './dto/create-item.dto';
import { UpdateItemDto } from './dto/update-item.dto';
import { v2 as cloudinary } from 'cloudinary';

type SafeUser = Omit<
  User,
  | 'password_hash'
  | 'verification_token'
  | 'reset_password_token'
  | 'reset_password_expires'
>;

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

  private sanitizeUser(user: User | undefined | null): SafeUser | null {
    if (!user) return null;
    const {
      password_hash: _ph,
      verification_token: _vt,
      reset_password_token: _rpt,
      reset_password_expires: _rpe,
      ...safe
    } = user;
    return safe;
  }

  private sanitizeItem(item: Item & { user?: User | null }) {
    return { ...item, user: this.sanitizeUser(item.user ?? null) };
  }

  async create(userId: string, dto: CreateItemDto): Promise<Item> {
    // Solo bloquea duplicados del mismo usuario, no de toda la plataforma
    const dupQuery = this.itemsRepository
      .createQueryBuilder('item')
      .where('LOWER(item.title) = LOWER(:title)', { title: dto.title })
      .andWhere('item.status = :status', { status: ItemStatus.DISPONIBLE })
      .andWhere('item.user_id = :userId', { userId });

    if (dto.campus) {
      dupQuery.andWhere('item.campus = :campus', { campus: dto.campus });
    } else {
      dupQuery.andWhere('item.campus IS NULL');
    }

    const duplicate = await dupQuery.getOne();

    if (duplicate) {
      throw new BadRequestException(
        'Ya existe un ítem similar disponible en este campus. ¿Es el mismo?',
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
    const query = this.itemsRepository
      .createQueryBuilder('item')
      .leftJoinAndSelect('item.user', 'user')
      .where('item.status = :status', { status: 'Disponible' });

    if (filters?.search)
      query.andWhere('item.title ILIKE :search', {
        search: `%${filters.search}%`,
      });
    if (filters?.category)
      query.andWhere('item.category = :category', {
        category: filters.category,
      });
    if (filters?.campus)
      query.andWhere('item.campus = :campus', { campus: filters.campus });
    if (filters?.offer_type)
      query.andWhere('item.offer_type = :offer_type', {
        offer_type: filters.offer_type,
      });

    if (filters?.order_by === 'rating') query.orderBy('user.rating', 'DESC');
    else query.orderBy('item.created_at', 'DESC');

    const items = await query.getMany();
    const sanitized = items.map((i) =>
      this.sanitizeItem(i as Item & { user?: User | null }),
    );

    if (filters?.user_campus) {
      const sameCampus = sanitized.filter(
        (i) => i.user?.faculty === filters.user_campus,
      );
      const otherCampus = sanitized.filter(
        (i) => i.user?.faculty !== filters.user_campus,
      );
      return [...sameCampus, ...otherCampus];
    }

    return sanitized;
  }

  async getRecommended(userId: string, campus?: string) {
    const query = this.itemsRepository
      .createQueryBuilder('item')
      .leftJoinAndSelect('item.user', 'user')
      .where('item.status = :status', { status: 'Disponible' })
      .andWhere('item.user_id != :userId', { userId })
      .orderBy('item.created_at', 'DESC')
      .take(10);

    if (campus) query.andWhere('item.campus = :campus', { campus });

    const items = await query.getMany();
    return items.map((i) =>
      this.sanitizeItem(i as Item & { user?: User | null }),
    );
  }

  async findOne(id: string) {
    const item = await this.itemsRepository.findOne({
      where: { id },
      relations: ['user'],
    });
    if (!item) throw new NotFoundException('Ítem no encontrado');
    return this.sanitizeItem(item as Item & { user?: User | null });
  }

  async findByUser(userId: string): Promise<Item[]> {
    return this.itemsRepository.find({
      where: { user_id: userId },
      order: { created_at: 'DESC' },
    });
  }

  async update(userId: string, id: string, dto: UpdateItemDto) {
    const item = await this.itemsRepository.findOne({ where: { id } });
    if (!item) throw new NotFoundException('Ítem no encontrado');
    if (item.user_id !== userId)
      throw new ForbiddenException('No puedes editar este ítem');
    if (item.status === ItemStatus.ENTREGADO)
      throw new ForbiddenException('No puedes editar un ítem ya entregado');
    await this.itemsRepository.update(id, dto);
    return this.findOne(id);
  }

  async remove(userId: string, id: string): Promise<void> {
    const item = await this.itemsRepository.findOne({ where: { id } });
    if (!item) throw new NotFoundException('Ítem no encontrado');
    if (item.user_id !== userId)
      throw new ForbiddenException('No puedes eliminar este ítem');
    await this.itemsRepository.delete(id);
  }

  async uploadPhotos(
    userId: string,
    id: string,
    files: Express.Multer.File[],
  ) {
    const item = await this.itemsRepository.findOne({ where: { id } });
    if (!item) throw new NotFoundException('Ítem no encontrado');
    if (item.user_id !== userId)
      throw new ForbiddenException('No puedes modificar este ítem');
    if (item.photos.length + files.length > 5)
      throw new BadRequestException('No puedes subir más de 5 fotos por ítem');

    const allowed = ['image/jpeg', 'image/png', 'image/webp'];
    const maxSize = 5 * 1024 * 1024;
    const uploadedUrls: string[] = [];

    for (const file of files) {
      if (!allowed.includes(file.mimetype))
        throw new BadRequestException('Solo JPG, PNG o WebP');
      if (file.size > maxSize)
        throw new BadRequestException('Cada imagen no puede superar 5MB');

      const url = await new Promise<string>((resolve, reject) => {
        cloudinary.uploader
          .upload_stream(
            {
              folder: 'sharecampus/items',
              format: 'webp',
              transformation: [{ width: 800, quality: 'auto' }],
            },
            (error, result) => {
              if (error) reject(new Error(error.message));
              else resolve((result as { secure_url: string }).secure_url);
            },
          )
          .end(file.buffer);
      });
      uploadedUrls.push(url);
    }

    const newPhotos = [...item.photos, ...uploadedUrls];
    await this.itemsRepository.update(id, { photos: newPhotos });
    return this.findOne(id);
  }

  async reportItem(id: string): Promise<void> {
    const item = await this.itemsRepository.findOne({ where: { id } });
    if (!item) throw new NotFoundException('Ítem no encontrado');
    const newCount = item.report_count + 1;
    await this.itemsRepository.update(id, {
      report_count: newCount,
      is_reported: newCount >= 1,
    });
  }
}
