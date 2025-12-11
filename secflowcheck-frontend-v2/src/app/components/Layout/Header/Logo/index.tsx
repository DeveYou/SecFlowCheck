import Link from 'next/link'
import Image from 'next/image'

const Logo: React.FC = () => {
  return (
    <Link href='/' className='flex items-center gap-2 text-3xl font-semibold'>
      <Image
        src="/images/logo/log3.png"
        alt="SecFlowCheck Logo"
        width={50}
        height={50}
        className="object-contain"
      />
      SecFlowCheck
    </Link>
  )
}

export default Logo
