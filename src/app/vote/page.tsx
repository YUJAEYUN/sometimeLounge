'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import VintageLayout from '@/components/layout/VintageLayout'
import Loading from '@/components/ui/loading'
import {
  getCurrentUser,
  getProfile,
  type Profile
} from '@/lib/supabase'

export default function VotePage() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [selectedVotes, setSelectedVotes] = useState<string[]>([])
  const [existingVotes, setExistingVotes] = useState<string[]>([])
  const [matches, setMatches] = useState<MatchResult[]>([])
  const [votingOpen, setVotingOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [showResults, setShowResults] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const loadData = async () => {
      try {
        const { user } = getCurrentUser()
        if (!user) {
          router.push('/auth')
          return
        }

        // Load profile
        const { data: profileData, error: profileError } = await getProfile()
        if (profileError || !profileData) {
          router.push('/profile')
          return
        }
        setProfile(profileData)

        // For now, set voting as open
        setVotingOpen(true)

      } catch (err) {
        setError('데이터를 불러오는 중 오류가 발생했습니다.')
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [router])

  const handleVoteChange = (participantId: string, checked: boolean) => {
    if (checked) {
      setSelectedVotes([...selectedVotes, participantId])
    } else {
      setSelectedVotes(selectedVotes.filter(id => id !== participantId))
    }
  }

  const handleSubmitVotes = async () => {
    setSubmitting(true)
    setError('')

    try {
      const { error } = await submitVotes(selectedVotes)
      if (error) {
        setError('투표 저장에 실패했습니다. 다시 시도해주세요.')
        return
      }

      setExistingVotes(selectedVotes)
      alert('투표가 저장되었습니다!')
    } catch (err) {
      setError('오류가 발생했습니다. 다시 시도해주세요.')
    } finally {
      setSubmitting(false)
    }
  }

  const getOppositeGenderNumbers = () => {
    if (!profile) return []
    const oppositeGender = profile.gender === '남자' ? '여자' : '남자'
    return [1, 2, 3, 4, 5, 6].map(num => ({
      number: num,
      label: `${num}번 ${oppositeGender}`,
      id: `${profile.event_day}-${profile.event_time}-${oppositeGender}-${num}`
    }))
  }

  if (loading) {
    return (
      <VintageLayout>
        <Loading />
      </VintageLayout>
    )
  }

  if (!profile) {
    return (
      <VintageLayout title="오류">
        <div className="text-center">
          <p className="text-destructive">프로필 정보를 찾을 수 없습니다.</p>
          <Button onClick={() => router.push('/profile')} className="mt-4 vintage-button">
            프로필 설정하기
          </Button>
        </div>
      </VintageLayout>
    )
  }

  const oppositeGenderOptions = getOppositeGenderNumbers()

  return (
    <VintageLayout 
      title={showResults ? '매칭 결과' : '호감 상대 선택'}
      subtitle={showResults ? '매칭된 상대방을 확인하세요' : '마음에 드는 상대방을 선택해주세요'}
    >
      <div className="space-y-4">
        {/* Profile Info */}
        <div className="text-center p-3 bg-muted/50 rounded vintage-border">
          <p className="text-sm">
            <span className="font-semibold">{profile.event_day}요일 {profile.event_time}</span>
            <br />
            <span>{profile.participant_number}번 {profile.gender}</span>
          </p>
        </div>

        {/* Toggle between voting and results */}
        <div className="flex gap-2">
          <Button
            variant={!showResults ? "default" : "outline"}
            onClick={() => setShowResults(false)}
            className={!showResults ? "vintage-button" : "vintage-border"}
          >
            투표하기
          </Button>
          <Button
            variant={showResults ? "default" : "outline"}
            onClick={() => setShowResults(true)}
            className={showResults ? "vintage-button" : "vintage-border"}
          >
            결과보기
          </Button>
        </div>

        {!showResults ? (
          /* Voting Section */
          <>
            {!votingOpen ? (
              <div className="text-center p-4 bg-muted/50 rounded vintage-border">
                <p className="text-muted-foreground">투표 대기 중입니다</p>
                <p className="text-sm text-muted-foreground mt-2">
                  운영진이 투표를 시작하면 선택할 수 있습니다.
                </p>
              </div>
            ) : (
              <>
                <div className="space-y-3">
                  {oppositeGenderOptions.map((option) => (
                    <div key={option.id} className="flex items-center space-x-3 p-3 vintage-border rounded">
                      <Checkbox
                        id={option.id}
                        checked={selectedVotes.includes(option.id)}
                        onCheckedChange={(checked) => handleVoteChange(option.id, checked as boolean)}
                        disabled={!votingOpen}
                      />
                      <Label htmlFor={option.id} className="flex-1 cursor-pointer">
                        {option.label}
                      </Label>
                    </div>
                  ))}
                </div>

                {error && (
                  <div className="text-destructive text-sm text-center p-2 bg-destructive/10 rounded vintage-border">
                    {error}
                  </div>
                )}

                <Button 
                  onClick={handleSubmitVotes}
                  className="w-full vintage-button"
                  disabled={submitting || selectedVotes.length === 0}
                >
                  {submitting ? '저장 중...' : '투표 저장하기'}
                </Button>

                {existingVotes.length > 0 && (
                  <div className="text-xs text-muted-foreground text-center">
                    * 이전 투표: {existingVotes.length}명 선택
                  </div>
                )}
              </>
            )}
          </>
        ) : (
          /* Results Section */
          <div className="space-y-4">
            {matches.length > 0 ? (
              <>
                <div className="text-center p-4 bg-primary/10 rounded vintage-border">
                  <h3 className="vintage-title text-lg text-primary">매칭 성공! 🥳</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    {matches.length}명과 매칭되었습니다
                  </p>
                </div>
                
                {matches.map((match, index) => (
                  <div key={match.matched_user_id} className="p-4 vintage-border rounded space-y-2">
                    <div className="flex justify-between items-center">
                      <h4 className="font-semibold">
                        {match.matched_participant_number}번 {match.matched_gender}
                      </h4>
                      <span className="text-sm text-muted-foreground">
                        {match.event_day}요일 {match.event_time}
                      </span>
                    </div>
                    <div className="text-sm">
                      <p><span className="font-medium">연락처:</span> {match.matched_phone_number}</p>
                    </div>
                  </div>
                ))}
              </>
            ) : (
              <div className="text-center p-4 bg-muted/50 rounded vintage-border">
                <h3 className="vintage-title text-lg text-muted-foreground">아쉽지만 매칭에 실패했어요 😢</h3>
                <p className="text-sm text-muted-foreground mt-2">
                  다음 기회에 다시 도전해보세요!
                </p>
              </div>
            )}
          </div>
        )}

        {/* Logout Button */}
        <div className="pt-4 border-t border-border">
          <Button
            variant="outline"
            onClick={async () => {
              await supabase.auth.signOut()
              router.push('/auth')
            }}
            className="w-full vintage-border"
          >
            로그아웃
          </Button>
        </div>
      </div>
    </VintageLayout>
  )
}
