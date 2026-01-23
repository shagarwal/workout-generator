'use client'

import { signIn, signOut, useSession } from 'next-auth/react'
import { LogIn, LogOut, User } from 'lucide-react'

export default function AuthButton() {
  const { data: session, status } = useSession()

  if (status === 'loading') {
    return (
      <div className="flex items-center gap-2 px-4 py-2 bg-gray-700 text-gray-400 rounded-lg">
        <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
        <span>Loading...</span>
      </div>
    )
  }

  if (session) {
    return (
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-2 px-2 sm:px-3 py-2 bg-gray-700 rounded-lg">
          {session.user.image ? (
            <img
              src={session.user.image}
              alt={session.user.name || 'User'}
              className="w-6 h-6 rounded-full"
            />
          ) : (
            <User className="w-5 h-5 text-lime-400" />
          )}
          <span className="hidden md:inline text-sm text-gray-200">
            {session.user.name || session.user.email}
          </span>
        </div>
        <button
          onClick={() => signOut()}
          className="flex items-center gap-1.5 px-3 sm:px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors text-sm font-medium"
        >
          <LogOut className="w-4 h-4" />
          <span className="hidden sm:inline">Sign Out</span>
        </button>
      </div>
    )
  }

  return (
    <button
      onClick={() => signIn('google')}
      className="flex items-center gap-1.5 px-3 sm:px-4 py-2 bg-lime-400 hover:bg-lime-500 text-gray-900 font-semibold rounded-lg transition-colors text-sm"
    >
      <LogIn className="w-4 h-4" />
      <span className="hidden sm:inline">Sign in with Google</span>
      <span className="sm:hidden">Sign in</span>
    </button>
  )
}
