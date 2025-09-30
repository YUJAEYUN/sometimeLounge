import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Types based on actual database schema
export interface User {
  id: number // int4, PK in users table
  student_id: string
  password_hash: string
  created_at?: string
}

export interface Profile {
  id: string // UUID, foreign key to auth.users.id
  student_id: string
  phone_number?: string
  event_day?: string
  event_time?: string
  gender?: string
  participant_number?: number
  created_at?: string
  updated_at?: string
  user_id: number // foreign key to users.id
}

export interface Vote {
  id: number
  voter_profile_id: string // UUID
  voted_for_profile_id: string // UUID
  created_at?: string
  user_id: number // foreign key to users.id
}

export interface MatchResult {
  matched_user_id: number
  matched_participant_number: number
  matched_gender: string
  matched_student_id: string
  matched_phone_number?: string
  event_day: string
  event_time: string
}

export interface AppSettings {
  id: number
  key: string
  value: string
  updated_at?: string
}

export interface TimeSlotSettings {
  id: number
  event_day: string
  event_time: string
  voting_open: boolean
  results_open: boolean
  created_at?: string
  updated_at?: string
}

// Custom auth using only student ID (auto signup/login)
export const signInOrSignUp = async (studentId: string) => {
  try {
    // First, try to find existing user
    const { data: existingUser, error: findError } = await supabase
      .from('users')
      .select('*')
      .eq('student_id', studentId)
      .single()

    // If user exists, log them in
    if (existingUser && !findError) {
      localStorage.setItem('currentUser', JSON.stringify(existingUser))
      return { data: existingUser, error: null, isNewUser: false }
    }

    // If user doesn't exist, create new user (auto signup)
    const { data: newUser, error: createError } = await supabase
      .from('users')
      .insert([
        { student_id: studentId, password_hash: '' } // Empty password hash since we don't use passwords
      ])
      .select()
      .single()

    if (createError) {
      return { data: null, error: createError.message, isNewUser: false }
    }

    // Store user session in localStorage
    localStorage.setItem('currentUser', JSON.stringify(newUser))

    return { data: newUser, error: null, isNewUser: true }
  } catch (err) {
    return { data: null, error: 'Login/Signup failed', isNewUser: false }
  }
}

// Legacy functions kept for backward compatibility (deprecated)
export const signUp = async (studentId: string, password: string = '') => {
  return signInOrSignUp(studentId)
}

export const signIn = async (studentId: string, password: string = '') => {
  return signInOrSignUp(studentId)
}

export const signOut = async () => {
  try {
    localStorage.removeItem('currentUser')
    return { error: null }
  } catch (err) {
    return { error: 'Logout failed' }
  }
}

export const getCurrentUser = () => {
  try {
    if (typeof window === 'undefined') return { user: null, error: null }
    
    const userStr = localStorage.getItem('currentUser')
    if (!userStr) return { user: null, error: null }
    
    const user = JSON.parse(userStr)
    return { user, error: null }
  } catch (err) {
    return { user: null, error: 'Failed to get current user' }
  }
}

// Profile helper functions
export const createProfile = async (profileData: Omit<Profile, 'id' | 'student_id' | 'user_id' | 'created_at' | 'updated_at'>) => {
  const { user } = getCurrentUser()
  if (!user) throw new Error('User not authenticated')

  // Generate a UUID for the profile
  const profileId = crypto.randomUUID()

  const { data, error } = await supabase
    .from('profiles')
    .insert({
      id: profileId, // Generate new UUID for profile
      student_id: user.student_id,
      user_id: user.id, // Reference to custom users table
      ...profileData
    })
    .select()
    .single()

  return { data, error }
}

export const getProfile = async () => {
  const { user } = getCurrentUser()
  if (!user) throw new Error('User not authenticated')

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('user_id', user.id)
    .single()

  return { data, error }
}

export const updateProfile = async (profileData: Partial<Omit<Profile, 'id' | 'user_id' | 'created_at'>>) => {
  const { user } = getCurrentUser()
  if (!user) throw new Error('User not authenticated')

  const { data, error } = await supabase
    .from('profiles')
    .update({
      ...profileData,
      updated_at: new Date().toISOString()
    })
    .eq('user_id', user.id)
    .select()
    .single()

  return { data, error }
}

