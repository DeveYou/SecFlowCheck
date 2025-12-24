import Header from '@/app/components/Layout/Header'
import Footer from '@/app/components/Layout/Footer'
import Aoscompo from '@/utils/aos'

export default function SiteLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <Aoscompo>
      <Header />
      {children}
      <Footer />
    </Aoscompo>
  )
}
