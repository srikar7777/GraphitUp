import { create } from 'zustand';
import { scanApi, aiApi } from '@/lib/api';
import { socketService } from '@/lib/socket';

export type ScanStatus = 'idle' | 'scanning' | 'completed' | 'failed';

export interface LogMessage {
    id: string;
    timestamp: string;
    phase: string;
    message: string;
    progress: number;
}

export interface ChatMessage {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    confidence?: number;
    citations?: string[];
    suggested_questions?: string[];
    isLoading?: boolean;
}

interface ScanState {
    // State
    url: string;
    status: ScanStatus;
    scanId: string | null;
    progress: number;
    currentPhase: string | null;
    logs: LogMessage[];
    results: Record<string, any> | null;
    error: string | null;
    chatHistory: ChatMessage[];
    isAiThinking: boolean;

    // Actions
    setUrl: (url: string) => void;
    startScan: (url: string) => Promise<void>;
    reset: () => void;
    askQuestion: (question: string) => Promise<void>;

    // Socket listeners setup
    initSocketListeners: () => void;
    cleanupSocketListeners: () => void;
}

export const useScanStore = create<ScanState>((set, get) => ({
    url: '',
    status: 'idle',
    scanId: null,
    progress: 0,
    currentPhase: null,
    logs: [],
    results: null,
    error: null,
    chatHistory: [],
    isAiThinking: false,

    setUrl: (url) => set({ url }),

    startScan: async (url) => {
        set({
            url,
            status: 'scanning',
            error: null,
            progress: 0,
            currentPhase: 'Initializing',
            logs: [],
            results: null
        });

        try {
            const response = await scanApi.createScan(url);
            set({ scanId: response.id });

            const { initSocketListeners } = get();
            initSocketListeners();

        } catch (error: any) {
            set({
                status: 'failed',
                error: error.response?.data?.message || error.message || 'Failed to start scan',
            });
        }
    },

    reset: () => {
        const { scanId, cleanupSocketListeners } = get();
        if (scanId) {
            cleanupSocketListeners();
        }
        set({
            url: '',
            status: 'idle',
            scanId: null,
            progress: 0,
            currentPhase: null,
            logs: [],
            results: null,
            error: null,
            chatHistory: [],
            isAiThinking: false,
        });
    },

    askQuestion: async (question: string) => {
        const { results, chatHistory } = get();
        if (!results || !question.trim()) return;

        const userMsg: ChatMessage = {
            id: Math.random().toString(36).substring(7),
            role: 'user',
            content: question,
        };
        const loadingMsg: ChatMessage = {
            id: 'loading',
            role: 'assistant',
            content: '',
            isLoading: true,
        };

        set({ chatHistory: [...chatHistory, userMsg, loadingMsg], isAiThinking: true });

        try {
            const response = await aiApi.askQuestion(question, results);
            const assistantMsg: ChatMessage = {
                id: Math.random().toString(36).substring(7),
                role: 'assistant',
                content: response.answer,
                confidence: response.confidence,
                citations: response.citations,
                suggested_questions: response.suggested_questions,
            };
            set((state) => ({
                chatHistory: state.chatHistory.filter(m => m.id !== 'loading').concat(assistantMsg),
                isAiThinking: false,
            }));
        } catch {
            const errorMsg: ChatMessage = {
                id: Math.random().toString(36).substring(7),
                role: 'assistant',
                content: 'Could not reach the AI service. Make sure the worker is running.',
            };
            set((state) => ({
                chatHistory: state.chatHistory.filter(m => m.id !== 'loading').concat(errorMsg),
                isAiThinking: false,
            }));
        }
    },

    initSocketListeners: () => {
        const { scanId } = get();
        if (!scanId) return;

        const socket = socketService.connect();
        socketService.joinScan(scanId);

        // Remove old listeners to prevent duplicates
        socket.off('scanProgress');
        socket.off('scanComplete');
        socket.off('scanError');

        socket.on('scanProgress', (data: any) => {
            set((state) => ({
                progress: data.progress,
                currentPhase: data.phase,
                logs: [...state.logs, {
                    id: Math.random().toString(36).substring(7),
                    timestamp: new Date().toISOString(),
                    phase: data.phase,
                    message: data.message,
                    progress: data.progress,
                }],
            }));
        });

        socket.on('scanComplete', (data: any) => {
            set((state) => ({
                status: 'completed',
                progress: 100,
                currentPhase: 'Complete',
                results: data.result,
                logs: [...state.logs, {
                    id: Math.random().toString(36).substring(7),
                    timestamp: new Date().toISOString(),
                    phase: 'Complete',
                    message: 'Analysis finished successfully',
                    progress: 100,
                }],
            }));
            get().cleanupSocketListeners();
        });

        socket.on('scanError', (data: any) => {
            set((state) => ({
                status: 'failed',
                error: data.error,
                logs: [...state.logs, {
                    id: Math.random().toString(36).substring(7),
                    timestamp: new Date().toISOString(),
                    phase: 'Error',
                    message: `Fatal Error: ${data.error}`,
                    progress: state.progress,
                }],
            }));
            get().cleanupSocketListeners();
        });
    },

    cleanupSocketListeners: () => {
        const { scanId } = get();
        if (scanId) {
            socketService.leaveScan(scanId);
        }
    },
}));
