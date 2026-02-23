"use client";

import { useScanStore } from '@/store/scanStore';
import { motion, AnimatePresence } from 'framer-motion';
import { ScanPhaseStepper } from './ScanPhaseStepper';
import { TerminalLog } from './TerminalLog';
import { ResultsPanel } from './ResultsPanel';
import { QnAInterface } from './QnAInterface';
import ArchitectureViewer from '@/components/ArchitectureViewer';

export function ScanDashboard() {
    const { status, url } = useScanStore();

    if (status === 'idle') return null;

    return (
        <motion.div
            className="w-full h-full min-h-[calc(100vh-120px)] flex flex-col pt-8"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        >
            <div className="flex justify-between items-end mb-8 px-6">
                <div>
                    <h2 className="text-2xl font-bold text-white mb-1">Analysis Report</h2>
                    <p className="text-zinc-400 flex items-center gap-2">
                        Target: <span className="text-cyan-400 font-mono bg-cyan-400/10 px-2 py-0.5 rounded">{url}</span>
                    </p>
                </div>
            </div>

            {/* Main Layout Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1 px-6">

                {/* Left Column: Phases & Logs */}
                <div className="lg:col-span-4 flex flex-col gap-6 h-[800px]">
                    <div className="flex-1">
                        <ScanPhaseStepper />
                    </div>
                    <div className="h-64 shrink-0">
                        <TerminalLog />
                    </div>
                </div>

                {/* Right Column: Interactive Architecture Map & Extracted Results */}
                <div className="lg:col-span-8 flex flex-col gap-6 h-[800px]">
                    <div className="flex-1 w-full bg-[#0C0C0E] border border-white/10 rounded-xl overflow-hidden shadow-2xl relative group">
                        <div className="pointer-events-none absolute inset-0 z-10 rounded-xl ring-1 ring-inset ring-white/10 group-hover:ring-white/20 transition-all duration-300" />
                        <div className="absolute top-4 left-4 z-10 bg-black/50 backdrop-blur-md px-3 py-1.5 rounded-lg border border-white/10 text-xs font-semibold tracking-wider text-zinc-300 uppercase">
                            Infrastructure Map
                        </div>
                        <ArchitectureViewer />
                    </div>

                    <AnimatePresence>
                        {status === 'completed' && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="shrink-0 flex flex-col gap-6"
                            >
                                <div className="px-1"><h3 className="text-lg font-bold text-white">Extracted Telemetry</h3></div>
                                <ResultsPanel />
                                <QnAInterface />
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

            </div>
        </motion.div>
    );
}
