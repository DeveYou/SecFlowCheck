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
      const res = await fetch('http://localhost:8080/auth/register', {
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

      // Success: Backend returns token immediately (Auto-login)
      localStorage.setItem('token', responseData.access_token)
      toast.success('Inscription réussie')
      router.push('/dashboard')
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
