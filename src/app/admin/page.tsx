'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import VintageLayout from '@/components/layout/VintageLayout'
import Loading from '@/components/ui/loading'
import {
  getCurrentUser,
  isAdmin,
  getTimeSlotSettings,
  setVotingStatusForTimeSlot,
  setResultsStatusForTimeSlot,
  signOut,
  supabase,
  type TimeSlotSettings
} from '@/lib/supabase'

export default function AdminPage() {
  const [loading, setLoading] = useState(true)
  const [timeSlots, setTimeSlots] = useState<TimeSlotSettings[]>([])
  const [selectedDay, setSelectedDay] = useState('월')
  const [selectedTime, setSelectedTime] = useState('18:00')
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalProfiles: 0,
    totalVotes: 0,
    maleProfiles: 0,
    femaleProfiles: 0
  })
  const [profiles, setProfiles] = useState<Array<{
    id: string
    student_id: string
    phone_number?: string
    event_day?: string
    event_time?: string
    gender?: string
    participant_number?: number
    created_at?: string
    users?: { student_id: string }
  }>>([])
  const [error, setError] = useState('')
  const router = useRouter()

  useEffect(() => {
    const loadData = async () => {
      try {
        const { user } = getCurrentUser()
        if (!user) {
          router.push('/auth')
          return
        }

        // Check if user is admin
        if (!isAdmin()) {
          router.push('/vote')
          return
        }

        // Load time slot settings
        const { data: timeSlotsData } = await getTimeSlotSettings()
        setTimeSlots(timeSlotsData || [])

        // Load statistics
        await loadStats()
        await loadProfiles()

      } catch (err) {
        setError('데이터를 불러오는 중 오류가 발생했습니다.')
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [router])

  // Get current selected time slot status
  const getCurrentTimeSlot = () => {
    return timeSlots.find(slot =>
      slot.event_day === selectedDay && slot.event_time === selectedTime
    )
  }

  const currentSlot = getCurrentTimeSlot()

  // Available options
  const days = ['월', '화', '수']
  const times = ['18:00', '18:30', '19:00', '19:30', '20:00', '20:30', '21:00', '21:30', '22:00']

  const loadStats = async () => {
    try {
      // Get total users
      const { count: userCount } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true })

      // Get total profiles
      const { count: profileCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })

      // Get total votes
      const { count: voteCount } = await supabase
        .from('votes')
        .select('*', { count: 'exact', head: true })

      // Get gender distribution
      const { count: maleCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('gender', '남자')

      const { count: femaleCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('gender', '여자')

      setStats({
        totalUsers: userCount || 0,
        totalProfiles: profileCount || 0,
        totalVotes: voteCount || 0,
        maleProfiles: maleCount || 0,
        femaleProfiles: femaleCount || 0
      })
    } catch (err) {
      console.error('Failed to load stats:', err)
    }
  }

  const loadProfiles = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          *,
          users!profiles_user_id_fkey(student_id)
        `)
        .order('created_at', { ascending: false })

      if (error) throw error
      setProfiles(data || [])
    } catch (err) {
      console.error('Failed to load profiles:', err)
    }
  }

  const handleToggleVotingForTimeSlot = async (eventDay: string, eventTime: string, currentStatus: boolean) => {
    try {
      const newStatus = !currentStatus
      await setVotingStatusForTimeSlot(eventDay, eventTime, newStatus)

      // Update local state
      setTimeSlots(prev => prev.map(slot =>
        slot.event_day === eventDay && slot.event_time === eventTime
          ? { ...slot, voting_open: newStatus }
          : slot
      ))
    } catch (err) {
      setError('투표 상태 변경에 실패했습니다.')
    }
  }

  const handleToggleResultsForTimeSlot = async (eventDay: string, eventTime: string, currentStatus: boolean) => {
    try {
      const newStatus = !currentStatus
      await setResultsStatusForTimeSlot(eventDay, eventTime, newStatus)

      // Update local state
      setTimeSlots(prev => prev.map(slot =>
        slot.event_day === eventDay && slot.event_time === eventTime
          ? { ...slot, results_open: newStatus }
          : slot
      ))
    } catch (err) {
      setError('결과 상태 변경에 실패했습니다.')
    }
  }

  if (loading) {
    return (
      <VintageLayout>
        <Loading />
      </VintageLayout>
    )
  }

  return (
    <VintageLayout
      title="관리자 대시보드"
      subtitle="시스템 상태 및 설정 관리"
    >
      <div className="space-y-6">
        {error && (
          <div className="text-destructive text-sm text-center p-2 bg-destructive/10 rounded vintage-border">
            {error}
          </div>
        )}

        {/* Time Slot Control Panel */}
        <Card className="vintage-border">
          <CardHeader>
            <CardTitle className="vintage-title">시간대별 제어</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Time Slot Selector */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">요일 선택</label>
                <Select value={selectedDay} onValueChange={setSelectedDay}>
                  <SelectTrigger className="vintage-border">
                    <SelectValue placeholder="요일을 선택하세요" />
                  </SelectTrigger>
                  <SelectContent>
                    {days.map((day) => (
                      <SelectItem key={day} value={day}>
                        {day}요일
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">시간 선택</label>
                <Select value={selectedTime} onValueChange={setSelectedTime}>
                  <SelectTrigger className="vintage-border">
                    <SelectValue placeholder="시간을 선택하세요" />
                  </SelectTrigger>
                  <SelectContent>
                    {times.map((time) => (
                      <SelectItem key={time} value={time}>
                        {time}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Current Status Display */}
            {currentSlot && (
              <div className="p-4 bg-muted/30 rounded vintage-border">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-semibold">
                    {selectedDay}요일 {selectedTime} 상태
                  </h4>
                  <div className="flex gap-2">
                    <Badge variant={currentSlot.voting_open ? "destructive" : "secondary"}>
                      투표 {currentSlot.voting_open ? 'OPEN' : 'CLOSED'}
                    </Badge>
                    <Badge variant={currentSlot.results_open ? "destructive" : "secondary"}>
                      결과 {currentSlot.results_open ? 'OPEN' : 'CLOSED'}
                    </Badge>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={() => handleToggleVotingForTimeSlot(selectedDay, selectedTime, currentSlot.voting_open)}
                    variant={currentSlot.voting_open ? "destructive" : "default"}
                    className="vintage-button"
                  >
                    투표 {currentSlot.voting_open ? '닫기' : '열기'}
                  </Button>
                  <Button
                    onClick={() => handleToggleResultsForTimeSlot(selectedDay, selectedTime, currentSlot.results_open)}
                    variant={currentSlot.results_open ? "destructive" : "default"}
                    className="vintage-button"
                  >
                    결과 {currentSlot.results_open ? '닫기' : '열기'}
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Statistics */}
        <Card className="vintage-border">
          <CardHeader>
            <CardTitle className="vintage-title">통계</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="text-center p-3 bg-muted/50 rounded vintage-border">
                <div className="text-2xl font-bold text-primary">{stats.totalUsers}</div>
                <div className="text-sm text-muted-foreground">총 사용자</div>
              </div>
              <div className="text-center p-3 bg-muted/50 rounded vintage-border">
                <div className="text-2xl font-bold text-primary">{stats.totalProfiles}</div>
                <div className="text-sm text-muted-foreground">총 프로필</div>
              </div>
              <div className="text-center p-3 bg-muted/50 rounded vintage-border">
                <div className="text-2xl font-bold text-primary">{stats.totalVotes}</div>
                <div className="text-sm text-muted-foreground">총 투표</div>
              </div>
              <div className="text-center p-3 bg-muted/50 rounded vintage-border">
                <div className="text-2xl font-bold text-blue-600">{stats.maleProfiles}</div>
                <div className="text-sm text-muted-foreground">남자</div>
              </div>
              <div className="text-center p-3 bg-muted/50 rounded vintage-border">
                <div className="text-2xl font-bold text-pink-600">{stats.femaleProfiles}</div>
                <div className="text-sm text-muted-foreground">여자</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Profiles List */}
        <Card className="vintage-border">
          <CardHeader>
            <CardTitle className="vintage-title">참가자 목록</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {profiles.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">등록된 프로필이 없습니다.</p>
              ) : (
                profiles.map((profile) => (
                  <div key={profile.id} className="flex items-center justify-between p-3 bg-muted/30 rounded vintage-border">
                    <div className="flex items-center gap-3">
                      <Badge variant={profile.gender === '남자' ? 'default' : 'secondary'}>
                        {profile.gender}
                      </Badge>
                      <span className="font-medium">
                        {profile.participant_number}번
                      </span>
                      <span className="text-sm text-muted-foreground">
                        {profile.event_day}요일 {profile.event_time}
                      </span>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium">
                        {profile.users?.student_id || 'N/A'}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {profile.phone_number || '연락처 없음'}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Navigation */}
        <div className="flex gap-2">
          <Button
            onClick={() => router.push('/vote')}
            variant="outline"
            className="vintage-border"
          >
            투표 페이지로
          </Button>
          <Button
            onClick={async () => {
              await signOut()
              router.push('/auth')
            }}
            variant="outline"
            className="vintage-border"
          >
            로그아웃
          </Button>
        </div>
      </div>
    </VintageLayout>
  )
}
