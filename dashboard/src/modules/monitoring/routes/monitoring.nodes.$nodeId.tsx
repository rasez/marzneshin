/**
 * Node Detail Monitoring Route
 */

import { createFileRoute, redirect } from "@tanstack/react-router";
import { NodeDetailMonitoring } from "../components/node-detail-monitoring";
import { useAuth } from "@marzneshin/modules/auth";

export const Route = createFileRoute("/monitoring/nodes/$nodeId")({
    component: NodeDetailMonitoring,
    beforeLoad: async () => {
        const loggedIn = await useAuth.getState().isLoggedIn();
        if (!loggedIn) {
            throw redirect({
                to: "/login",
            });
        }
    },
});