// Vote helper functions
export const createVote = async (voteData: Omit<Vote, 'id' | 'user_id' | 'created_at'>) => {
  const { user } = getCurrentUser()
  if (!user) throw new Error('User not authenticated')

  const { data, error } = await supabase
    .from('votes')
    .insert({
      user_id: user.id,
      ...voteData
    })
    .select()
    .single()

  return { data, error }
}

export const getUserVote = async () => {
  const { user } = getCurrentUser()
  if (!user) throw new Error('User not authenticated')

  const { data, error } = await supabase
    .from('votes')
    .select('*')
    .eq('user_id', user.id)
    .single()

  return { data, error }
}

// Submit multiple votes
export const submitVotes = async (selectedVotes: string[]) => {
  const { user } = getCurrentUser()
  if (!user) throw new Error('User not authenticated')

  // Get current user's profile to get the profile ID
  const { data: profile, error: profileError } = await getProfile()
  if (profileError || !profile) {
    return { data: null, error: 'Profile not found' }
  }

  try {
    // First, delete existing votes for this user
    await supabase
      .from('votes')
      .delete()
      .eq('user_id', user.id)

    // Create new votes - selectedVotes now contains actual profile IDs
    const votesToInsert = selectedVotes.map(targetProfileId => ({
      voter_profile_id: profile.id,
      voted_for_profile_id: targetProfileId,
      user_id: user.id
    }))

    if (votesToInsert.length === 0) {
      return { data: null, error: 'No valid targets found for votes' }
    }

    const { data, error } = await supabase
      .from('votes')
      .insert(votesToInsert)
      .select()

    return { data, error }
  } catch (err) {
    return { data: null, error: 'Failed to submit votes' }
  }
}

// App settings helper functions
export const getAppSettings = async () => {
  const { data, error } = await supabase
    .from('app_settings')
    .select('*')
    .single()

  return { data, error }
}

export const updateAppSettings = async (settings: Partial<Omit<AppSettings, 'id'>>) => {
  const { data, error } = await supabase
    .from('app_settings')
    .update(settings)
    .eq('id', 1)
    .select()
    .single()

  return { data, error }
}

// Admin functions
const ADMIN_STUDENT_IDS = ['admin', 'adminadmin'] // Add admin student IDs here

export const isAdmin = () => {
  const { user } = getCurrentUser()
  return user && ADMIN_STUDENT_IDS.includes(user.student_id)
}

export const getVotingStatus = async () => {
  const { data, error } = await supabase
    .from('app_settings')
    .select('*')
    .eq('key', 'voting_open')
    .single()

  if (error && error.code === 'PGRST116') {
    // Setting doesn't exist, create it
    const { data: newData, error: createError } = await supabase
      .from('app_settings')
      .insert({ key: 'voting_open', value: 'false' })
      .select()
      .single()

    return { data: newData, error: createError }
  }

  return { data, error }
}

export const setVotingStatus = async (isOpen: boolean) => {
  // First try to update existing record
  const { data: updateData, error: updateError } = await supabase
    .from('app_settings')
    .update({ value: isOpen.toString() })
    .eq('key', 'voting_open')
    .select()
    .single()

  if (updateError && updateError.code === 'PGRST116') {
    // Record doesn't exist, create it
    const { data: insertData, error: insertError } = await supabase
      .from('app_settings')
      .insert({ key: 'voting_open', value: isOpen.toString() })
      .select()
      .single()

    return { data: insertData, error: insertError }
  }

  return { data: updateData, error: updateError }
}

export const getResultsStatus = async () => {
  const { data, error } = await supabase
    .from('app_settings')
    .select('*')
    .eq('key', 'results_open')
    .single()

  if (error && error.code === 'PGRST116') {
    // Setting doesn't exist, create it
    const { data: newData, error: createError } = await supabase
      .from('app_settings')
      .insert({ key: 'results_open', value: 'false' })
      .select()
      .single()

    return { data: newData, error: createError }
  }

  return { data, error }
}

export const setResultsStatus = async (isOpen: boolean) => {
  // First try to update existing record
  const { data: updateData, error: updateError } = await supabase
    .from('app_settings')
    .update({ value: isOpen.toString() })
    .eq('key', 'results_open')
    .select()
    .single()

  if (updateError && updateError.code === 'PGRST116') {
    // Record doesn't exist, create it
    const { data: insertData, error: insertError } = await supabase
      .from('app_settings')
      .insert({ key: 'results_open', value: isOpen.toString() })
      .select()
      .single()

    return { data: insertData, error: insertError }
  }

  return { data: updateData, error: updateError }
}

