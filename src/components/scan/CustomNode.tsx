import React, { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import { Globe, Server, Database, CloudRain, Cpu, Shield, Zap } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

const iconMap = {
    globe: Globe,
    server: Server,
    database: Database,
    cloud: CloudRain,
    cpu: Cpu,
    shield: Shield,
    zap: Zap,
};

export type CustomNodeType = keyof typeof iconMap;

interface CustomNodeProps {
    data: {
        label: string;
        sublabel?: string;
        icon: CustomNodeType;
        color?: string; // e.g. 'cyan', 'blue', 'green', 'purple', 'zinc'
        glowing?: boolean;
    };
}

const colorStyles: Record<string, string> = {
    cyan: 'border-cyan-500/50 bg-cyan-500/10 text-cyan-400 group-hover:border-cyan-400',
    blue: 'border-blue-500/50 bg-blue-500/10 text-blue-400 group-hover:border-blue-400',
    green: 'border-emerald-500/50 bg-emerald-500/10 text-emerald-400 group-hover:border-emerald-400',
    purple: 'border-purple-500/50 bg-purple-500/10 text-purple-400 group-hover:border-purple-400',
    zinc: 'border-zinc-500/50 bg-zinc-500/10 text-zinc-400 group-hover:border-zinc-400',
};

export const CustomNode = memo(({ data }: CustomNodeProps) => {
    const Icon = iconMap[data.icon] || Cpu;
    const colorClass = colorStyles[data.color || 'zinc'];

    return (
        <div className="group relative rounded-xl bg-[#0C0C0E]/80 backdrop-blur-md border border-white/10 p-4 min-w-[200px] shadow-2xl transition-all duration-300 hover:border-white/30">

            {data.glowing && (
                <div className={`absolute -inset-0.5 rounded-xl blur opacity-30 group-hover:opacity-50 transition duration-500 ${colorClass.split(' ')[1]}`} />
            )}

            {/* Input Handle */}
            <Handle
                type="target"
                position={Position.Top}
                className="w-3 h-3 border-2 border-[#0C0C0E] bg-zinc-500 transition-colors group-hover:bg-white"
            />

            <div className="relative flex items-center gap-4 z-10">
                <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center border transition-colors", colorClass)}>
                    <Icon className="w-5 h-5" />
                </div>

                <div className="flex flex-col">
                    <span className="text-sm font-bold text-white tracking-wide">{data.label}</span>
                    {data.sublabel && (
                        <span className="text-xs text-zinc-400 font-mono mt-0.5">{data.sublabel}</span>
                    )}
                </div>
            </div>

            {/* Output Handle */}
            <Handle
                type="source"
                position={Position.Bottom}
                className="w-3 h-3 border-2 border-[#0C0C0E] bg-zinc-500 transition-colors group-hover:bg-white"
            />
        </div>
    );
});

CustomNode.displayName = 'CustomNode';
