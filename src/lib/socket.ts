import { io, Socket } from 'socket.io-client';

const WS_URL = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:3001/scan';

class SocketService {
    private socket: Socket | null = null;
    private currentRoom: string | null = null;

    connect() {
        if (!this.socket) {
            this.socket = io(WS_URL, {
                transports: ['websocket'],
                autoConnect: true,
            });

            this.socket.on('connect', () => {
                console.log('Connected to WebSocket Gateway');
            });

            this.socket.on('disconnect', () => {
                console.log('Disconnected from WebSocket Gateway');
            });
        }
        return this.socket;
    }

    joinScan(scanId: string) {
        if (!this.socket) this.connect();

        // Leave previous room if any
        if (this.currentRoom && this.currentRoom !== scanId) {
            this.socket?.emit('leaveScan', this.currentRoom);
        }

        this.currentRoom = scanId;
        this.socket?.emit('joinScan', scanId);
    }

    leaveScan(scanId: string) {
        if (this.socket && this.currentRoom === scanId) {
            this.socket.emit('leaveScan', scanId);
            this.currentRoom = null;
        }
    }

    getSocket() {
        return this.socket;
    }

    disconnect() {
        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
        }
    }
}

export const socketService = new SocketService();
