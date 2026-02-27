/**
 * Nodes Monitoring List Page
 * Shows all nodes with monitoring summary
 */

import { Card, CardContent, CardHeader, CardTitle } from "@marzneshin/common/components/ui/card";
import { Badge } from "@marzneshin/common/components/ui/badge";
import { Button } from "@marzneshin/common/components/ui/button";
import { useNodesWithMonitoringQuery } from "../api/node-monitoring.query";
import { Link } from "@tanstack/react-router";
import {
    Server,
    CheckCircle2,
    XCircle,
    AlertCircle,
    RefreshCw,
    Wifi,
    HardDrive,
    TrendingUp
} from "lucide-react";
import { useState } from "react";

export const NodesMonitoringList = () => {
    const { data: nodes, isLoading, refetch } = useNodesWithMonitoringQuery();
    const [filter, setFilter] = useState<'all' | 'healthy' | 'unhealthy' | 'disabled'>('all');

    const formatBytes = (bytes: number) => {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'healthy': return <CheckCircle2 className="h-5 w-5 text-green-500" />;
            case 'unhealthy': return <XCircle className="h-5 w-5 text-red-500" />;
            case 'disabled': return <AlertCircle className="h-5 w-5 text-gray-500" />;
            default: return <Server className="h-5 w-5" />;
        }
    };

    const filteredNodes = nodes?.filter(node => {
        if (filter === 'all') return true;
        return node.status === filter;
    });

    const statusCounts = {
        all: nodes?.length || 0,
        healthy: nodes?.filter(n => n.status === 'healthy').length || 0,
        unhealthy: nodes?.filter(n => n.status === 'unhealthy').length || 0,
        disabled: nodes?.filter(n => n.status === 'disabled').length || 0,
    };

    if (isLoading) {
        return (
            <div className="container mx-auto p-6">
                <div className="text-center py-12">
                    <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
                    <div>Loading nodes...</div>
                </div>
            </div>
        );
    }

    return (
        <div className="container mx-auto p-6 space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold">Nodes Monitoring</h1>
                    <p className="text-muted-foreground">Monitor all nodes and their backends</p>
                </div>
                <Button onClick={() => refetch()} variant="outline" size="sm">
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Refresh
                </Button>
            </div>

            {/* Filter Tabs */}
            <div className="flex gap-2 border-b pb-4">
                {(['all', 'healthy', 'unhealthy', 'disabled'] as const).map((status) => (
                    <Button
                        key={status}
                        variant={filter === status ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setFilter(status)}
                    >
                        {status.charAt(0).toUpperCase() + status.slice(1)}
                        <span className="ml-2 text-xs">({statusCounts[status]})</span>
                    </Button>
                ))}
            </div>

            {/* Summary Cards */}
            <div className="grid gap-4 md:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Nodes</CardTitle>
                        <Server className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{statusCounts.all}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Healthy</CardTitle>
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-500">{statusCounts.healthy}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Unhealthy</CardTitle>
                        <XCircle className="h-4 w-4 text-red-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-red-500">{statusCounts.unhealthy}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Disabled</CardTitle>
                        <AlertCircle className="h-4 w-4 text-gray-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-gray-500">{statusCounts.disabled}</div>
                    </CardContent>
                </Card>
            </div>

            {/* Nodes Grid */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {filteredNodes?.map((node) => (
                    <Link
                        key={node.id}
                        to="/monitoring/nodes/$nodeId"
                        params={{ nodeId: node.id.toString() }}
                        className="block"
                    >
                        <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                            <CardHeader className="pb-3">
                                <div className="flex justify-between items-start">
                                    <div className="flex items-center gap-3">
                                        {getStatusIcon(node.status)}
                                        <div>
                                            <CardTitle className="text-lg">{node.name}</CardTitle>
                                            <div className="text-xs text-muted-foreground">
                                                ID: {node.id}
                                            </div>
                                        </div>
                                    </div>
                                    <Badge variant={node.status === 'healthy' ? 'default' : 'secondary'}>
                                        {node.status}
                                    </Badge>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                {/* Backends */}
                                <div>
                                    <div className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
                                        <Wifi className="h-3 w-3" />
                                        Backends
                                    </div>
                                    <div className="flex flex-wrap gap-1">
                                        {node.backends?.slice(0, 4).map((backend: any, i: number) => (
                                            <Badge 
                                                key={i} 
                                                variant={backend.running ? 'default' : 'secondary'}
                                                className="text-xs"
                                            >
                                                {backend.running && <Wifi className="h-3 w-3 mr-1" />}
                                                {backend.name}
                                            </Badge>
                                        ))}
                                        {node.backends && node.backends.length > 4 && (
                                            <Badge variant="outline" className="text-xs">
                                                +{node.backends.length - 4}
                                            </Badge>
                                        )}
                                    </div>
                                </div>

                                {/* Traffic */}
                                <div className="pt-3 border-t grid grid-cols-2 gap-2">
                                    <div>
                                        <div className="text-xs text-muted-foreground flex items-center gap-1">
                                            <HardDrive className="h-3 w-3" />
                                            Total
                                        </div>
                                        <div className="text-sm font-medium">
                                            {formatBytes(node.monitoring?.total_traffic || 0)}
                                        </div>
                                    </div>
                                    <div>
                                        <div className="text-xs text-muted-foreground flex items-center gap-1">
                                            <TrendingUp className="h-3 w-3" />
                                            24h
                                        </div>
                                        <div className="text-sm font-medium">
                                            {formatBytes(node.monitoring?.uplink_24h || 0)}
                                        </div>
                                    </div>
                                </div>

                                {/* Other Info */}
                                <div className="pt-3 border-t text-xs text-muted-foreground">
                                    <div className="flex justify-between">
                                        <span>Version:</span>
                                        <span className="font-medium">{(node as any).xray_version || 'N/A'}</span>
                                    </div>
                                    <div className="flex justify-between mt-1">
                                        <span>Coefficient:</span>
                                        <span className="font-medium">{node.usage_coefficient || 1.0}x</span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </Link>
                ))}
            </div>

            {filteredNodes?.length === 0 && (
                <div className="text-center py-12 text-muted-foreground">
                    <Server className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <div>No nodes found</div>
                </div>
            )}
        </div>
    );
};
