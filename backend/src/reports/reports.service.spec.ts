import { Test, TestingModule } from '@nestjs/testing';
import { ReportsService } from './reports.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Report } from './report.entity';
import { UsersService } from '../users/users.service';

describe('ReportsService', () => {
  let service: ReportsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReportsService,
        { provide: getRepositoryToken(Report), useValue: {} },
        { provide: UsersService, useValue: {} },
      ],
    }).compile();
    service = module.get<ReportsService>(ReportsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});