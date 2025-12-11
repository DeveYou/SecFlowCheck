'use client'
import React, { createContext, useContext, useState, ReactNode } from 'react'

interface AuthContextType {
  isSignInOpen: boolean
  setIsSignInOpen: (isOpen: boolean) => void
  isSignUpOpen: boolean
  setIsSignUpOpen: (isOpen: boolean) => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthContextProvider = ({ children }: { children: ReactNode }) => {
  const [isSignInOpen, setIsSignInOpen] = useState(false)
  const [isSignUpOpen, setIsSignUpOpen] = useState(false)

  return (
    <AuthContext.Provider
      value={{
        isSignInOpen,
        setIsSignInOpen,
        isSignUpOpen,
        setIsSignUpOpen,
      }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuthContext = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuthContext must be used within an AuthContextProvider')
  }
  return context
}
