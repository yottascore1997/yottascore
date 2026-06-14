import { fetchWithTimeout } from '@/lib/fetch-with-timeout'

const CACHE_KEY = 'study_partner_discovery_v1'
const CACHE_TTL_MS = 3 * 60 * 1000

export type DiscoveryCard = {
  id: string
  userId: string
  name: string | null
  profilePhoto: string | null
  photos?: string[]
  bio: string | null
  examType: string | null
  goals: string | null
  studyTimeFrom: string | null
  studyTimeTo: string | null
  studyTimeSlot?: string | null
  gender?: string | null
  age?: number | null
  language: string | null
  city?: string | null
  subjects: string[]
  verified?: boolean
}

type CachePayload = { at: number; list: DiscoveryCard[] }

export function getCachedDiscovery(): DiscoveryCard[] | null {
  if (typeof sessionStorage === 'undefined') return null
  try {
    const raw = sessionStorage.getItem(CACHE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as CachePayload
    if (Date.now() - parsed.at > CACHE_TTL_MS) return null
    return Array.isArray(parsed.list) ? parsed.list : null
  } catch {
    return null
  }
}

export function setCachedDiscovery(list: DiscoveryCard[]) {
  if (typeof sessionStorage === 'undefined') return
  try {
    const payload: CachePayload = { at: Date.now(), list }
    sessionStorage.setItem(CACHE_KEY, JSON.stringify(payload))
  } catch {
    // quota / private mode
  }
}

export function invalidateDiscoveryCache() {
  if (typeof sessionStorage === 'undefined') return
  try {
    sessionStorage.removeItem(CACHE_KEY)
  } catch {}
}

/** Warm cache from Study Partner hub so Discover opens fast */
export async function prefetchDiscovery(token: string): Promise<void> {
  try {
    const res = await fetchWithTimeout(
      '/api/student/study-partner/discovery?limit=12',
      { headers: { Authorization: `Bearer ${token}` } },
      10000
    )
    if (res.ok) {
      const data = await res.json()
      if (Array.isArray(data)) setCachedDiscovery(data)
    }
  } catch {
    // ignore
  }
}
