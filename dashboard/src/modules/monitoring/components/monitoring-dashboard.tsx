/**
 * Monitoring Dashboard
 * Main monitoring overview page
 */

import { Card, CardContent, CardHeader, CardTitle } from "@marzneshin/common/components/ui/card";
import { useSystemStatsQuery } from "../api/system-stats.query";
import { useNodesWithMonitoringQuery } from "../api/node-monitoring.query";
import { UsersMonitoringWidget } from "./widgets/users-monitoring-widget";
import { NodesMonitoringWidget } from "./widgets/nodes-monitoring-widget";
import { TrafficMonitoringWidget } from "./widgets/traffic-monitoring-widget";
import { ProtocolsMonitoringWidget } from "./widgets/protocols-monitoring-widget";
import { ActivityMonitorWidget } from "./widgets/activity-monitor-widget";
import {
    Server,
    Users,
    Network,
    TrendingUp
} from "lucide-react";

export const MonitoringDashboard = () => {
    const { data: systemStats } = useSystemStatsQuery();
    const { data: nodesWithMonitoring } = useNodesWithMonitoringQuery();

    const statCards = [
        {
            title: "Total Users",
            value: systemStats?.total_users ?? 0,
            description: `${systemStats?.online_users ?? 0} online now`,
            icon: Users,
            color: "text-blue-500",
            bgColor: "bg-blue-50",
        },
        {
            title: "Active Nodes",
            value: systemStats?.healthy_nodes ?? 0,
            description: `${systemStats?.unhealthy_nodes ?? 0} unhealthy`,
            icon: Server,
            color: "text-green-500",
            bgColor: "bg-green-50",
        },
        {
            title: "Total Traffic",
            value: formatBytes(calculateTotalTraffic(nodesWithMonitoring ?? [])),
            description: "Last 24 hours",
            icon: TrendingUp,
            color: "text-purple-500",
            bgColor: "bg-purple-50",
        },
        {
            title: "Active Protocols",
            value: systemStats?.active_protocols ?? countActiveProtocols(nodesWithMonitoring ?? []),
            description: "Across all nodes",
            icon: Network,
            color: "text-orange-500",
            bgColor: "bg-orange-50",
        },
    ];

    return (
        <div className="container mx-auto p-6 space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold">Monitoring Dashboard</h1>
                    <p className="text-muted-foreground">Real-time system and network monitoring</p>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {statCards.map((stat, index) => (
                    <Card key={index}>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">
                                {stat.title}
                            </CardTitle>
                            <stat.icon className={`h-4 w-4 ${stat.color}`} />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stat.value}</div>
                            <p className="text-xs text-muted-foreground">
                                {stat.description}
                            </p>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Main Monitoring Widgets */}
            <div className="grid gap-6 lg:grid-cols-2">
                {/* Users Monitoring */}
                <UsersMonitoringWidget />

                {/* Nodes Monitoring */}
                <NodesMonitoringWidget />
            </div>

            {/* Traffic Monitoring */}
            <TrafficMonitoringWidget />

            {/* Protocols and Activity */}
            <div className="grid gap-6 lg:grid-cols-2">
                <ProtocolsMonitoringWidget />
                <ActivityMonitorWidget />
            </div>
        </div>
    );
};

// Helper functions
const calculateTotalTraffic = (nodes: any[]): number => {
    if (!nodes) return 0;
    return nodes.reduce((acc, node) => acc + (node.monitoring?.total_traffic || 0), 0);
};

const countActiveProtocols = (nodes: any[]): number => {
    if (!nodes) return 0;
    const protocols = new Set<string>();
    nodes.forEach(node => {
        node.backends?.forEach((backend: any) => {
            if (backend.running) {
                protocols.add(backend.name);
            }
        });
    });
    return protocols.size;
};

const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
};
