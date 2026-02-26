/**
 * Backend Logs Viewer
 * Real-time log streaming for backends
 */

import { Card, CardContent, CardHeader, CardTitle } from "@marzneshin/common/components/ui/card";
import { Button } from "@marzneshin/common/components/ui/button";
import { Badge } from "@marzneshin/common/components/ui/badge";
import { ScrollArea } from "@marzneshin/common/components/ui/scroll-area";
import { useBackendLogsSocket } from "../hooks/use-backend-logs";
import { Terminal, Play, Square, Trash2 } from "lucide-react";
import { useState } from "react";
import type { BackendInfo } from "../types/monitoring";

interface BackendLogsViewerProps {
    nodeId: number;
    backends: BackendInfo[];
}

export const BackendLogsViewer = ({ nodeId, backends }: BackendLogsViewerProps) => {
    const [selectedBackend, setSelectedBackend] = useState<string | null>(null);
    const [autoScroll, setAutoScroll] = useState(true);
    
    const { logs, isConnected, connect, disconnect, clearLogs } = useBackendLogsSocket(
        nodeId,
        autoScroll
    );

    const runningBackends = backends.filter(b => b.running);

    const formatLogTime = (timestamp: string) => {
        return new Date(timestamp).toLocaleTimeString();
    };

    const getLogLevelColor = (level: string) => {
        switch (level.toLowerCase()) {
            case 'error': return 'text-red-500';
            case 'warning': return 'text-yellow-500';
            case 'info': return 'text-blue-500';
            case 'debug': return 'text-gray-500';
            default: return 'text-gray-700';
        }
    };

    return (
        <Card>
            <CardHeader>
                <div className="flex justify-between items-center">
                    <div>
                        <CardTitle className="flex items-center gap-2">
                            <Terminal className="h-5 w-5" />
                            Backend Logs
                        </CardTitle>
                        <div className="text-sm text-muted-foreground mt-1">
                            Real-time log streaming from running backends
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <Badge variant={isConnected ? "default" : "secondary"}>
                            {isConnected ? "Connected" : "Disconnected"}
                        </Badge>
                    </div>
                </div>

                {/* Backend Selection */}
                <div className="flex gap-2 mt-4 flex-wrap">
                    {runningBackends.map((backend) => (
                        <Button
                            key={backend.name}
                            size="sm"
                            variant={selectedBackend === backend.name ? "default" : "outline"}
                            onClick={() => {
                                if (selectedBackend === backend.name) {
                                    setSelectedBackend(null);
                                    disconnect();
                                } else {
                                    setSelectedBackend(backend.name);
                                    connect(backend.name);
                                }
                            }}
                        >
                            {backend.name}
                        </Button>
                    ))}
                </div>
            </CardHeader>
            <CardContent>
                {/* Controls */}
                <div className="flex gap-2 mb-4">
                    {!isConnected ? (
                        <Button
                            size="sm"
                            onClick={() => selectedBackend && connect(selectedBackend)}
                            disabled={!selectedBackend}
                        >
                            <Play className="h-4 w-4 mr-2" />
                            Start Streaming
                        </Button>
                    ) : (
                        <Button
                            size="sm"
                            variant="destructive"
                            onClick={disconnect}
                        >
                            <Square className="h-4 w-4 mr-2" />
                            Stop
                        </Button>
                    )}
                    <Button
                        size="sm"
                        variant="outline"
                        onClick={clearLogs}
                    >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Clear Logs
                    </Button>
                    <Button
                        size="sm"
                        variant={autoScroll ? "default" : "outline"}
                        onClick={() => setAutoScroll(!autoScroll)}
                    >
                        Auto-scroll: {autoScroll ? "ON" : "OFF"}
                    </Button>
                </div>

                {/* Logs Display */}
                <ScrollArea className="h-[400px] w-full rounded-md border bg-muted/50 p-4 font-mono text-sm">
                    {logs.length === 0 ? (
                        <div className="text-center text-muted-foreground py-12">
                            <Terminal className="h-12 w-12 mx-auto mb-4 opacity-50" />
                            <div>
                                {isConnected 
                                    ? "Waiting for logs..." 
                                    : "Select a backend and start streaming"}
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-1">
                            {logs.map((log, index) => (
                                <div 
                                    key={index}
                                    className="flex gap-3 hover:bg-muted/50 p-1 rounded"
                                >
                                    <span className="text-muted-foreground text-xs min-w-[80px]">
                                        {formatLogTime(log.timestamp)}
                                    </span>
                                    <span className={`font-medium text-xs min-w-[60px] ${getLogLevelColor(log.level)}`}>
                                        [{log.level}]
                                    </span>
                                    <span className="flex-1 break-all">
                                        {log.message}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}
                </ScrollArea>

                {/* Log Stats */}
                {logs.length > 0 && (
                    <div className="mt-2 text-xs text-muted-foreground text-right">
                        {logs.length} log entries
                    </div>
                )}
            </CardContent>
        </Card>
    );
};
