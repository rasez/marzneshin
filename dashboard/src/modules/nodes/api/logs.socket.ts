import { NodeType } from "@marzneshin/modules/nodes";
import useWebSocket, { ReadyState } from "react-use-websocket";
import { useAuth } from "@marzneshin/modules/auth";
import { joinPaths } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState } from "react";

export const MAX_NUMBER_OF_LOGS = 200;

export const getStatus = (status: string) => {
    return {
        [ReadyState.CONNECTING]: "connecting",
        [ReadyState.OPEN]: "connected",
        [ReadyState.CLOSING]: "closed",
        [ReadyState.CLOSED]: "closed",
        [ReadyState.UNINSTANTIATED]: "closed",
    }[status];
};

export const getWebsocketUrl = (nodeId: number, backend: string) => {
    try {
        // Derive a WebSocket base URL that always targets the `/api` prefix.
        const rawBase = import.meta.env.VITE_BASE_API || "/api/";
        const trimmed = rawBase.replace(/\/+$/, "");
        const withApi = trimmed.endsWith("/api") ? trimmed : `${trimmed}/api`;

        const baseURL = new URL(
            withApi.startsWith("/")
                ? window.location.origin + withApi
                : withApi,
        );
        const protocol = baseURL.protocol === "https:" ? "wss://" : "ws://";
        return `${protocol}${joinPaths([baseURL.host + baseURL.pathname, `/nodes/${nodeId}/${backend}/logs`])}?interval=1&token=${useAuth.getState().getAuthToken()}`;
    } catch (e) {
        console.error("Unable to generate websocket url");
        console.error(e);
        return null;
    }
};

export const useNodesLog = (node: NodeType, backend: string) => {
    const [logs, setLogs] = useState<string[]>([]);
    const logsDiv = useRef<HTMLDivElement | null>(null);
    const scrollShouldStayOnEnd = useRef(true);

    const updateLogs = useCallback(
        (callback: (prevLogs: string[]) => string[]) => {
            setLogs((prevLogs) => {
                const newLogs = callback(prevLogs);
                return newLogs.length > MAX_NUMBER_OF_LOGS
                    ? newLogs.slice(-MAX_NUMBER_OF_LOGS)
                    : newLogs;
            });
        },
        [],
    );

    const { readyState } = useWebSocket(
        node?.id ? getWebsocketUrl(node.id, backend) : "",
        {
            onMessage: (e: any) => {
                updateLogs((prevLogs) => [...prevLogs, e.data]);
            },
            shouldReconnect: () => true,
            reconnectAttempts: 10,
            reconnectInterval: 1000,
        },
    );

    useEffect(() => {
        if (logsDiv.current && scrollShouldStayOnEnd.current) {
            logsDiv.current.scrollTop = logsDiv.current.scrollHeight;
        }
    }, [logs]);

    useEffect(() => {
        return () => {
            setLogs([]);
        };
    }, []);

    const status = getStatus(readyState.toString());

    return { status, readyState, logs, logsDiv };
}; 
