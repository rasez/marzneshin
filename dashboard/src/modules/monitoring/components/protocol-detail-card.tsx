/**
 * Protocol Detail Card
 * Shows detailed monitoring for a specific protocol/backend
 */

import { Card, CardContent, CardHeader, CardTitle } from "@marzneshin/common/components/ui/card";
import { Badge } from "@marzneshin/common/components/ui/badge";
import { Button } from "@marzneshin/common/components/ui/button";
import { useBackendStatusQuery } from "../api/backend-monitoring.query";
import { Wifi, WifiOff, Activity } from "lucide-react";
import { protocolDisplayNames } from "../api/backend-monitoring.query";
import type { BackendInfo } from "../types/monitoring";

interface ProtocolDetailCardProps {
    nodeId: number;
    backend: BackendInfo;
}

export const ProtocolDetailCard = ({ nodeId, backend }: ProtocolDetailCardProps) => {
    const { data: status, refetch } = useBackendStatusQuery(nodeId, backend.name);

    const isRunning = status?.running || backend.running || false;

    return (
        <Card className="relative overflow-hidden">
            <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                    <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-full ${isRunning ? 'bg-green-100' : 'bg-gray-100'}`}>
                            {isRunning ? (
                                <Wifi className="h-5 w-5 text-green-600" />
                            ) : (
                                <WifiOff className="h-5 w-5 text-gray-400" />
                            )}
                        </div>
                        <div>
                            <CardTitle className="text-base">
                                {protocolDisplayNames[backend.name] || backend.name}
                            </CardTitle>
                            <div className="text-xs text-muted-foreground">
                                {backend.version || 'Unknown version'}
                            </div>
                        </div>
                    </div>
                    <Badge variant={isRunning ? "default" : "secondary"}>
                        {isRunning ? "Running" : "Stopped"}
                    </Badge>
                </div>
            </CardHeader>
            <CardContent className="space-y-3">
                {/* Status Info */}
                <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                        <div className="text-muted-foreground text-xs">Status</div>
                        <div className={`font-medium ${isRunning ? 'text-green-600' : 'text-gray-500'}`}>
                            {isRunning ? 'Active' : 'Inactive'}
                        </div>
                    </div>
                    <div>
                        <div className="text-muted-foreground text-xs">Inbounds</div>
                        <div className="font-medium">{backend.inbounds?.length || 0}</div>
                    </div>
                </div>

                {/* Inbounds List */}
                {backend.inbounds && backend.inbounds.length > 0 && (
                    <div className="pt-2 border-t">
                        <div className="text-xs text-muted-foreground mb-2">Inbounds</div>
                        <div className="space-y-1">
                            {backend.inbounds.slice(0, 3).map((inbound, i) => (
                                <div key={i} className="text-xs p-1 bg-muted rounded">
                                    {inbound.tag}
                                </div>
                            ))}
                            {backend.inbounds.length > 3 && (
                                <div className="text-xs text-muted-foreground">
                                    +{backend.inbounds.length - 3} more
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Actions */}
                <div className="pt-2 border-t flex gap-2">
                    <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => refetch()}
                        className="flex-1"
                    >
                        <Activity className="h-3 w-3 mr-1" />
                        Refresh
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
};
