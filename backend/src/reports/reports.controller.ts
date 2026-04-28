import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ReportsService } from './reports.service';
import { ReportCategory, ReportTargetType } from './report.entity';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('reports')
@UseGuards(JwtAuthGuard)
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Post()
  createReport(
    @Request() req,
    @Body()
    body: {
      target_type: ReportTargetType;
      target_id: string;
      category: ReportCategory;
      description?: string;
    },
  ) {
    return this.reportsService.createReport(
      req.user.sub,
      body.target_type,
      body.target_id,
      body.category,
      body.description,
    );
  }

  @Get('admin')
  getAllReports() {
    return this.reportsService.getAllReports();
  }

  @Patch('admin/:id')
  reviewReport(
    @Param('id') id: string,
    @Body() body: { action: 'resolve' | 'discard' },
  ) {
    return this.reportsService.reviewReport(id, body.action);
  }

  @Patch('admin/items/:id/deactivate')
  deactivateItem(@Param('id') id: string) {
    return this.reportsService.deactivateItem(id);
  }

  @Patch('admin/users/:id/deactivate')
  deactivateUser(@Param('id') id: string) {
    return this.reportsService.deactivateUser(id);
  }
}
