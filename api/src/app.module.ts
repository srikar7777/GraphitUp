import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bull';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { ScanModule } from './scan/scan.module.js';
import { WebSocketModule } from './websocket/websocket.module.js';
import { QueueModule } from './queue/queue.module.js';
import { ValidationModule } from './validation/url-validation.module.js';
import { Scan } from './scan/entities/scan.entity.js';

@Module({
  imports: [
    // Environment variables
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),

    // PostgreSQL via Neon
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres' as const,
        url: config.get<string>('DATABASE_URL'),
        entities: [Scan],
        synchronize: config.get<string>('NODE_ENV') !== 'production', // Disable in prod for safety
        ssl: {
          rejectUnauthorized: false,
        },
        logging: config.get<string>('NODE_ENV') === 'development',
      }),
    }),

    // Redis via Upstash for Bull queues
    BullModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const redisUrl = config.get<string>('REDIS_URL');
        if (!redisUrl) {
          return { redis: { host: 'localhost', port: 6379 } };
        }

        // Parse Upstash Redis URL
        const url = new URL(redisUrl);
        return {
          redis: {
            host: url.hostname,
            port: parseInt(url.port || '6379', 10),
            password: url.password,
            tls: url.protocol === 'https:' || url.protocol === 'rediss:' ? {} : undefined,
            maxRetriesPerRequest: 3,
          },
        };
      },
    }),

    // Feature modules
    ValidationModule,
    WebSocketModule,
    ScanModule,
    QueueModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
