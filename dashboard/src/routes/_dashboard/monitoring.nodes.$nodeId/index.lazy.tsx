import { createLazyFileRoute } from '@tanstack/react-router'
import { NodeDetailMonitoring } from '@marzneshin/modules/monitoring/components/node-detail-monitoring'

export const Route = createLazyFileRoute('/_dashboard/monitoring/nodes/$nodeId/')({
  component: () => <NodeDetailMonitoring />,
})
