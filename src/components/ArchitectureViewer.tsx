"use client";

import { useMemo, useEffect, useState } from "react";
import {
    ReactFlow,
    Background,
    Controls,
    MiniMap,
    Node,
    Edge,
    MarkerType,
    useNodesState,
    useEdgesState,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { CustomNode } from "./scan/CustomNode";
import { useScanStore } from "@/store/scanStore";

const nodeTypes = {
    custom: CustomNode,
};

// Layout constants
const X_CENTER = 400;
const Y_SPACING = 150;

/**
 * Transforms the raw inference and analysis data into a React Flow graph
 */
export default function ArchitectureViewer() {
    const { results, status } = useScanStore();
    const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
    const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);

    useEffect(() => {
        if (status !== 'completed' || !results) return;

        const inference = results.inference?.data?.architecture;
        const http = results.http?.data?.technologies;
        const dns = results.dns?.data;

        const newNodes: Node[] = [];
        const newEdges: Edge[] = [];

        let currentY = 50;

        // 1. User/Browser Entry Point
        newNodes.push({
            id: "browser",
            type: "custom",
            position: { x: X_CENTER, y: currentY },
            data: { label: "Client Browser", sublabel: "End User", icon: "globe", color: "blue", glowing: true },
        });

        // 2. DNS / CDN Layer
        currentY += Y_SPACING;
        const cdnLabel = dns?.provider || inference?.infrastructure?.cdn || "DNS / CDN";
        newNodes.push({
            id: "cdn",
            type: "custom",
            position: { x: X_CENTER, y: currentY },
            data: { label: cdnLabel, sublabel: "Edge Network", icon: "cloud", color: "cyan" },
        });

        newEdges.push({
            id: "e-browser-cdn",
            source: "browser",
            target: "cdn",
            animated: true,
            style: { stroke: "#22d3ee", strokeWidth: 2 },
            markerEnd: { type: MarkerType.ArrowClosed, color: "#22d3ee" },
        });

        // 3. Web Server / Load Balancer
        currentY += Y_SPACING;
        const serverLabel = http?.server || inference?.infrastructure?.hosting || "Web Server";
        newNodes.push({
            id: "server",
            type: "custom",
            position: { x: X_CENTER, y: currentY },
            data: { label: serverLabel, sublabel: "Load Balancer", icon: "shield", color: "purple" },
        });

        newEdges.push({
            id: "e-cdn-server",
            source: "cdn",
            target: "server",
            animated: true,
            style: { stroke: "#a855f7", strokeWidth: 2 },
            markerEnd: { type: MarkerType.ArrowClosed, color: "#a855f7" },
        });

        // 4. Application Framework & Backend
        currentY += Y_SPACING;
        const appLabel = http?.framework || inference?.frontend?.framework || "Application";
        newNodes.push({
            id: "app",
            type: "custom",
            position: { x: X_CENTER - 120, y: currentY },
            data: { label: appLabel, sublabel: http?.language || inference?.frontend?.language || "Frontend", icon: "cpu", color: "green" },
        });

        const isApiSeparated = inference?.backend?.framework && !inference.backend.framework.includes('Next.js');

        if (isApiSeparated) {
            newNodes.push({
                id: "api",
                type: "custom",
                position: { x: X_CENTER + 120, y: currentY },
                data: { label: inference.backend.framework, sublabel: "API Runtime", icon: "server", color: "zinc" },
            });

            newEdges.push({
                id: "e-server-app",
                source: "server",
                target: "app",
                animated: true,
            });

            newEdges.push({
                id: "e-server-api",
                source: "server",
                target: "api",
                animated: true,
            });

            // 5. Databases
            if (inference?.backend?.database) {
                newNodes.push({
                    id: "db",
                    type: "custom",
                    position: { x: X_CENTER + 120, y: currentY + Y_SPACING },
                    data: { label: inference.backend.database, sublabel: "Database", icon: "database", color: "blue" },
                });
                newEdges.push({
                    id: "e-api-db",
                    source: "api",
                    target: "db",
                    animated: true,
                });
            }
        } else {
            // Monolithic or SSR framework (Next.js) handles DB direct
            newEdges.push({
                id: "e-server-app",
                source: "server",
                target: "app",
                animated: true,
            });

            if (inference?.backend?.database) {
                newNodes.push({
                    id: "db",
                    type: "custom",
                    position: { x: X_CENTER - 120, y: currentY + Y_SPACING },
                    data: { label: inference.backend.database, sublabel: "Database", icon: "database", color: "blue" },
                });
                newEdges.push({
                    id: "e-app-db",
                    source: "app",
                    target: "db",
                    animated: true,
                });
            }
        }

        setNodes(newNodes);
        setEdges(newEdges);
    }, [results, status, setNodes, setEdges]);

    if (status !== 'completed') {
        return (
            <div className="w-full h-full flex items-center justify-center text-zinc-500 font-mono text-sm">
                [ Awaiting Telemetry Data... ]
            </div>
        );
    }

    return (
        <div className="w-full h-[600px] bg-[#0C0C0E] rounded-xl overflow-hidden">
            <ReactFlow
                nodes={nodes}
                edges={edges}
                nodeTypes={nodeTypes}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                fitView
                fitViewOptions={{ padding: 0.5 }}
                minZoom={0.5}
                maxZoom={1.5}
                proOptions={{ hideAttribution: true }}
                defaultEdgeOptions={{
                    type: 'smoothstep',
                    style: { stroke: '#52525b', strokeWidth: 2 },
                    markerEnd: { type: MarkerType.ArrowClosed, color: '#52525b' }
                }}
            >
                <Background color="#ffffff" gap={24} size={1} />
                <Controls className="fill-zinc-400 bg-[#0C0C0E] border-white/10" showInteractive={false} />
            </ReactFlow>
        </div>
    );
}
