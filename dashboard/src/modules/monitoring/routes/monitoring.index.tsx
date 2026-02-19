/**
 * Monitoring Routes
 */

import { createFileRoute, redirect } from "@tanstack/react-router";
import { MonitoringDashboard } from "../components/monitoring-dashboard";
import { useAuth } from "@marzneshin/modules/auth";

export const Route = createFileRoute("/monitoring/")({
    component: MonitoringDashboard,
    beforeLoad: async () => {
        const loggedIn = await useAuth.getState().isLoggedIn();
        if (!loggedIn) {
            throw redirect({
                to: "/login",
            });
        }
    },
});
