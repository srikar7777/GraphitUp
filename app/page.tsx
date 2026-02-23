"use client";

import { useScanStore } from "@/store/scanStore";
import { HeroSearch } from "@/components/ui/HeroSearch";
import { ScanDashboard } from "@/components/scan/ScanDashboard";
import { motion, AnimatePresence } from "framer-motion";

export default function Home() {
    const { status, startScan } = useScanStore();
    const isIdle = status === 'idle';

    return (
        <main className="min-h-screen bg-[#060608] selection:bg-cyan-500/30">
            {/* Premium subtle grid background */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />
            <div className="absolute left-0 right-0 top-0 -z-10 m-auto h-[310px] w-[310px] rounded-full bg-cyan-500 opacity-20 blur-[100px]" />

            <div className="container mx-auto px-4 py-12 md:py-24 relative z-10">

                <AnimatePresence mode="wait">
                    {isIdle ? (
                        <motion.div
                            key="hero"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0, scale: 0.95, filter: "blur(10px)" }}
                            transition={{ duration: 0.4 }}
                            className="min-h-[60vh] flex items-center"
                        >
                            <HeroSearch onScan={startScan} />
                        </motion.div>
                    ) : (
                        <motion.div
                            key="dashboard"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 0.5 }}
                        >
                            <ScanDashboard />
                        </motion.div>
                    )}
                </AnimatePresence>

            </div>
        </main>
    );
}
