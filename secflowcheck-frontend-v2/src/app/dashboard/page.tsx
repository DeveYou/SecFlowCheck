import SecFlowCheckDashboard from '@/app/components/Dashboard/SecFlowCheckDashboard'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Dashboard | SecFlowCheck',
  description: 'Security Analysis Dashboard',
}

const DashboardPage = () => {
  return <SecFlowCheckDashboard />
}

export default DashboardPage
