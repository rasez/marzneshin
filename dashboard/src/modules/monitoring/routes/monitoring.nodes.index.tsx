/**
 * Nodes Monitoring List Route
 * Note: This route is commented out as the monitoring feature is still in development
 */

// import { createFileRoute, redirect } from "@tanstack/react-router";
// import { NodesMonitoringList } from "../components/nodes-monitoring-list";
// import { useAuth } from "@marzneshin/modules/auth";

// export const Route = createFileRoute("/monitoring/nodes")({
//     component: NodesMonitoringList,
//     beforeLoad: async () => {
//         const loggedIn = await useAuth.getState().isLoggedIn();
//         if (!loggedIn) {
//             throw redirect({
//                 to: "/login",
//             });
//         }
//     },
// });

// Placeholder export to prevent module errors
export {};