// Get matches for current user
export const getMatches = async (): Promise<{ data: MatchResult[] | null, error: string | null }> => {
  try {
    const { user } = getCurrentUser()
    if (!user) {
      return { data: null, error: 'User not authenticated' }
    }

    const { data: profile } = await getProfile()
    if (!profile) {
      return { data: null, error: 'Profile not found' }
    }

    // Step 1: Get profiles that current user voted for
    const { data: myVotes, error: myVotesError } = await supabase
      .from('votes')
      .select('voted_for_profile_id')
      .eq('voter_profile_id', profile.id)

    if (myVotesError) {
      return { data: null, error: myVotesError.message }
    }

    if (!myVotes || myVotes.length === 0) {
      return { data: [], error: null }
    }

    const votedForProfileIds = myVotes.map(vote => vote.voted_for_profile_id)

    // Step 2: Find profiles that also voted for current user (mutual matches)
    const { data: mutualVotes, error: mutualVotesError } = await supabase
      .from('votes')
      .select('voter_profile_id')
      .eq('voted_for_profile_id', profile.id)
      .in('voter_profile_id', votedForProfileIds)

    if (mutualVotesError) {
      return { data: null, error: mutualVotesError.message }
    }

    if (!mutualVotes || mutualVotes.length === 0) {
      return { data: [], error: null }
    }

    const mutualProfileIds = mutualVotes.map(vote => vote.voter_profile_id)

    // Step 3: Get profile details for mutual matches
    const { data: matchedProfiles, error: profilesError } = await supabase
      .from('profiles')
      .select(`
        id,
        participant_number,
        gender,
        event_day,
        event_time,
        phone_number,
        users!profiles_user_id_fkey (
          id,
          student_id
        )
      `)
      .in('id', mutualProfileIds)

    if (profilesError) {
      return { data: null, error: profilesError.message }
    }

    // Transform the data to match MatchResult interface
    const matchResults: MatchResult[] = (matchedProfiles || []).map(profile => {
      const user = Array.isArray(profile.users) ? profile.users[0] : profile.users
      return {
        matched_user_id: user?.id || 0,
        matched_participant_number: profile.participant_number || 0,
        matched_gender: profile.gender || '',
        matched_student_id: user?.student_id || '',
        matched_phone_number: profile.phone_number,
        event_day: profile.event_day || '',
        event_time: profile.event_time || ''
      }
    })

    return { data: matchResults, error: null }
  } catch (err) {
    return { data: null, error: 'Failed to get matches' }
  }
}

// Get all time slot settings
export const getTimeSlotSettings = async () => {
  const { data, error } = await supabase
    .from('time_slot_settings')
    .select('*')
    .order('event_day', { ascending: true })
    .order('event_time', { ascending: true })

  return { data, error }
}

// Get voting status for specific time slot
export const getVotingStatusForTimeSlot = async (eventDay: string, eventTime: string) => {
  const { data, error } = await supabase
    .from('time_slot_settings')
    .select('voting_open')
    .eq('event_day', eventDay)
    .eq('event_time', eventTime)
    .single()

  return { data, error }
}

// Get results status for specific time slot
export const getResultsStatusForTimeSlot = async (eventDay: string, eventTime: string) => {
  const { data, error } = await supabase
    .from('time_slot_settings')
    .select('results_open')
    .eq('event_day', eventDay)
    .eq('event_time', eventTime)
    .single()

  return { data, error }
}

// Set voting status for specific time slot
export const setVotingStatusForTimeSlot = async (eventDay: string, eventTime: string, isOpen: boolean) => {
  const { data, error } = await supabase
    .from('time_slot_settings')
    .update({
      voting_open: isOpen,
      updated_at: new Date().toISOString()
    })
    .eq('event_day', eventDay)
    .eq('event_time', eventTime)
    .select()
    .single()

  return { data, error }
}

// Set results status for specific time slot
export const setResultsStatusForTimeSlot = async (eventDay: string, eventTime: string, isOpen: boolean) => {
  const { data, error } = await supabase
    .from('time_slot_settings')
    .update({
      results_open: isOpen,
      updated_at: new Date().toISOString()
    })
    .eq('event_day', eventDay)
    .eq('event_time', eventTime)
    .select()
    .single()

  return { data, error }
}
