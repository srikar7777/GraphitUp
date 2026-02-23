import { OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
export interface ScanProgressPayload {
    scanId: string;
    phase: string;
    progress: number;
    message: string;
    data?: Record<string, any>;
}
export interface ScanCompletePayload {
    scanId: string;
    result: Record<string, any>;
}
export interface ScanErrorPayload {
    scanId: string;
    error: string;
}
export declare class ScanGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
    server: Server;
    private readonly logger;
    afterInit(): void;
    handleConnection(client: Socket): void;
    handleDisconnect(client: Socket): void;
    handleSubscribe(data: {
        scanId: string;
    }, client: Socket): {
        event: string;
        data: {
            scanId: string;
        };
    };
    handleUnsubscribe(data: {
        scanId: string;
    }, client: Socket): {
        event: string;
        data: {
            scanId: string;
        };
    };
    emitProgress(payload: ScanProgressPayload): void;
    emitComplete(payload: ScanCompletePayload): void;
    emitError(payload: ScanErrorPayload): void;
}
