/**
 * Activity Monitor Widget
 * Shows recent system activity
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@marzneshin/common/components/ui/card";
import { Activity, RefreshCw, AlertCircle, CheckCircle } from "lucide-react";
import { useUserStatsQuery } from "../../api/system-stats.query";

export const ActivityMonitorWidget = () => {
    const { data: stats } = useUserStatsQuery();

    const recentActivities = [
        {
            type: 'subscription',
            icon: RefreshCw,
            color: 'text-blue-500',
            bgColor: 'bg-blue-50',
            title: 'Recent Subscriptions',
            description: 'Users who updated subscriptions',
            count: stats.recent_subscription_updates?.length || 0,
        },
        {
            type: 'online',
            icon: Activity,
            color: 'text-green-500',
            bgColor: 'bg-green-50',
            title: 'Currently Online',
            description: 'Active users right now',
            count: stats.online || 0,
        },
        {
            type: 'activated',
            icon: CheckCircle,
            color: 'text-green-500',
            bgColor: 'bg-green-50',
            title: 'Activated',
            description: 'Active users total',
            count: stats.active || 0,
        },
        {
            type: 'issues',
            icon: AlertCircle,
            color: 'text-red-500',
            bgColor: 'bg-red-50',
            title: 'Issues',
            description: 'Expired + Limited users',
            count: (stats.expired || 0) + (stats.limited || 0),
        },
    ];

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Activity className="h-5 w-5" />
                    Activity Monitor
                </CardTitle>
                <CardDescription>Recent system activity overview</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="space-y-3">
                    {recentActivities.map((activity) => (
                        <div 
                            key={activity.type}
                            className="flex items-center justify-between p-3 border rounded-lg"
                        >
                            <div className="flex items-center gap-3">
                                <div className={`p-2 rounded-full ${activity.bgColor}`}>
                                    <activity.icon className={`h-4 w-4 ${activity.color}`} />
                                </div>
                                <div>
                                    <div className="font-medium text-sm">{activity.title}</div>
                                    <div className="text-xs text-muted-foreground">
                                        {activity.description}
                                    </div>
                                </div>
                            </div>
                            <div className="text-2xl font-bold">{activity.count}</div>
                        </div>
                    ))}
                </div>

                {/* Recent Users List */}
                {stats.recent_subscription_updates?.length > 0 && (
                    <div className="mt-4 pt-4 border-t">
                        <div className="text-sm font-medium mb-2">Latest Updates</div>
                        <div className="flex flex-wrap gap-2">
                            {stats.recent_subscription_updates.slice(0, 8).map((user: string, i: number) => (
                                <span
                                    key={i}
                                    className="px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded-md border border-blue-200"
                                >
                                    {user}
                                </span>
                            ))}
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
};
