import {
    WebSocketGateway,
    WebSocketServer,
    SubscribeMessage,
    MessageBody,
    ConnectedSocket,
    OnGatewayInit,
    OnGatewayConnection,
    OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
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

@WebSocketGateway({
    namespace: '/scan',
    cors: {
        origin: '*',
        methods: ['GET', 'POST'],
    },
})
export class ScanGateway
    implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
    @WebSocketServer()
    server: Server;

    private readonly logger = new Logger(ScanGateway.name);

    afterInit() {
        this.logger.log('WebSocket Gateway initialized');
    }

    handleConnection(client: Socket) {
        this.logger.log(`Client connected: ${client.id}`);
    }

    handleDisconnect(client: Socket) {
        this.logger.log(`Client disconnected: ${client.id}`);
    }

    @SubscribeMessage('subscribe')
    handleSubscribe(
        @MessageBody() data: { scanId: string },
        @ConnectedSocket() client: Socket,
    ) {
        const room = `scan-${data.scanId}`;
        client.join(room);
        this.logger.log(`Client ${client.id} subscribed to ${room}`);
        return { event: 'subscribed', data: { scanId: data.scanId } };
    }

    @SubscribeMessage('unsubscribe')
    handleUnsubscribe(
        @MessageBody() data: { scanId: string },
        @ConnectedSocket() client: Socket,
    ) {
        const room = `scan-${data.scanId}`;
        client.leave(room);
        this.logger.log(`Client ${client.id} unsubscribed from ${room}`);
        return { event: 'unsubscribed', data: { scanId: data.scanId } };
    }

    emitProgress(payload: ScanProgressPayload) {
        const room = `scan-${payload.scanId}`;
        this.server.to(room).emit('scan:progress', payload);
        this.logger.debug(
            `Progress emitted for scan ${payload.scanId}: ${payload.phase} ${payload.progress}%`,
        );
    }

    emitComplete(payload: ScanCompletePayload) {
        const room = `scan-${payload.scanId}`;
        this.server.to(room).emit('scan:complete', payload);
        this.logger.log(`Scan ${payload.scanId} completed`);
    }

    emitError(payload: ScanErrorPayload) {
        const room = `scan-${payload.scanId}`;
        this.server.to(room).emit('scan:error', payload);
        this.logger.error(`Scan ${payload.scanId} error: ${payload.error}`);
    }
}
