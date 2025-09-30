'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import VintageLayout from '@/components/layout/VintageLayout'
import { signInOrSignUp } from '@/lib/supabase'

export default function AuthPage() {
  const [studentId, setStudentId] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      if (!studentId.trim()) {
        setError('학번을 입력해주세요.')
        return
      }

      const { error, isNewUser } = await signInOrSignUp(studentId.trim())

      if (error) {
        setError('로그인에 실패했습니다. 다시 시도해주세요.')
        return
      }

      // If new user, redirect to profile page
      // If existing user, redirect to main page
      if (isNewUser) {
        router.push('/profile')
      } else {
        router.push('/')
      }
    } catch (err) {
      setError('오류가 발생했습니다. 다시 시도해주세요.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <VintageLayout
      title="입장하기"
      subtitle="학번을 입력하면 자동으로 로그인됩니다"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="studentId">학번</Label>
          <Input
            id="studentId"
            type="text"
            placeholder="학번을 입력하세요 (예: 20211072)"
            value={studentId}
            onChange={(e) => setStudentId(e.target.value)}
            required
            className="vintage-border"
            autoFocus
          />
        </div>

        {error && (
          <div className="text-destructive text-sm text-center p-2 bg-destructive/10 rounded vintage-border">
            {error}
          </div>
        )}

        <Button
          type="submit"
          className="w-full vintage-button"
          disabled={loading}
        >
          {loading ? '처리 중...' : '입장하기'}
        </Button>

        <div className="text-center text-sm text-muted-foreground">
          <p>처음 입장하시면 자동으로 회원가입됩니다</p>
        </div>
      </form>
    </VintageLayout>
  )
}
