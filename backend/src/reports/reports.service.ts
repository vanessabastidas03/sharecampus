import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan } from 'typeorm';
import { Report, ReportCategory, ReportTargetType, ReportStatus } from './report.entity';
import { UsersService } from '../users/users.service';

@Injectable()
export class ReportsService {
  constructor(
    @InjectRepository(Report)
    private reportsRepository: Repository<Report>,
    private usersService: UsersService,
  ) {}

  async createReport(
    reporterId: string,
    target_type: ReportTargetType,
    target_id: string,
    category: ReportCategory,
    description?: string,
  ): Promise<Report> {
    const existing = await this.reportsRepository.findOne({
      where: { reporter_id: reporterId, target_id, target_type },
    });
    if (existing) throw new BadRequestException('Ya reportaste este contenido anteriormente');

    const report = this.reportsRepository.create({
      reporter_id: reporterId,
      target_type,
      target_id,
      category,
      description: description || null,
    });

    const saved = await this.reportsRepository.save(report);

    if (target_type === ReportTargetType.PERFIL) {
      await this.checkAndSuspendUser(target_id);
    }

    return saved;
  }

  async checkAndSuspendUser(userId: string): Promise<void> {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentReports = await this.reportsRepository.count({
      where: {
        target_id: userId,
        target_type: ReportTargetType.PERFIL,
        status: ReportStatus.REVISADO,
        created_at: MoreThan(thirtyDaysAgo),
      },
    });

    if (recentReports >= 3) {
      await this.usersService.update(userId, { is_verified: false });
    }
  }

  async getAllReports(): Promise<Report[]> {
    return this.reportsRepository.find({
      where: { status: ReportStatus.PENDIENTE },
      relations: ['reporter'],
      order: { created_at: 'ASC' },
    });
  }

  async reviewReport(reportId: string, action: 'resolve' | 'discard'): Promise<Report> {
    const newStatus = action === 'resolve' ? ReportStatus.RESUELTO : ReportStatus.DESCARTADO;
    await this.reportsRepository.update(reportId, {
      status: newStatus,
      action_taken: action === 'resolve',
    });
    return this.reportsRepository.findOne({ where: { id: reportId } }) as Promise<Report>;
  }

  async deactivateItem(itemId: string): Promise<void> {
    await this.reportsRepository.manager.query(
      `UPDATE items SET status = 'Entregado' WHERE id = $1`,
      [itemId]
    );
  }

  async deactivateUser(userId: string): Promise<void> {
    await this.usersService.update(userId, { is_verified: false });
  }
}