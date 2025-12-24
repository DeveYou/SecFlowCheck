import { Metadata } from 'next'
import Analyzer from '@/app/components/Dashboard/Analyzer'

export const metadata: Metadata = {
  title: 'Analyses | SecFlowCheck',
  description: 'Analyseur de sécurité pipeline',
}

const ScansPage = () => {
  return (
    <div className="text-white">
      <Analyzer />
    </div>
  )
}

export default ScansPage
