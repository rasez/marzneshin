import { createLazyFileRoute, Outlet } from '@tanstack/react-router'
import { Suspense } from 'react'
import { Loading } from '@marzneshin/common/components'

export const Route = createLazyFileRoute('/_dashboard/monitoring/nodes')({
  component: NodesMonitoringLayout,
})

function NodesMonitoringLayout() {
  return (
    <Suspense fallback={<Loading />}>
      <Outlet />
    </Suspense>
  )
}
