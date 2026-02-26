/**
 * Protocols Monitoring Widget
 * Shows status of all protocols across nodes
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@marzneshin/common/components/ui/card";
import { useNodesWithMonitoringQuery } from "../../api/node-monitoring.query";
import { Badge } from "@marzneshin/common/components/ui/badge";
import {
    protocolDisplayNames
} from "../../api/backend-monitoring.query";
import { Network, Wifi, WifiOff } from "lucide-react";

export const ProtocolsMonitoringWidget = () => {
    const { data: nodes } = useNodesWithMonitoringQuery();

    // Aggregate protocol status across all nodes
    const protocolStatus = new Map<string, { running: number; total: number }>();

    nodes?.forEach((node: any) => {
        node.backends?.forEach((backend: any) => {
            const current = protocolStatus.get(backend.name) || { running: 0, total: 0 };
            current.total++;
            if (backend.running) current.running++;
            protocolStatus.set(backend.name, current);
        });
    });

    const getProtocolIcon = (running: boolean) => {
        return running ? <Wifi className="h-4 w-4 text-green-500" /> : <WifiOff className="h-4 w-4 text-gray-400" />;
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Network className="h-5 w-5" />
                    Protocols Status
                </CardTitle>
                <CardDescription>Backend protocols across all nodes</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="space-y-3">
                    {Array.from(protocolStatus.entries()).map(([protocol, stats]) => (
                        <div 
                            key={protocol}
                            className="flex items-center justify-between p-3 border rounded-lg"
                        >
                            <div className="flex items-center gap-3">
                                {getProtocolIcon(stats.running > 0)}
                                <div>
                                    <div className="font-medium">
                                        {protocolDisplayNames[protocol] || protocol}
                                    </div>
                                    <div className="text-xs text-muted-foreground">
                                        {stats.running} of {stats.total} nodes
                                    </div>
                                </div>
                            </div>
                            <Badge variant={stats.running > 0 ? "default" : "secondary"}>
                                {stats.running > 0 ? "Active" : "Inactive"}
                            </Badge>
                        </div>
                    ))}

                    {protocolStatus.size === 0 && (
                        <div className="text-center py-8 text-muted-foreground">
                            No protocols found
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
};
