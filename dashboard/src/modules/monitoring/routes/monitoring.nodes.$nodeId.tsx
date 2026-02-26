/**
 * Node Detail Monitoring Route
 * Note: This route is commented out as the monitoring feature is still in development
 */

// import { createFileRoute, redirect } from "@tanstack/react-router";
// import { NodeDetailMonitoring } from "../components/node-detail-monitoring";
// import { useAuth } from "@marzneshin/modules/auth";

// export const Route = createFileRoute("/monitoring/nodes/$nodeId")({
//     component: NodeDetailMonitoring,
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
