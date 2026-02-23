"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const common_1 = require("@nestjs/common");
const app_module_js_1 = require("./app.module.js");
async function bootstrap() {
    const logger = new common_1.Logger('Bootstrap');
    const app = await core_1.NestFactory.create(app_module_js_1.AppModule);
    app.enableCors({
        origin: [
            'http://localhost:3000',
            'https://graphit-up.vercel.app',
            /\.vercel\.app$/,
        ],
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
        credentials: true,
    });
    app.useGlobalPipes(new common_1.ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        transformOptions: {
            enableImplicitConversion: true,
        },
    }));
    app.setGlobalPrefix('api', {
        exclude: ['health'],
    });
    const port = process.env.PORT ?? 3001;
    await app.listen(port);
    logger.log(`🚀 graphitUp API running on http://localhost:${port}`);
    logger.log(`📡 WebSocket available at ws://localhost:${port}/scan`);
    logger.log(`❤️  Health check: http://localhost:${port}/health`);
}
bootstrap();
//# sourceMappingURL=main.js.map