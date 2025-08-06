"use client"

import { useKindeBrowserClient } from "@kinde-oss/kinde-auth-nextjs"
import { trpc } from "@/app/_trpc/client"

export default function ClientDashboard() {
  const { user, isAuthenticated, isLoading } = useKindeBrowserClient()
  const { data: userProfile } = trpc.user.getProfile.useQuery()

  if (isLoading) {
    return (
      <div className='min-h-screen bg-gray-50 flex items-center justify-center'>
        <div>Loading...</div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return (
      <div className='min-h-screen bg-gray-50 flex items-center justify-center'>
        <div>Please sign in to access your dashboard.</div>
      </div>
    )
  }

  return (
    <div className='min-h-screen bg-gray-50 p-8'>
      <div className='max-w-4xl mx-auto'>
        <h1 className='text-3xl font-bold text-gray-900 mb-8'>
          Welcome to your Athlete Dashboard,{" "}
          {user?.given_name || user?.email?.split("@")[0]}! 🏃‍♀️
        </h1>

        <div className='bg-white rounded-lg shadow p-6 mb-6'>
          <h2 className='text-xl font-semibold mb-4'>Your Training Programs</h2>
          <p className='text-gray-600'>
            Your coach will assign training programs here.
          </p>
        </div>

        <div className='bg-white rounded-lg shadow p-6'>
          <h2 className='text-xl font-semibold mb-4'>Your Coach</h2>
          <p className='text-gray-600'>Coach information will appear here.</p>
        </div>
      </div>
    </div>
  )
}
