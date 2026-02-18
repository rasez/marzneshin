/**
 * Nodes Monitoring Widget
 * Shows node status and health
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@marzneshin/common/components/ui/card";
import { useNodesWithMonitoringQuery } from "../api/node-monitoring.query";
import { Badge } from "@marzneshin/common/components/ui/badge";
import { Server, CheckCircle2, XCircle, AlertCircle, Wifi, HardDrive } from "lucide-react";
import { Link } from "@tanstack/react-router";

export const NodesMonitoringWidget = () => {
    const { data: nodes } = useNodesWithMonitoringQuery();

    const statusCounts = {
        healthy: nodes?.filter(n => n.status === 'healthy').length || 0,
        unhealthy: nodes?.filter(n => n.status === 'unhealthy').length || 0,
        disabled: nodes?.filter(n => n.status === 'disabled').length || 0,
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'healthy': return 'text-green-500';
            case 'unhealthy': return 'text-red-500';
            case 'disabled': return 'text-gray-500';
            default: return 'text-gray-500';
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'healthy': return <CheckCircle2 className="h-5 w-5" />;
            case 'unhealthy': return <XCircle className="h-5 w-5" />;
            case 'disabled': return <AlertCircle className="h-5 w-5" />;
            default: return <Server className="h-5 w-5" />;
        }
    };

    const formatBytes = (bytes: number) => {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Server className="h-5 w-5" />
                    Nodes Monitoring
                </CardTitle>
                <CardDescription>Node health and performance overview</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* Status Summary */}
                <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                        <div className="text-2xl font-bold text-green-500">{statusCounts.healthy}</div>
                        <div className="text-xs text-muted-foreground">Healthy</div>
                    </div>
                    <div>
                        <div className="text-2xl font-bold text-red-500">{statusCounts.unhealthy}</div>
                        <div className="text-xs text-muted-foreground">Unhealthy</div>
                    </div>
                    <div>
                        <div className="text-2xl font-bold text-gray-500">{statusCounts.disabled}</div>
                        <div className="text-xs text-muted-foreground">Disabled</div>
                    </div>
                </div>

                {/* Node List */}
                <div className="space-y-2">
                    {nodes?.slice(0, 5).map((node) => (
                        <Link
                            key={node.id}
                            to="/monitoring/nodes/$nodeId"
                            params={{ nodeId: node.id.toString() }}
                            className="block"
                        >
                            <div className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent transition-colors">
                                <div className="flex items-center gap-3">
                                    <div className={getStatusColor(node.status)}>
                                        {getStatusIcon(node.status)}
                                    </div>
                                    <div>
                                        <div className="font-medium">{node.name}</div>
                                        <div className="text-xs text-muted-foreground">
                                            {node.backends?.filter((b: any) => b.running).length || 0} backends running
                                        </div>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="text-sm font-medium">
                                        {formatBytes(node.monitoring?.total_traffic || 0)}
                                    </div>
                                    <div className="text-xs text-muted-foreground">
                                        Total Traffic
                                    </div>
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>

                {/* View All Link */}
                <div className="pt-2">
                    <Link 
                        to="/monitoring/nodes"
                        className="text-sm text-primary hover:underline"
                    >
                        View all nodes →
                    </Link>
                </div>
            </CardContent>
        </Card>
    );
};
