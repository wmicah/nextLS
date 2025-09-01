"use client"

import { useRouter } from "next/navigation"
import { useEffect } from "react"
import { trpc } from "@/app/_trpc/client"

export default function AuthCallback() {
  const router = useRouter()

  const { data, isLoading, error } = trpc.authCallback.useQuery()

  useEffect(() => {
    if (data?.success) {
      console.log("🔍 Auth callback data:", data) // Add debug
      if ("role" in (data.user || {})) {
        console.log("🔍 User role:", data.user.role) // Add debug
      } else {
        console.log("🔍 User role is not defined")
      }

      if (data.needsRoleSelection) {
        console.log("➡️ Going to role selection")
        router.push("/role-selection")
      } else {
        // ✅ Check the specific role value
        const userRole = data.user?.role
        console.log("➡️ User role is:", userRole)

        if (userRole === "COACH") {
          console.log("➡️ Going to COACH dashboard")
          router.push("/dashboard")
        } else if (userRole === "CLIENT") {
          console.log("➡️ Going to CLIENT dashboard")
          router.push("/client-dashboard")
        } else {
          console.log("➡️ Unknown role, going to role selection")
          router.push("/role-selection")
        }
      }
    }
    if (error) {
      console.error("Auth callback error:", error)
      router.push("/auth-error")
    }
  }, [data, error, router])

  if (isLoading) {
    return (
      <div className='flex items-center justify-center min-h-screen'>
        <div className='text-center'>
          <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4'></div>
          <h2 className='text-xl font-semibold text-gray-900'>
            Setting up your account...
          </h2>
          <p className='text-gray-600 mt-2'>
            Please wait while we get everything ready.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className='flex items-center justify-center min-h-screen'>
      <div className='text-center'>
        <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4'></div>
        <h2 className='text-xl font-semibold text-gray-900'>
          Completing sign in...
        </h2>
      </div>
    </div>
  )
}
