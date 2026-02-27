import { createLazyFileRoute } from '@tanstack/react-router'
import { MonitoringDashboard } from '@marzneshin/modules/monitoring/components/monitoring-dashboard'

export const Route = createLazyFileRoute('/_dashboard/monitoring/')({
  component: () => <MonitoringDashboard />,
})
