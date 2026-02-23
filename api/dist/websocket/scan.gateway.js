"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var ScanGateway_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ScanGateway = void 0;
const websockets_1 = require("@nestjs/websockets");
const common_1 = require("@nestjs/common");
const socket_io_1 = require("socket.io");
let ScanGateway = ScanGateway_1 = class ScanGateway {
    server;
    logger = new common_1.Logger(ScanGateway_1.name);
    afterInit() {
        this.logger.log('WebSocket Gateway initialized');
    }
    handleConnection(client) {
        this.logger.log(`Client connected: ${client.id}`);
    }
    handleDisconnect(client) {
        this.logger.log(`Client disconnected: ${client.id}`);
    }
    handleSubscribe(data, client) {
        const room = `scan-${data.scanId}`;
        client.join(room);
        this.logger.log(`Client ${client.id} subscribed to ${room}`);
        return { event: 'subscribed', data: { scanId: data.scanId } };
    }
    handleUnsubscribe(data, client) {
        const room = `scan-${data.scanId}`;
        client.leave(room);
        this.logger.log(`Client ${client.id} unsubscribed from ${room}`);
        return { event: 'unsubscribed', data: { scanId: data.scanId } };
    }
    emitProgress(payload) {
        const room = `scan-${payload.scanId}`;
        this.server.to(room).emit('scan:progress', payload);
        this.logger.debug(`Progress emitted for scan ${payload.scanId}: ${payload.phase} ${payload.progress}%`);
    }
    emitComplete(payload) {
        const room = `scan-${payload.scanId}`;
        this.server.to(room).emit('scan:complete', payload);
        this.logger.log(`Scan ${payload.scanId} completed`);
    }
    emitError(payload) {
        const room = `scan-${payload.scanId}`;
        this.server.to(room).emit('scan:error', payload);
        this.logger.error(`Scan ${payload.scanId} error: ${payload.error}`);
    }
};
exports.ScanGateway = ScanGateway;
__decorate([
    (0, websockets_1.WebSocketServer)(),
    __metadata("design:type", socket_io_1.Server)
], ScanGateway.prototype, "server", void 0);
__decorate([
    (0, websockets_1.SubscribeMessage)('subscribe'),
    __param(0, (0, websockets_1.MessageBody)()),
    __param(1, (0, websockets_1.ConnectedSocket)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, socket_io_1.Socket]),
    __metadata("design:returntype", void 0)
], ScanGateway.prototype, "handleSubscribe", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('unsubscribe'),
    __param(0, (0, websockets_1.MessageBody)()),
    __param(1, (0, websockets_1.ConnectedSocket)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, socket_io_1.Socket]),
    __metadata("design:returntype", void 0)
], ScanGateway.prototype, "handleUnsubscribe", null);
exports.ScanGateway = ScanGateway = ScanGateway_1 = __decorate([
    (0, websockets_1.WebSocketGateway)({
        namespace: '/scan',
        cors: {
            origin: '*',
            methods: ['GET', 'POST'],
        },
    })
], ScanGateway);
//# sourceMappingURL=scan.gateway.js.map