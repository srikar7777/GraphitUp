import { useScanStore } from '@/store/scanStore';
import { Network, Lock, Server, Layers } from 'lucide-react';
import { motion } from 'framer-motion';

function InfoCard({ title, icon: Icon, children }: { title: string, icon: any, children: React.ReactNode }) {
    return (
        <div className="glass-panel p-6 rounded-xl border border-white/5 bg-white/[0.02]">
            <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-white/5 rounded-lg text-cyan-400">
                    <Icon className="w-5 h-5" />
                </div>
                <h3 className="text-zinc-200 font-medium">{title}</h3>
            </div>
            {children}
        </div>
    );
}

function DataRow({ label, value }: { label: string, value: string | number | boolean | undefined }) {
    if (value === undefined || value === null || value === '') return null;
    return (
        <div className="flex justify-between items-center py-2 border-b border-white/5 last:border-0 text-sm">
            <span className="text-zinc-500">{label}</span>
            <span className="text-zinc-200 font-mono text-right max-w-[60%] truncate" title={String(value)}>{String(value)}</span>
        </div>
    );
}

export function ResultsPanel() {
    const { results, status } = useScanStore();

    if (status !== 'completed' || !results) return null;

    const dns = results.dns?.data;
    const tls = results.tls?.data;
    const http = results.http?.data;
    const crawl = results.crawl?.data;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-8"
        >
            <InfoCard title="Network & Routing" icon={Network}>
                <DataRow label="Resolved IP" value={dns?.records?.A?.[0]} />
                <DataRow label="Provider/CDN" value={dns?.provider} />
                <DataRow label="Nameservers" value={dns?.records?.NS?.length} />
                <DataRow label="Response Time" value={`${dns?.responseTime}ms`} />
            </InfoCard>

            <InfoCard title="Security & TLS" icon={Lock}>
                <DataRow label="Protocol" value={tls?.version} />
                <DataRow label="Cipher Suite" value={tls?.cipher?.split('-')[0] + '...'} />
                <DataRow label="Issuer" value={tls?.certificate_issuer} />
                <DataRow label="HSTS Enabled" value={tls?.hsts ? 'Yes' : 'No'} />
            </InfoCard>

            <InfoCard title="Server Technologies" icon={Server}>
                <DataRow label="Server" value={http?.headers?.server} />
                <DataRow label="Framework" value={http?.technologies?.framework || 'Unknown'} />
                <DataRow label="Language" value={http?.technologies?.language || 'Unknown'} />
                <DataRow label="Status Code" value={http?.status_code} />
            </InfoCard>

            <InfoCard title="Frontend Metrics" icon={Layers}>
                <DataRow label="Third Party Tools" value={crawl?.third_party?.length} />
                <DataRow label="Scripts Loaded" value={crawl?.resources?.scripts} />
                <DataRow label="Load Time" value={`${crawl?.performance?.load_time_ms}ms`} />
                <DataRow label="Total Bytes" value={`${Math.round(crawl?.performance?.encoded_body_size / 1024)} KB`} />
            </InfoCard>
        </motion.div>
    );
}
