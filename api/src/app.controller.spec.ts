import { Test, TestingModule } from '@nestjs/testing';
import { DataSource } from 'typeorm';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';

describe('AppController', () => {
  let appController: AppController;
  let mockDataSource: any;

  beforeEach(async () => {
    mockDataSource = {
      query: jest.fn().mockResolvedValue([{ '?column?': 1 }]),
    };

    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [
        AppService,
        {
          provide: DataSource,
          useValue: mockDataSource,
        },
      ],
    }).compile();

    appController = app.get<AppController>(AppController);
  });

  describe('getInfo', () => {
    it('should return API info', () => {
      expect(appController.getInfo()).toHaveProperty('name', 'graphitUp API');
    });
  });

  describe('getHealth', () => {
    it('should return health status', async () => {
      const health = await appController.getHealth();
      expect(health).toHaveProperty('status', 'ok');
      expect(health.services.database).toHaveProperty('status', 'connected');
      expect(mockDataSource.query).toHaveBeenCalledWith('SELECT 1');
    });
  });
});
