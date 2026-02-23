import { Module, Global } from '@nestjs/common';
import { ScanGateway } from './scan.gateway.js';

@Global()
@Module({
    providers: [ScanGateway],
    exports: [ScanGateway],
})
export class WebSocketModule { }
