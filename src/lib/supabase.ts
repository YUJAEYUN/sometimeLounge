import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Types for our database tables
export interface Profile {
  id: string
  student_id: string
  phone_number?: string
  event_day?: string
  event_time?: string
  gender?: string
  participant_number?: number
  created_at?: string
  updated_at?: string
}

export interface Vote {
  id: number
  voter_profile_id: string
  voted_for_profile_id: string
  created_at?: string
}

export interface AppSetting {
  id: number
  key: string
  value: string
  updated_at?: string
}

export interface MatchResult {
  matched_user_id: string
  matched_student_id: string
  matched_gender: string
  matched_participant_number: number
  matched_phone_number: string
  event_day: string
  event_time: string
}

// Auth helper functions
export const signUp = async (studentId: string, password: string) => {
  const { data, error } = await supabase.auth.signUp({
    email: `${studentId}@hanbat.ac.kr`, // Using student ID as email format
    password,
    options: {
      data: {
        student_id: studentId,
      }
    }
  })
  return { data, error }
}

export const signIn = async (studentId: string, password: string) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email: `${studentId}@hanbat.ac.kr`,
    password,
  })
  return { data, error }
}

export const signOut = async () => {
  const { error } = await supabase.auth.signOut()
  return { error }
}

// Profile helper functions
export const createProfile = async (profileData: Omit<Profile, 'id' | 'created_at' | 'updated_at'>) => {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('User not authenticated')

  const { data, error } = await supabase
    .from('profiles')
    .insert({
      id: user.id,
      ...profileData
    })
    .select()
    .single()

  return { data, error }
}

export const getProfile = async () => {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('User not authenticated')

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  return { data, error }
}

// Voting helper functions
export const submitVotes = async (votedForIds: string[]) => {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('User not authenticated')

  // First, delete existing votes
  await supabase
    .from('votes')
    .delete()
    .eq('voter_profile_id', user.id)

  // Then insert new votes
  const votes = votedForIds.map(votedForId => ({
    voter_profile_id: user.id,
    voted_for_profile_id: votedForId
  }))

  const { data, error } = await supabase
    .from('votes')
    .insert(votes)
    .select()

  return { data, error }
}

export const getMyVotes = async () => {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('User not authenticated')

  const { data, error } = await supabase
    .from('votes')
    .select('*')
    .eq('voter_profile_id', user.id)

  return { data, error }
}

// Matching helper functions
export const getMyMatches = async (): Promise<{ data: MatchResult[] | null, error: any }> => {
  const { data, error } = await supabase.rpc('get_my_matches')
  return { data, error }
}

// App settings helper functions
export const getAppSetting = async (key: string) => {
  const { data, error } = await supabase
    .from('app_settings')
    .select('value')
    .eq('key', key)
    .single()

  return { data, error }
}

export const isVotingOpen = async () => {
  const { data, error } = await getAppSetting('is_voting_open')
  if (error) return { data: false, error }
  return { data: data.value === 'true', error: null }
}
