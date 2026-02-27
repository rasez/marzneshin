/**
 * Node Detail Monitoring Page
 * Comprehensive monitoring for a specific node
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@marzneshin/common/components/ui/card";
import { Badge } from "@marzneshin/common/components/ui/badge";
import { Button } from "@marzneshin/common/components/ui/button";
import { useNodeMonitoringQuery, useNodeTrafficQuery, useNodeUsersQuery } from "../api/node-monitoring.query";
import { useParams, Link } from "@tanstack/react-router";
import {
    Server,
    HardDrive,
    Activity,
    ArrowUpCircle,
    ArrowDownCircle,
    CheckCircle2,
    XCircle,
    AlertCircle,
    RefreshCw,
    Users
} from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { ProtocolDetailCard } from "./protocol-detail-card";
import { BackendLogsViewer } from "./backend-logs-viewer";

export const NodeDetailMonitoring = () => {
    const { nodeId } = useParams({ strict: false });
    const nodeIdNum = parseInt(nodeId || "0");

    const { data: nodeData, isLoading: nodeLoading, refetch } = useNodeMonitoringQuery(nodeIdNum);
    const { data: trafficData } = useNodeTrafficQuery(nodeIdNum, 7);
    const { data: usersData } = useNodeUsersQuery(nodeIdNum);

    const formatBytes = (bytes: number) => {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit'
        });
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'healthy': return <CheckCircle2 className="h-6 w-6 text-green-500" />;
            case 'unhealthy': return <XCircle className="h-6 w-6 text-red-500" />;
            case 'disabled': return <AlertCircle className="h-6 w-6 text-gray-500" />;
            default: return <Server className="h-6 w-6" />;
        }
    };

    // Calculate active and online users
    const activeUsers = usersData?.items?.filter(u => u.status === 'active').length || 0;
    const onlineUsers = usersData?.items?.filter(u => u.online).length || 0;
    const totalUsers = usersData?.total || 0;

    if (nodeLoading) {
        return (
            <div className="container mx-auto p-6">
                <div className="text-center py-12">
                    <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
                    <div>Loading node monitoring data...</div>
                </div>
            </div>
        );
    }

    return (
        <div className="container mx-auto p-6 space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div className="flex items-center gap-4">
                    <Link to="/monitoring/nodes">
                        <Button variant="outline" size="sm">← Back</Button>
                    </Link>
                    <div>
                        <h1 className="text-3xl font-bold flex items-center gap-3">
                            {getStatusIcon(nodeData?.status || '')}
                            {nodeData?.name}
                        </h1>
                        <p className="text-muted-foreground">Node Monitoring Dashboard</p>
                    </div>
                </div>
                <Button onClick={() => refetch()} variant="outline" size="sm">
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Refresh
                </Button>
            </div>

            {/* Status Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Status</CardTitle>
                        <Activity className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <Badge variant={nodeData?.status === 'healthy' ? 'default' : 'destructive'}>
                            {nodeData?.status}
                        </Badge>
                        <p className="text-xs text-muted-foreground mt-2">
                            Last change: {new Date(nodeData?.last_status_change || '').toLocaleString()}
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Active Users</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{activeUsers}</div>
                        <p className="text-xs text-muted-foreground">
                            {onlineUsers} online / {totalUsers} total
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Traffic</CardTitle>
                        <HardDrive className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{formatBytes(nodeData?.total_traffic || 0)}</div>
                        <p className="text-xs text-muted-foreground">
                            All time
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Upload</CardTitle>
                        <ArrowUpCircle className="h-4 w-4 text-green-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-500">
                            {formatBytes(nodeData?.uplink || 0)}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Total uploaded
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Download</CardTitle>
                        <ArrowDownCircle className="h-4 w-4 text-blue-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-blue-500">
                            {formatBytes(nodeData?.downlink || 0)}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Total downloaded
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Traffic Chart */}
            <Card>
                <CardHeader>
                    <CardTitle>Traffic Overview (Last 7 Days)</CardTitle>
                    <CardDescription>Hourly traffic consumption</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={trafficData?.usages || []}>
                                <defs>
                                    <linearGradient id="colorNodeTraffic" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#82ca9d" stopOpacity={0.8}/>
                                        <stop offset="95%" stopColor="#82ca9d" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                                <XAxis 
                                    dataKey="timestamp" 
                                    tickFormatter={formatDate}
                                    className="text-xs"
                                />
                                <YAxis 
                                    tickFormatter={(value) => formatBytes(value)}
                                    className="text-xs"
                                />
                                <Tooltip 
                                    formatter={(value: number) => formatBytes(value)}
                                    labelFormatter={formatDate}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="usage"
                                    stroke="#82ca9d"
                                    fillOpacity={1}
                                    fill="url(#colorNodeTraffic)"
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </CardContent>
            </Card>

            {/* Backends/Protocols */}
            <div>
                <h2 className="text-2xl font-bold mb-4">Protocols & Backends</h2>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {nodeData?.backends?.map((backend) => (
                        <ProtocolDetailCard 
                            key={backend.name}
                            nodeId={nodeIdNum}
                            backend={backend}
                        />
                    ))}
                </div>
            </div>

            {/* Logs Viewer */}
            {nodeData?.backends?.some((b: any) => b.running) && (
                <BackendLogsViewer nodeId={nodeIdNum} backends={nodeData.backends} />
            )}
        </div>
    );
};
