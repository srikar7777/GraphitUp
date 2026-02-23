import { useEffect, useRef } from 'react';
import { useScanStore, LogMessage } from '@/store/scanStore';
import { Terminal } from 'lucide-react';

export function TerminalLog() {
    const { logs, status, currentPhase } = useScanStore();
    const bottomRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (bottomRef.current) {
            bottomRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [logs]);

    if (logs.length === 0 && status === 'idle') return null;

    return (
        <div className="w-full h-full flex flex-col bg-[#0C0C0E] border border-white/10 rounded-xl overflow-hidden shadow-2xl font-mono text-sm relative group">
            {/* Mac OS Style Header */}
            <div className="h-10 bg-white/5 border-b border-white/5 flex items-center px-4 shrink-0">
                <div className="flex gap-2">
                    <div className="w-3 h-3 rounded-full bg-red-500/80 border border-red-500/50" />
                    <div className="w-3 h-3 rounded-full bg-yellow-500/80 border border-yellow-500/50" />
                    <div className="w-3 h-3 rounded-full bg-green-500/80 border border-green-500/50" />
                </div>
                <div className="flex-1 flex justify-center items-center text-xs text-zinc-500 gap-2">
                    <Terminal className="w-3 h-3" />
                    <span>worker-engine</span>
                </div>
            </div>

            {/* Terminal Log Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-2 text-zinc-300">
                {logs.map((log) => (
                    <div key={log.id} className="flex gap-4 group/line hover:bg-white/[0.02] -mx-4 px-4 py-0.5 rounded transition-colors duration-100">
                        <span className="text-zinc-600 shrink-0 select-none">
                            {new Date(log.timestamp).toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                        </span>
                        <span className="text-cyan-400/80 shrink-0 w-32 truncate hidden sm:block">[{log.phase}]</span>
                        <span className="flex-1 text-zinc-300 break-all">
                            {log.message.startsWith('Fatal Error') ? (
                                <span className="text-red-400">{log.message}</span>
                            ) : log.phase === 'Complete' ? (
                                <span className="text-green-400">{log.message}</span>
                            ) : (
                                log.message
                            )}
                        </span>
                    </div>
                ))}

                {status === 'scanning' && (
                    <div className="flex gap-4 animate-pulse pt-2">
                        <span className="text-zinc-600">--:--:--</span>
                        <span className="text-amber-500 shrink-0 w-32 hidden sm:block">[{currentPhase}]</span>
                        <span className="text-zinc-500">Awaiting response...</span>
                    </div>
                )}

                <div ref={bottomRef} />
            </div>

            {/* Glow effect overlay */}
            <div className="pointer-events-none absolute inset-0 rounded-xl ring-1 ring-inset ring-white/10 group-hover:ring-white/20 transition-all duration-300" />
            <div className="pointer-events-none absolute bottom-0 inset-x-0 h-16 bg-gradient-to-t from-[#0C0C0E] to-transparent" />
        </div>
    );
}
