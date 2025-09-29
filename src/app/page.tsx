'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import VintageLayout from '@/components/layout/VintageLayout'
import Loading from '@/components/ui/loading'

export default function Home() {
  const router = useRouter()

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession()

      if (session) {
        // User is logged in, check if profile exists
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single()

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
