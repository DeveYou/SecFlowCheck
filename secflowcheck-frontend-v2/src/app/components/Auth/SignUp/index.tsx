'use client'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import Logo from '@/app/components/Layout/Header/Logo'
import { useState } from 'react'
import Loader from '@/app/components/Common/Loader'

interface SignUpProps {
  openSignIn?: () => void
}

const SignUp = ({ openSignIn }: SignUpProps) => {
  const router = useRouter()

  const handleSignInClick = () => {
    if (openSignIn) {
      openSignIn()
    } else {
      router.push('/signin')
    }
  }
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: any) => {
    e.preventDefault()

    setLoading(true)
    const data = new FormData(e.currentTarget)
    const value = Object.fromEntries(data.entries())

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          full_name: value.name, // Mapping 'name' input to 'full_name' backend expectation
          email: value.email,
          password: value.password,
        }),
      })

      const responseData = await res.json()

      if (!res.ok) {
        throw new Error(responseData.detail || "Échec de l'inscription")
      }

      // Success: Switch to login modal
      toast.success('Inscription réussie ! Veuillez vous connecter.')
      if (openSignIn) {
        openSignIn()
      } else {
        router.push('/signin')
      }
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <div className='mb-10 text-center mx-auto inline-block max-w-[160px]'>
        <Logo />
      </div>

      <form onSubmit={handleSubmit}>
        <div className='mb-[22px]'>
          <input
            type='text'
            placeholder='Nom'
            name='name'
            required
            className='w-full rounded-md border border-dark_border/60 border-solid bg-transparent px-5 py-3 text-base text-dark outline-hidden transition border-darkmode placeholder:text-darkmode focus:border-darkmode focus-visible:shadow-none text-darkmode dark:focus:border-darkmode'
          />
        </div>
        <div className='mb-[22px]'>
          <input
            type='email'
            placeholder='Email'
            name='email'
            required
            className='w-full rounded-md border border-dark_border/60 border-solid bg-transparent px-5 py-3 text-base text-dark outline-hidden transition border-darkmode placeholder:text-darkmode focus:border-darkmode focus-visible:shadow-none text-darkmode dark:focus:border-darkmode'
          />
        </div>
        <div className='mb-[22px]'>
          <input
            type='password'
            placeholder='Mot de passe'
            name='password'
            required
            className='w-full rounded-md border border-dark_border/60 border-solid bg-transparent px-5 py-3 text-base text-dark outline-hidden transition border-darkmode placeholder:text-darkmode focus:border-darkmode focus-visible:shadow-none text-darkmode dark:focus:border-darkmode'
          />
        </div>
        <div className='mb-9'>
          <button
            type='submit'
            className='flex w-full items-center text-18 font-medium justify-center rounded-md bg-darkmode px-5 py-3 text-white transition duration-300 ease-in-out hover:bg-transparent hover:text-darkmode border-darkmode border '>
            S'inscrire {loading && <Loader />}
          </button>
        </div>
      </form>

      <p className='text-body-secondary mb-4 text-black text-base'>
        En créant un compte, vous acceptez notre{' '}
        <a href='/#' className='text-primary hover:underline'>
          Politique de confidentialité
        </a>
      </p>

      {/* OAuth Divider */}
      <div className='my-6 flex items-center'>
        <div className='flex-grow border-t border-gray-400'></div>
        <span className='mx-4 text-gray-500 text-sm'>ou s'inscrire avec</span>
        <div className='flex-grow border-t border-gray-400'></div>
      </div>

      {/* OAuth Buttons */}
      <div className='flex flex-col gap-3 mb-6'>
        <a
          href='http://localhost:8080/auth/login/oauth/google'
          className='flex items-center justify-center gap-3 w-full py-3 rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors'>
          <svg className='w-5 h-5' viewBox='0 0 24 24'>
            <path fill='#4285F4' d='M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z' />
            <path fill='#34A853' d='M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z' />
            <path fill='#FBBC05' d='M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z' />
            <path fill='#EA4335' d='M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z' />
          </svg>
          <span className='text-gray-700 font-medium'>Google</span>
        </a>

        <a
          href='http://localhost:8080/auth/login/oauth/github'
          className='flex items-center justify-center gap-3 w-full py-3 rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors'>
          <svg className='w-5 h-5' fill='currentColor' viewBox='0 0 24 24'>
            <path d='M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z' />
          </svg>
          <span className='text-gray-700 font-medium'>GitHub</span>
        </a>

        <a
          href='http://localhost:8080/auth/login/oauth/gitlab'
          className='flex items-center justify-center gap-3 w-full py-3 rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors'>
          <svg className='w-5 h-5' viewBox='0 0 24 24'>
            <path fill='#E24329' d='m12 22.177l4.116-12.67H7.884z' />
            <path fill='#FC6D26' d='m12 22.177l-4.116-12.67H1.571z' />
            <path fill='#FCA326' d='M1.571 9.507L.242 13.6a.91.91 0 0 0 .33 1.02L12 22.177z' />
            <path fill='#E24329' d='M1.571 9.507h6.313L5.114 1.87a.45.45 0 0 0-.858 0z' />
            <path fill='#FC6D26' d='m12 22.177l4.116-12.67h6.313z' />
            <path fill='#FCA326' d='m22.429 9.507l1.329 4.093a.91.91 0 0 1-.33 1.02L12 22.177z' />
            <path fill='#E24329' d='M22.429 9.507h-6.313l2.77-7.637a.45.45 0 0 1 .858 0z' />
          </svg>
          <span className='text-gray-700 font-medium'>GitLab</span>
        </a>
      </div>

      <p className='text-body-secondary text-black text-base'>
        Vous avez déjà un compte ?
        <button
          onClick={handleSignInClick}
          className='pl-2 text-primary hover:underline'>
          Se connecter
        </button>
      </p>
    </>
  )
}

export default SignUp
