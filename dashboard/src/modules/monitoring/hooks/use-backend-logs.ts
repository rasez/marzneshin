/**
 * Backend Logs WebSocket Hook
 * Real-time log streaming via WebSocket
 */

import { useState, useEffect, useCallback, useRef } from 'react';

export interface LogEntry {
    timestamp: string;
    level: 'INFO' | 'WARNING' | 'ERROR' | 'DEBUG';
    message: string;
    backend?: string;
}

export const useBackendLogsSocket = (
    nodeId: number,
    backend: string | null,
    autoScroll: boolean = true
) => {
    const [logs, setLogs] = useState<LogEntry[]>([]);
    const [isConnected, setIsConnected] = useState(false);
    const wsRef = useRef<WebSocket | null>(null);
    const scrollRef = useRef<HTMLDivElement | null>(null);

    const connect = useCallback((backendName: string) => {
        if (wsRef.current?.readyState === WebSocket.OPEN) {
            wsRef.current.close();
        }

        // Construct WebSocket URL based on current location
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const wsUrl = `${protocol}//${window.location.host}/api/nodes/${nodeId}/${backendName}/logs`;

        const ws = new WebSocket(wsUrl);

        ws.onopen = () => {
            setIsConnected(true);
            setLogs([]); // Clear logs on new connection
        };

        ws.onmessage = (event) => {
            try {
                const logEntry: LogEntry = JSON.parse(event.data);
                setLogs(prev => [...prev, logEntry].slice(-1000)); // Keep last 1000 logs
            } catch (e) {
                // Handle plain text logs
                setLogs(prev => [...prev, {
                    timestamp: new Date().toISOString(),
                    level: 'INFO',
                    message: event.data,
                }].slice(-1000));
            }
        };

        ws.onclose = () => {
            setIsConnected(false);
        };

        ws.onerror = (error) => {
            console.error('WebSocket error:', error);
            setIsConnected(false);
        };

        wsRef.current = ws;
    }, [nodeId]);

    const disconnect = useCallback(() => {
        if (wsRef.current) {
            wsRef.current.close();
            wsRef.current = null;
            setIsConnected(false);
        }
    }, []);

    const clearLogs = useCallback(() => {
        setLogs([]);
    }, []);

    // Auto-scroll when new logs arrive
    useEffect(() => {
        if (autoScroll && scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [logs, autoScroll]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (wsRef.current) {
                wsRef.current.close();
            }
        };
    }, []);

    return {
        logs,
        isConnected,
        connect,
        disconnect,
        clearLogs,
    };
};
