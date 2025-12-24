'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { footerlinks } from '@/app/types/footerlinks'

const footer = () => {
  // fetch data

  const [footerlinks, setFooterLinks] = useState<footerlinks[]>([])

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch('/api/data')
        if (!res.ok) throw new Error('Failed to fetch')
        const data = await res.json()
        setFooterLinks(data.FooterLinksData)
      } catch (error) {
        console.error('Error fetching services:', error)
      }
    }
    fetchData()
  }, [])

  return (
    <div className='bg-black' id='first-section'>
      <div className='container mx-auto max-w-2xl pt-48 pb-16 px-4 sm:px-6 lg:max-w-7xl lg:px-8'>
        <div className='grid grid-cols-1 gap-y-10 gap-x-16 sm:grid-cols-2 lg:grid-cols-12 xl:gap-x-8'>
          {/* COLUMN-1 */}
          <div className='col-span-4'>
            <h4 className='text-white text-3xl leading-9 mb-4 lg:mb-20'>
              SecFlowCheck
            </h4>
          </div>
          {/* CLOUMN-2/3 */}
          {footerlinks.map((item, i) => (
            <div key={i} className='group relative col-span-2'>
              <p className='text-white text-xl font-extrabold mb-9'>
                {item.section}
              </p>
              <ul>
                {item.links.map((item, i) => (
                  <li key={i} className='mb-5'>
                    <Link
                      href={`${item.href}`}
                      className='text-white text-lg font-normal mb-6 space-links hover:text-white/60 hover:underline'>
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
      {/* All Rights Reserved */}
      <div className='mx-auto max-w-2xl lg:max-w-7xl'>
        <div className='pt-5 pb-5 px-4 sm:px-6 lg:px-4 border-t border-white/30'>
          <div className='mt-4 grid grid-cols-1 gap-y-10 gap-x-16 sm:grid-cols-2 xl:gap-x-8'>
            <div>
              <p className='text-center md:text-start text-white text-lg'>
                @2025 - Tous droits réservés par{' '}
                <Link
                  href='#'
                  target='_blank'
                  className='hover:text-white/60 hover:underline'>
                  {' '}
                  SecFlowCheck
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default footer
