'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { getCurrentUser, getProfile, isAdmin } from '@/lib/supabase'
import VintageLayout from '@/components/layout/VintageLayout'
import Loading from '@/components/ui/loading'

export default function Home() {
  const router = useRouter()

  useEffect(() => {
    const checkAuth = async () => {
      const { user } = getCurrentUser()

      if (user) {
        // Check if user is admin
        if (isAdmin()) {
          router.push('/admin')
          return
        }

        // User is logged in, check if profile exists
        const { data: profile } = await getProfile()

        if (profile) {
          // Profile exists, go to voting/results page
          router.push('/vote')
        } else {
          // No profile, go to profile setup
          router.push('/profile')
        }
      } else {
        // Not logged in, go to auth page
        router.push('/auth')
      }
    }

    checkAuth()
  }, [router])

  return (
    <VintageLayout>
      <Loading />
    </VintageLayout>
  )
}
