/**
 * Nodes Monitoring List Route
 */

import { createFileRoute, redirect } from "@tanstack/react-router";
import { NodesMonitoringList } from "../components/nodes-monitoring-list";
import { useAuth } from "@marzneshin/modules/auth";

export const Route = createFileRoute("/monitoring/nodes")({
    component: NodesMonitoringList,
    beforeLoad: async () => {
        const loggedIn = await useAuth.getState().isLoggedIn();
        if (!loggedIn) {
            throw redirect({
                to: "/login",
            });
        }
    },
});
