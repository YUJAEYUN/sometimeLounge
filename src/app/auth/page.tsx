'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card } from '@/components/ui/card'
import VintageLayout from '@/components/layout/VintageLayout'
import { signUp, signIn } from '@/lib/supabase'

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true)
  const [studentId, setStudentId] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      if (!isLogin) {
        // Sign up
        if (password !== confirmPassword) {
          setError('비밀번호가 일치하지 않습니다.')
          return
        }
        if (password.length < 6) {
          setError('비밀번호는 6자 이상이어야 합니다.')
          return
        }
        
        const { error } = await signUp(studentId, password)
        if (error) {
          setError(error.message)
          return
        }
        
        // After successful signup, redirect to profile page
        router.push('/profile')
      } else {
        // Sign in
        const { error } = await signIn(studentId, password)
        if (error) {
          setError('학번 또는 비밀번호가 올바르지 않습니다.')
          return
        }
        
        // Redirect will be handled by the main page
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
      title={isLogin ? '로그인' : '회원가입'}
      subtitle={isLogin ? '학번과 비밀번호를 입력해주세요' : '새로운 계정을 만들어주세요'}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="studentId">학번</Label>
          <Input
            id="studentId"
            type="text"
            placeholder="학번을 입력하세요"
            value={studentId}
            onChange={(e) => setStudentId(e.target.value)}
            required
            className="vintage-border"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">비밀번호</Label>
          <Input
            id="password"
            type="password"
            placeholder="비밀번호를 입력하세요"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="vintage-border"
          />
        </div>

        {!isLogin && (
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">비밀번호 확인</Label>
            <Input
              id="confirmPassword"
              type="password"
              placeholder="비밀번호를 다시 입력하세요"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              className="vintage-border"
            />
          </div>
        )}

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
          {loading ? '처리 중...' : (isLogin ? '로그인' : '회원가입')}
        </Button>

        <div className="text-center">
          <button
            type="button"
            onClick={() => {
              setIsLogin(!isLogin)
              setError('')
              setPassword('')
              setConfirmPassword('')
            }}
            className="text-sm text-muted-foreground hover:text-foreground underline"
          >
            {isLogin ? '계정이 없으신가요? 회원가입' : '이미 계정이 있으신가요? 로그인'}
          </button>
        </div>
      </form>
    </VintageLayout>
  )
}
