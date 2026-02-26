/**
 * Users Monitoring Widget
 * Shows user statistics and online status
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@marzneshin/common/components/ui/card";
import { useUserStatsQuery } from "../../api/system-stats.query";
import { Progress } from "@marzneshin/common/components/ui/progress";
import { Users, UserCheck, UserX, Clock, Zap } from "lucide-react";

export const UsersMonitoringWidget = () => {
    const { data: stats } = useUserStatsQuery();

    const userCategories = [
        {
            label: "Active",
            count: stats.active,
            color: "bg-green-500",
            icon: UserCheck,
        },
        {
            label: "Online",
            count: stats.online,
            color: "bg-blue-500",
            icon: Zap,
        },
        {
            label: "On Hold",
            count: stats.on_hold,
            color: "bg-yellow-500",
            icon: Clock,
        },
        {
            label: "Expired",
            count: stats.expired,
            color: "bg-red-500",
            icon: UserX,
        },
        {
            label: "Data Limited",
            count: stats.limited,
            color: "bg-orange-500",
            icon: Users,
        },
    ];

    const total = stats.total || 1;

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Users Monitoring
                </CardTitle>
                <CardDescription>Real-time user status overview</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* Total Users */}
                <div className="text-center pb-4 border-b">
                    <div className="text-4xl font-bold">{stats.total}</div>
                    <div className="text-sm text-muted-foreground">Total Users</div>
                </div>

                {/* User Categories */}
                <div className="space-y-3">
                    {userCategories.map((category) => (
                        <div key={category.label} className="space-y-1">
                            <div className="flex justify-between text-sm">
                                <div className="flex items-center gap-2">
                                    <category.icon className="h-4 w-4" />
                                    <span>{category.label}</span>
                                </div>
                                <div className="font-medium">{category.count}</div>
                            </div>
                            <Progress 
                                value={(category.count / total) * 100} 
                                className="h-2"
                            />
                        </div>
                    ))}
                </div>

                {/* Recent Activity */}
                {stats.recent_subscription_updates?.length > 0 && (
                    <div className="pt-4 border-t">
                        <div className="text-sm text-muted-foreground mb-2">
                            Recent Subscription Updates
                        </div>
                        <div className="flex flex-wrap gap-1">
                            {stats.recent_subscription_updates.slice(0, 5).map((user: string, i: number) => (
                                <span
                                    key={i}
                                    className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
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
