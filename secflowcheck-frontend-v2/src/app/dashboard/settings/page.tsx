import { Metadata } from 'next'
import Profile from "@/app/components/Dashboard/Profile";

export const metadata: Metadata = {
  title: 'Paramètres | SecFlowCheck',
  description: 'Configuration du tableau de bord',
}

const SettingsPage = () => {
  return (
    <div className="p-6">
      <Profile />
    </div>
  )
}

export default SettingsPage
