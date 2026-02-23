import { useState } from 'react';
import { Search, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';

interface HeroSearchProps {
    onScan: (url: string) => void;
    isLoading?: boolean;
}

export function HeroSearch({ onScan, isLoading = false }: HeroSearchProps) {
    const [url, setUrl] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (url && !isLoading) {
            onScan(url);
        }
    };

    return (
        <div className="w-full max-w-3xl mx-auto flex flex-col items-center justify-center p-6 text-center">
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
            >
                <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-white mb-6">
                    Analyze Any Architecture
                    <br />
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">
                        In Seconds.
                    </span>
                </h1>
                <p className="text-zinc-400 text-lg md:text-xl max-w-2xl mx-auto mb-12">
                    Enter a URL and our engine will perform deep DNS, TLS, HTTP, and headless browsing analysis
                    to reverse-engineer and visualize the entire technology stack.
                </p>
            </motion.div>

            <motion.form
                onSubmit={handleSubmit}
                className="w-full relative group"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2, duration: 0.5 }}
            >
                <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 rounded-2xl blur-xl group-hover:blur-2xl transition-all duration-500 opacity-0 group-hover:opacity-100" />

                <div className="relative glass-panel rounded-2xl p-2 flex items-center shadow-2xl border border-white/10 ring-1 ring-black/5">
                    <div className="pl-4 pr-2 text-zinc-500">
                        <Search className="w-6 h-6" />
                    </div>

                    <input
                        type="url"
                        value={url}
                        onChange={(e) => setUrl(e.target.value)}
                        placeholder="https://example.com"
                        disabled={isLoading}
                        className="flex-1 bg-transparent border-none outline-none text-white text-lg placeholder:text-zinc-600 px-4 py-3 disabled:opacity-50"
                        required
                    />

                    <button
                        type="submit"
                        disabled={isLoading || !url}
                        className="bg-white text-black font-medium px-8 py-3 rounded-xl hover:bg-zinc-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                        {isLoading ? (
                            <>
                                <Loader2 className="w-5 h-5 animate-spin" />
                                <span>Scanning...</span>
                            </>
                        ) : (
                            <span>Analyze</span>
                        )}
                    </button>
                </div>
            </motion.form>

            <motion.div
                className="mt-8 flex gap-4 text-sm text-zinc-500"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
            >
                <span>Try:</span>
                <button onClick={() => setUrl('https://stripe.com')} className="hover:text-cyan-400 transition-colors">stripe.com</button>
                <button onClick={() => setUrl('https://vercel.com')} className="hover:text-cyan-400 transition-colors">vercel.com</button>
                <button onClick={() => setUrl('https://github.com')} className="hover:text-cyan-400 transition-colors">github.com</button>
            </motion.div>
        </div>
    );
}
