/**
 * Traffic Monitoring Widget
 * Shows system-wide traffic statistics
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@marzneshin/common/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { fetch } from "@marzneshin/common/utils";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { TrendingUp, ArrowUpCircle, ArrowDownCircle } from "lucide-react";
import { useState } from "react";

export const TrafficMonitoringWidget = () => {
    const [days, setDays] = useState(7);

    const { data: trafficData, isLoading } = useQuery({
        queryKey: ['system', 'traffic', days],
        queryFn: async () => {
            const end = new Date().toISOString();
            const start = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
            return fetch('/system/stats/traffic', {
                query: { start, end }
            });
        },
        refetchInterval: 60000,
    });

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

    const timeRangeButtons = [
        { label: '24h', value: 1 },
        { label: '7d', value: 7 },
        { label: '30d', value: 30 },
        { label: '90d', value: 90 },
    ];

    return (
        <Card>
            <CardHeader>
                <div className="flex justify-between items-start">
                    <div>
                        <CardTitle className="flex items-center gap-2">
                            <TrendingUp className="h-5 w-5" />
                            Traffic Monitoring
                        </CardTitle>
                        <CardDescription>System-wide bandwidth usage over time</CardDescription>
                    </div>
                    <div className="flex gap-2">
                        {timeRangeButtons.map((btn) => (
                            <button
                                key={btn.value}
                                onClick={() => setDays(btn.value)}
                                className={`px-3 py-1 text-xs rounded-md transition-colors ${
                                    days === btn.value
                                        ? 'bg-primary text-primary-foreground'
                                        : 'bg-muted hover:bg-muted/50'
                                }`}
                            >
                                {btn.label}
                            </button>
                        ))}
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                {/* Summary Stats */}
                <div className="grid grid-cols-3 gap-4 mb-6">
                    <div className="text-center">
                        <div className="text-sm text-muted-foreground mb-1">Total Traffic</div>
                        <div className="text-2xl font-bold">
                            {formatBytes(trafficData?.total || 0)}
                        </div>
                    </div>
                    <div className="text-center">
                        <div className="text-sm text-muted-foreground mb-1 flex items-center justify-center gap-1">
                            <ArrowUpCircle className="h-4 w-4 text-green-500" />
                            Avg Upload
                        </div>
                        <div className="text-xl font-semibold text-green-500">
                            {formatBytes((trafficData?.total || 0) / 2 / (days * 24))}/h
                        </div>
                    </div>
                    <div className="text-center">
                        <div className="text-sm text-muted-foreground mb-1 flex items-center justify-center gap-1">
                            <ArrowDownCircle className="h-4 w-4 text-blue-500" />
                            Avg Download
                        </div>
                        <div className="text-xl font-semibold text-blue-500">
                            {formatBytes((trafficData?.total || 0) / 2 / (days * 24))}/h
                        </div>
                    </div>
                </div>

                {/* Chart */}
                {isLoading ? (
                    <div className="h-[300px] flex items-center justify-center">
                        <div className="text-muted-foreground">Loading traffic data...</div>
                    </div>
                ) : (
                    <div className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={trafficData?.usages || []}>
                                <defs>
                                    <linearGradient id="colorTraffic" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8}/>
                                        <stop offset="95%" stopColor="#8884d8" stopOpacity={0}/>
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
                                    stroke="#8884d8"
                                    fillOpacity={1}
                                    fill="url(#colorTraffic)"
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                )}
            </CardContent>
        </Card>
    );
};
