import { NextResponse } from 'next/server'
import { createAuthClient } from '@/lib/supabase/server'

export interface SkipTraceResult {
  name: string
  phones: string[]
  emails: string[]
  age?: string
  currentAddress?: string
}

// Response shape from usa-people-search-public-records.p.rapidapi.com
interface USAPeopleRecord {
  FullName?: string
  FirstName?: string
  LastName?: string
  Age?: string | number
  PhoneNumbers?: Array<string | { Number?: string; PhoneNumber?: string }>
  Emails?: Array<string | { Email?: string; EmailAddress?: string }>
  Addresses?: Array<string | { FullAddress?: string; Address?: string; City?: string; State?: string; Zip?: string }>
  Address?: string
  Phone?: string
  Email?: string
}

export async function POST(req: Request) {
  const supabase = await createAuthClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { name, city, state } = await req.json() as {
    name: string
    city?: string
    state?: string
  }

  if (!name?.trim()) {
    return NextResponse.json({ error: 'Name is required' }, { status: 400 })
  }

  // Use only the primary name (before & or "and")
  const primaryName = name.trim().split(/\s*[&]\s*/)[0].trim()
  const nameParts = primaryName.split(/\s+/)
  const firstName = nameParts[0] ?? ''
  const lastName = nameParts.slice(1).join(' ') ?? ''

  try {
    const params = new URLSearchParams({ FirstName: firstName, LastName: lastName })
    if (state) params.set('State', state)
    if (city) params.set('City', city)

    const res = await fetch(
      `https://usa-people-search-public-records.p.rapidapi.com/SearchPeople?${params}`,
      {
        headers: {
          'x-rapidapi-key': process.env.RAPIDAPI_KEY ?? '',
          'x-rapidapi-host': 'usa-people-search-public-records.p.rapidapi.com',
          'Content-Type': 'application/json',
        },
      }
    )

    const raw = await res.json() as {
      Code?: number
      Description?: string
      Source1?: USAPeopleRecord[]
    }

    console.log('[SkipTracer] status:', res.status, 'code:', raw.Code, 'records:', raw.Source1?.length ?? 0)

    const records = raw.Source1 ?? []

    if (records.length === 0) {
      return NextResponse.json({ results: [], note: 'No public records found for this owner. Try searching on BatchSkipTracing.com for more coverage.' })
    }

    const results: SkipTraceResult[] = records.slice(0, 3).map((r) => {
      // Normalize phones — field can be string[], object[], or a single string
      const phones: string[] = []
      if (r.Phone) phones.push(r.Phone)
      if (Array.isArray(r.PhoneNumbers)) {
        r.PhoneNumbers.forEach((p) => {
          if (typeof p === 'string') phones.push(p)
          else if (p.Number) phones.push(p.Number)
          else if (p.PhoneNumber) phones.push(p.PhoneNumber)
        })
      }

      // Normalize emails
      const emails: string[] = []
      if (r.Email) emails.push(r.Email)
      if (Array.isArray(r.Emails)) {
        r.Emails.forEach((e) => {
          if (typeof e === 'string') emails.push(e)
          else if (e.Email) emails.push(e.Email)
          else if (e.EmailAddress) emails.push(e.EmailAddress)
        })
      }

      // Normalize address
      let currentAddress: string | undefined
      if (r.Address) {
        currentAddress = r.Address
      } else if (Array.isArray(r.Addresses) && r.Addresses.length > 0) {
        const a = r.Addresses[0]
        if (typeof a === 'string') currentAddress = a
        else currentAddress = a.FullAddress ?? a.Address ?? [a.City, a.State, a.Zip].filter(Boolean).join(', ')
      }

      return {
        name: r.FullName ?? `${r.FirstName ?? firstName} ${r.LastName ?? lastName}`.trim(),
        age: r.Age !== undefined ? String(r.Age) : undefined,
        phones: [...new Set(phones)].slice(0, 4),
        emails: [...new Set(emails)].slice(0, 3),
        currentAddress,
      }
    })

    return NextResponse.json({ results })
  } catch (err) {
    console.error('[SkipTracer] error:', err)
    return NextResponse.json(
      { error: 'Skip trace lookup failed. Please try again.' },
      { status: 500 }
    )
  }
}
