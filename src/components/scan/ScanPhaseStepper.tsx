"use client";

import { useScanStore } from '@/store/scanStore';
import { motion } from 'framer-motion';
import { Check, CircleDashed, Globe, Shield, FileCode2, Cpu, Activity } from 'lucide-react';

const PHASES = [
    { id: 'Initializing', label: 'Queued', progressTarget: 0, icon: Activity },
    { id: 'DNS Resolution', label: 'DNS Stack', progressTarget: 20, icon: Globe },
    { id: 'TLS Analysis', label: 'Security', progressTarget: 40, icon: Shield },
    { id: 'HTTP Analysis', label: 'HTTP Layer', progressTarget: 60, icon: FileCode2 },
    { id: 'Page Crawling', label: 'DOM & Network', progressTarget: 80, icon: Activity },
    { id: 'Architecture Inference', label: 'Inference', progressTarget: 100, icon: Cpu },
];

export function ScanPhaseStepper() {
    const { progress, status, currentPhase } = useScanStore();

    if (status === 'idle') return null;

    return (
        <div className="w-full h-full flex flex-col justify-center max-w-sm mx-auto p-6 md:p-8 bg-[#0C0C0E] border border-white/10 rounded-xl overflow-hidden shadow-2xl relative group">
            <div className="pointer-events-none absolute inset-0 rounded-xl ring-1 ring-inset ring-white/10 group-hover:ring-white/20 transition-all duration-300" />
            <h3 className="text-zinc-400 font-medium mb-8 text-sm uppercase tracking-wider">Analysis Pipeline</h3>
            <div className="flex flex-col relative flex-1 justify-between">
                {/* Vertical Animated progress line */}
                <div className="absolute left-[19px] top-6 bottom-6 w-[2px] bg-white/5 rounded-full overflow-hidden">
                    <div
                        className="w-full bg-gradient-to-b from-cyan-400 to-blue-500 transition-all duration-500 ease-out shadow-[0_0_8px_rgba(6,182,212,0.8)]"
                        style={{ height: `${Math.max(0, Math.min(100, (progress / 100) * 100))}%` }}
                    />
                </div>

                {PHASES.map((phase, index) => {
                    const Icon = phase.icon;

                    let state: 'waiting' | 'active' | 'completed' | 'error' = 'waiting';

                    if (status === 'failed') {
                        state = currentPhase === phase.id || (progress >= phase.progressTarget && progress < (PHASES[index + 1]?.progressTarget || 101)) ? 'error' : 'waiting';
                    } else if (status === 'completed') {
                        state = 'completed';
                    } else {
                        const isPastPhase = progress >= phase.progressTarget && (index === PHASES.length - 1 || progress >= PHASES[index + 1].progressTarget);
                        const isCurrentPhase = currentPhase === phase.id || (progress >= phase.progressTarget && (index === PHASES.length - 1 || progress < PHASES[index + 1].progressTarget));
                        if (isPastPhase) state = 'completed';
                        else if (isCurrentPhase) state = 'active';
                    }

                    return (
                        <div key={phase.id} className="relative z-10 flex flex-row items-center gap-6">
                            <motion.div
                                layout
                                className={`w-10 h-10 rounded-full flex items-center justify-center border-2 shrink-0 bg-[#0C0C0E] transition-colors duration-300 ${state === 'completed' ? 'border-cyan-500 bg-cyan-500/10 text-cyan-400' :
                                        state === 'active' ? 'border-white text-white shadow-[0_0_15px_rgba(255,255,255,0.3)]' :
                                            state === 'error' ? 'border-red-500 bg-red-500/10 text-red-500' :
                                                'border-white/10 text-zinc-600'
                                    }`}
                            >
                                {state === 'completed' ? (
                                    <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}>
                                        <Check className="w-5 h-5" />
                                    </motion.div>
                                ) : state === 'active' ? (
                                    <motion.div animate={{ rotate: 360 }} transition={{ duration: 4, repeat: Infinity, ease: "linear" }}>
                                        <CircleDashed className="w-5 h-5" />
                                    </motion.div>
                                ) : (
                                    <Icon className="w-4 h-4" />
                                )}
                            </motion.div>

                            <div className="flex flex-col">
                                <span className={`text-base font-medium transition-colors ${state === 'active' || state === 'completed' ? 'text-zinc-200' :
                                        state === 'error' ? 'text-red-400' :
                                            'text-zinc-500'
                                    }`}>
                                    {phase.label}
                                </span>
                                {state === 'active' && (
                                    <span className="text-xs text-cyan-400 animate-pulse">
                                        Scanning...
                                    </span>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
