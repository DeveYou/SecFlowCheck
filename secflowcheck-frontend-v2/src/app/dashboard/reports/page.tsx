import { Metadata } from 'next'
import ReportsList from '@/app/components/Dashboard/ReportsList'

export const metadata: Metadata = {
  title: 'Rapports | SecFlowCheck',
  description: 'Rapports de sécurité',
}

const ReportsPage = () => {
  return (
    <div className="text-white">
      <ReportsList />
    </div>
  )
}

export default ReportsPage
