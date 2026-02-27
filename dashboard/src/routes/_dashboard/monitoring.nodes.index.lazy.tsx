import { createLazyFileRoute } from '@tanstack/react-router'
import { NodesMonitoringList } from '@marzneshin/modules/monitoring/components/nodes-monitoring-list'

export const Route = createLazyFileRoute('/_dashboard/monitoring/nodes/')({
  component: () => <NodesMonitoringList />,
})
