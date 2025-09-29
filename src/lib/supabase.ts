import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Types based on actual database schema
export interface User {
  id: number
  student_id: string
  password_hash: string
  created_at?: string
}

export interface Profile {
  id: string // UUID
  student_id: string
  phone_number?: string
  event_day?: string
  event_time?: string
  gender?: string
  participant_number?: number
  created_at?: string
  updated_at?: string
  user_id?: number
}

export interface Vote {
  id: number
  voter_profile_id: string // UUID
  voted_for_profile_id: string // UUID
  created_at?: string
  user_id?: number
}

export interface AppSettings {
  id: number
  key: string
  value: string
  updated_at?: string
}

// Custom auth helper functions using student ID and password
export const signUp = async (studentId: string, password: string) => {
  try {
    // Hash password (in production, use bcrypt or similar)
    const passwordHash = btoa(password) // Simple base64 encoding for demo
    
    const { data, error } = await supabase
      .from('users')
      .insert([
        { student_id: studentId, password_hash: passwordHash }
      ])
      .select()
      .single()
    
    if (error) {
      // Check for duplicate student ID error
      if (error.code === '23505' && error.message.includes('student_id')) {
        return { data: null, error: '이미 가입된 학번입니다.' }
      }
      return { data: null, error: error.message }
    }
    
    return { data, error: null }
  } catch (err) {
    return { data: null, error: 'Registration failed' }
  }
}

export const signIn = async (studentId: string, password: string) => {
  try {
    const passwordHash = btoa(password) // Simple base64 encoding for demo
    
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('student_id', studentId)
      .eq('password_hash', passwordHash)
      .single()
    
    if (error || !data) {
      return { data: null, error: 'Invalid student ID or password' }
    }
    
    // Store user session in localStorage
    localStorage.setItem('currentUser', JSON.stringify(data))
    
    return { data, error: null }
  } catch (err) {
    return { data: null, error: 'Login failed' }
  }
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

  // Generate UUID for the profile
  const profileId = crypto.randomUUID()

  const { data, error } = await supabase
    .from('profiles')
    .insert({
      id: profileId,
      student_id: user.student_id,
      user_id: user.id,
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
