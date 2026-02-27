import { createFileRoute, Outlet, redirect } from '@tanstack/react-router'
import { useAuth } from '@marzneshin/modules/auth'
import { Page } from '@marzneshin/common/components'
import { useTranslation } from 'react-i18next'

export const Route = createFileRoute('/_dashboard/monitoring')({
  component: MonitoringLayout,
  beforeLoad: async () => {
    const loggedIn = await useAuth.getState().isLoggedIn()
    if (!loggedIn) {
      throw redirect({
        to: '/login',
      })
    }
  },
})

function MonitoringLayout() {
  const { t } = useTranslation()
  return (
    <Page title={t('monitoring')}>
      <Outlet />
    </Page>
  )
}
