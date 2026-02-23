import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';

@Injectable()
export class AppService {
  constructor(private readonly dataSource: DataSource) { }

  getInfo() {
    return {
      name: 'graphitUp API',
      version: '1.0.0',
      description: 'Interactive System Architecture Visualizer',
      docs: '/api',
    };
  }

  async getHealth() {
    const health: Record<string, any> = {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      services: {},
    };

    // Check database
    try {
      await this.dataSource.query('SELECT 1');
      health.services.database = { status: 'connected', type: 'PostgreSQL (Neon)' };
    } catch (error) {
      health.services.database = {
        status: 'disconnected',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
      health.status = 'degraded';
    }

    return health;
  }
}
