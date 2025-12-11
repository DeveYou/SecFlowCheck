'use client'
import { signIn } from 'next-auth/react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import toast from 'react-hot-toast'
import Logo from '@/app/components/Layout/Header/Logo'
import Loader from '@/app/components/Common/Loader'
import { useAuthContext } from '@/app/context/AuthContext'

interface SigninProps {
  openSignUp?: () => void
}

const Signin = ({ openSignUp }: SigninProps) => {
  const router = useRouter()
  const { setIsSignInOpen } = useAuthContext()

  const handleSignUpClick = () => {
    if (openSignUp) {
      openSignUp()
    } else {
      router.push('/signup')
    }
  }

  const [loginData, setLoginData] = useState({
    email: '',
    password: '',
    checkboxToggle: false,
  })
  const [loading, setLoading] = useState(false)

  const loginUser = async (e: any) => {
    e.preventDefault()

    setLoading(true)
    
    try {
      const res = await fetch('http://localhost:8080/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: loginData.email,
          password: loginData.password,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.detail || 'Échec de la connexion')
      }

      // Success: Store token and redirect
      localStorage.setItem('token', data.access_token)
      toast.success('Connexion réussie')
      setIsSignInOpen(false)
      router.push('/dashboard')
    } catch (err: any) {
      console.log(err.message)
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

      <form onSubmit={(e) => e.preventDefault()}>
        <div className='mb-[22px]'>
          <input
            type='email'
            placeholder='Email'
            onChange={(e) =>
              setLoginData({ ...loginData, email: e.target.value })
            }
            className='w-full rounded-md border border-dark_border/60 border-solid bg-transparent px-5 py-3 border-darkmode text-base text-dark outline-hidden transition placeholder:text-darkmode focus:border-darkmode focus-visible:shadow-none text-darkmode dark:focus:border-darkmode'
          />
        </div>
        <div className='mb-[22px]'>
          <input
            type='password'
            placeholder='Mot de passe'
            onChange={(e) =>
              setLoginData({ ...loginData, password: e.target.value })
            }
            className='w-full rounded-md border border-dark_border/60 border-solid bg-transparent px-5 py-3 border-darkmode text-base text-dark outline-hidden transition placeholder:text-darkmode focus:border-darkmode focus-visible:shadow-none text-darkmode dark:focus:border-darkmode'
          />
        </div>
        <div className='mb-9'>
          <button
            onClick={loginUser}
            type='submit'
            className='bg-darkmode w-full py-3 rounded-lg text-18 font-medium border text-white border-darkmode hover:text-darkmode hover:bg-transparent'>
            Se connecter {loading && <Loader />}
          </button>
        </div>
      </form>

      <Link
        href='/forgot-password'
        className='mb-2 inline-block text-base text-dark hover:text-primary text-black dark:hover:text-primary'>
        Mot de passe oublié ?
      </Link>
      <p className='text-body-secondary text-black text-base'>
        Pas encore membre ?{' '}
        <button
          onClick={handleSignUpClick}
          className='text-primary hover:underline'>
          S'inscrire
        </button>
      </p>
    </>
  )
}

export default Signin
