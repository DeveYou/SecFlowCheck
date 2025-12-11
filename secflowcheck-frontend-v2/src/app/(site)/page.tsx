import React from 'react'
import Hero from '@/app/components/Home/Hero'
import Aboutus from '@/app/components/Home/AboutUs'
import Beliefs from '@/app/components/Home/Beliefs'
import Featured from '@/app/components/Home/Featured'

export default function Home() {
  return (
    <main>
      <Hero />
      <Aboutus />
      <Beliefs />
      <Featured />
    </main>
  )
}
