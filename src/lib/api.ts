import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
const WORKER_BASE_URL = process.env.NEXT_PUBLIC_WORKER_URL || 'http://localhost:8000';

export const api = axios.create({
    baseURL: API_BASE_URL,
    headers: { 'Content-Type': 'application/json' },
});

export const workerApi = axios.create({
    baseURL: WORKER_BASE_URL,
    headers: { 'Content-Type': 'application/json' },
});

export interface CreateScanResponse {
    id: string;
    url: string;
    status: string;
}

export interface AskResponse {
    answer: string;
    confidence: number;
    citations: string[];
    suggested_questions: string[];
}

export const scanApi = {
    createScan: async (url: string): Promise<CreateScanResponse> => {
        const { data } = await api.post<CreateScanResponse>('/scans', { url });
        return data;
    },
    getScan: async (id: string) => {
        const { data } = await api.get(`/scans/${id}`);
        return data;
    },
};

export const aiApi = {
    askQuestion: async (question: string, context: Record<string, any>): Promise<AskResponse> => {
        const { data } = await workerApi.post<AskResponse>('/ai/ask', { question, context });
        return data;
    },
};
