'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card } from '@/components/ui/card'
import VintageLayout from '@/components/layout/VintageLayout'
import { createProfile, getCurrentUser } from '@/lib/supabase'

export default function ProfilePage() {
  const [eventDay, setEventDay] = useState('')
  const [eventTime, setEventTime] = useState('')
  const [gender, setGender] = useState('')
  const [participantNumber, setParticipantNumber] = useState('')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  useEffect(() => {
    const checkAuth = () => {
      const { user } = getCurrentUser()
      if (!user) {
        router.push('/auth')
      }
    }
    checkAuth()
  }, [router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const { user } = getCurrentUser()
      if (!user) {
        router.push('/auth')
        return
      }

      const { error } = await createProfile({
        event_day: eventDay,
        event_time: eventTime,
        gender: gender,
        participant_number: parseInt(participantNumber),
        phone_number: phoneNumber
      })

      if (error) {
        setError('프로필 저장에 실패했습니다. 다시 시도해주세요.')
        return
      }

      // Redirect to voting page
      router.push('/vote')
    } catch (err) {
      setError('오류가 발생했습니다. 다시 시도해주세요.')
    } finally {
      setLoading(false)
    }
  }

  const eventDays = ['월', '화', '수']
  const eventTimes = ['18:00', '18:30', '19:00', '19:30', '20:00', '20:30', '21:00', '21:30', '22:00']
  const genders = ['남자', '여자']
  const participantNumbers = [1, 2, 3, 4, 5, 6]

  return (
    <VintageLayout 
      title="정보 입력"
      subtitle="소개팅 참가 정보를 입력해주세요"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label>참가 요일</Label>
          <div className="grid grid-cols-3 gap-2">
            {eventDays.map((day) => (
              <Button
                key={day}
                type="button"
                variant={eventDay === day ? "default" : "outline"}
                onClick={() => setEventDay(day)}
                className={eventDay === day ? "vintage-button" : "vintage-border"}
              >
                {day}
              </Button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <Label>참가 시간</Label>
          <div className="grid grid-cols-2 gap-2">
            {eventTimes.map((time) => (
              <Button
                key={time}
                type="button"
                variant={eventTime === time ? "default" : "outline"}
                onClick={() => setEventTime(time)}
                className={eventTime === time ? "vintage-button" : "vintage-border"}
              >
                {time}
              </Button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <Label>성별</Label>
          <div className="grid grid-cols-2 gap-2">
            {genders.map((g) => (
              <Button
                key={g}
                type="button"
                variant={gender === g ? "default" : "outline"}
                onClick={() => setGender(g)}
                className={gender === g ? "vintage-button" : "vintage-border"}
              >
                {g}
              </Button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <Label>참가자 번호</Label>
          <div className="grid grid-cols-3 gap-2">
            {participantNumbers.map((num) => (
              <Button
                key={num}
                type="button"
                variant={participantNumber === num.toString() ? "default" : "outline"}
                onClick={() => setParticipantNumber(num.toString())}
                className={participantNumber === num.toString() ? "vintage-button" : "vintage-border"}
              >
                {num}번
              </Button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="phoneNumber">전화번호</Label>
          <Input
            id="phoneNumber"
            type="tel"
            placeholder="010-1234-5678"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            required
            className="vintage-border"
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
          disabled={loading || !eventDay || !eventTime || !gender || !participantNumber || !phoneNumber}
        >
          {loading ? '저장 중...' : '저장하기'}
        </Button>

        <div className="text-xs text-muted-foreground text-center">
          * 저장 후에는 정보를 수정할 수 없습니다.
        </div>
      </form>
    </VintageLayout>
  )
}
