"use client";

import { useState, useRef, useEffect } from 'react';
import { useScanStore, ChatMessage } from '@/store/scanStore';
import { motion, AnimatePresence } from 'framer-motion';
import { Bot, User, Send, Sparkles, ChevronRight, AlertCircle } from 'lucide-react';

const SUGGESTED_QUESTIONS = [
    "What CDN is this site using?",
    "Is the TLS certificate secure?",
    "What frontend framework is detected?",
    "What's the hosting provider?",
];

function ConfidencePill({ value }: { value: number }) {
    const color =
        value >= 80 ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' :
            value >= 50 ? 'bg-amber-500/20 text-amber-400 border-amber-500/30' :
                'bg-red-500/20 text-red-400 border-red-500/30';
    return (
        <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border ${color} font-mono`}>
            {value}% confidence
        </span>
    );
}

function SkeletonBubble() {
    return (
        <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-cyan-500/20 flex items-center justify-center shrink-0">
                <Bot className="w-4 h-4 text-cyan-400" />
            </div>
            <div className="flex-1 space-y-2 max-w-[80%]">
                <div className="h-3 bg-white/10 rounded-full w-3/4 animate-pulse" />
                <div className="h-3 bg-white/10 rounded-full w-1/2 animate-pulse" />
            </div>
        </div>
    );
}

function MessageBubble({ msg, onSuggest }: { msg: ChatMessage; onSuggest: (q: string) => void }) {
    const isUser = msg.role === 'user';
    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`flex items-start gap-3 ${isUser ? 'flex-row-reverse' : ''}`}
        >
            {/* Avatar */}
            <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${isUser ? 'bg-white/10' : 'bg-cyan-500/20'}`}>
                {isUser
                    ? <User className="w-4 h-4 text-zinc-300" />
                    : <Bot className="w-4 h-4 text-cyan-400" />
                }
            </div>

            {/* Content */}
            <div className={`flex flex-col gap-2 max-w-[80%] ${isUser ? 'items-end' : 'items-start'}`}>
                <div className={`px-4 py-3 rounded-2xl text-sm leading-relaxed ${isUser
                        ? 'bg-white/10 text-zinc-200 rounded-tr-sm'
                        : 'bg-[#1a1a2e] border border-white/5 text-zinc-200 rounded-tl-sm'
                    }`}>
                    {msg.content}
                </div>

                {/* Metadata row */}
                {!isUser && msg.confidence !== undefined && (
                    <div className="flex flex-wrap gap-2 items-center">
                        <ConfidencePill value={msg.confidence} />
                        {msg.citations?.slice(0, 2).map((c, i) => (
                            <span key={i} className="text-xs text-zinc-500 bg-white/5 px-2 py-0.5 rounded-full border border-white/5 font-mono truncate max-w-[160px]" title={c}>
                                {c}
                            </span>
                        ))}
                    </div>
                )}

                {/* Suggested follow-ups */}
                {!isUser && msg.suggested_questions && msg.suggested_questions.length > 0 && (
                    <div className="flex flex-col gap-1 mt-1">
                        {msg.suggested_questions.slice(0, 2).map((q, i) => (
                            <button
                                key={i}
                                onClick={() => onSuggest(q)}
                                className="text-left text-xs text-cyan-400/70 hover:text-cyan-300 flex items-center gap-1 transition-colors group"
                            >
                                <ChevronRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                                {q}
                            </button>
                        ))}
                    </div>
                )}
            </div>
        </motion.div>
    );
}

export function QnAInterface() {
    const { chatHistory, isAiThinking, askQuestion, status, results } = useScanStore();
    const [input, setInput] = useState('');
    const bottomRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [chatHistory, isAiThinking]);

    const handleSend = (question?: string) => {
        const q = question || input.trim();
        if (!q || isAiThinking) return;
        setInput('');
        askQuestion(q);
    };

    if (status !== 'completed' || !results) return null;

    const isEmpty = chatHistory.length === 0;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="bg-[#0C0C0E] border border-white/10 rounded-xl overflow-hidden flex flex-col"
            style={{ height: '420px' }}
        >
            {/* Header */}
            <div className="flex items-center gap-3 px-5 py-4 border-b border-white/5">
                <div className="p-1.5 bg-cyan-500/10 rounded-lg">
                    <Sparkles className="w-4 h-4 text-cyan-400" />
                </div>
                <div>
                    <h3 className="text-sm font-semibold text-zinc-200">Ask AI</h3>
                    <p className="text-xs text-zinc-500">Answers grounded in scan evidence only</p>
                </div>
                <div className="ml-auto flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-xs text-zinc-500">Gemini</span>
                </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-5 space-y-5 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-white/10">
                {isEmpty && (
                    <div className="h-full flex flex-col items-center justify-center gap-4 text-center">
                        <p className="text-zinc-500 text-sm">Ask anything about this site's infrastructure</p>
                        <div className="flex flex-wrap gap-2 justify-center">
                            {SUGGESTED_QUESTIONS.map((q) => (
                                <button
                                    key={q}
                                    onClick={() => handleSend(q)}
                                    className="text-xs text-zinc-400 hover:text-cyan-300 bg-white/5 hover:bg-white/8 border border-white/10 hover:border-cyan-500/30 px-3 py-1.5 rounded-full transition-all"
                                >
                                    {q}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {chatHistory.map((msg) => (
                    <MessageBubble
                        key={msg.id}
                        msg={msg}
                        onSuggest={(q) => handleSend(q)}
                    />
                ))}

                {isAiThinking && <SkeletonBubble />}
                <div ref={bottomRef} />
            </div>

            {/* Input Bar */}
            <div className="px-4 py-3 border-t border-white/5">
                <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl px-4 py-2 focus-within:border-cyan-500/40 transition-colors">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                        placeholder="Ask about this site..."
                        disabled={isAiThinking}
                        className="flex-1 bg-transparent text-sm text-zinc-200 placeholder:text-zinc-600 outline-none disabled:opacity-50"
                    />
                    <button
                        onClick={() => handleSend()}
                        disabled={!input.trim() || isAiThinking}
                        className="p-1.5 bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-400 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    >
                        <Send className="w-4 h-4" />
                    </button>
                </div>
                <p className="text-[10px] text-zinc-600 mt-1.5 flex items-center gap-1 px-1">
                    <AlertCircle className="w-3 h-3" />
                    Only answers based on scan data — not general knowledge
                </p>
            </div>
        </motion.div>
    );
}
