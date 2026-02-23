"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const typeorm_1 = require("@nestjs/typeorm");
const bull_1 = require("@nestjs/bull");
const app_controller_js_1 = require("./app.controller.js");
const app_service_js_1 = require("./app.service.js");
const scan_module_js_1 = require("./scan/scan.module.js");
const websocket_module_js_1 = require("./websocket/websocket.module.js");
const queue_module_js_1 = require("./queue/queue.module.js");
const url_validation_module_js_1 = require("./validation/url-validation.module.js");
const scan_entity_js_1 = require("./scan/entities/scan.entity.js");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({
                isGlobal: true,
                envFilePath: '.env',
            }),
            typeorm_1.TypeOrmModule.forRootAsync({
                imports: [config_1.ConfigModule],
                inject: [config_1.ConfigService],
                useFactory: (config) => ({
                    type: 'postgres',
                    url: config.get('DATABASE_URL'),
                    entities: [scan_entity_js_1.Scan],
                    synchronize: true,
                    ssl: {
                        rejectUnauthorized: false,
                    },
                    logging: config.get('NODE_ENV') === 'development',
                }),
            }),
            bull_1.BullModule.forRootAsync({
                imports: [config_1.ConfigModule],
                inject: [config_1.ConfigService],
                useFactory: (config) => {
                    const redisUrl = config.get('REDIS_URL');
                    if (!redisUrl) {
                        return { redis: { host: 'localhost', port: 6379 } };
                    }
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
            url_validation_module_js_1.ValidationModule,
            websocket_module_js_1.WebSocketModule,
            scan_module_js_1.ScanModule,
            queue_module_js_1.QueueModule,
        ],
        controllers: [app_controller_js_1.AppController],
        providers: [app_service_js_1.AppService],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map