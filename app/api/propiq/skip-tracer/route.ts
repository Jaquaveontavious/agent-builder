import { NextResponse } from 'next/server'
import { createAuthClient } from '@/lib/supabase/server'

export interface SkipTraceResult {
  name: string
  phones: string[]
  emails: string[]
  age?: string
  currentAddress?: string
  city?: string
  state?: string
}

// Response shape from usa-people-search-public-records.p.rapidapi.com
interface USAPeopleRecord {
  FullName?: string
  FirstName?: string
  LastName?: string
  Age?: string | number
  PeoplePhone?: Array<{ PhoneNumber?: string; LineType?: string }>
  Email?: Array<{ EmailAddress?: string } | string>
  Address?: string
  Previous_Addresse?: string
  City?: string
  State?: string
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
    // Note: this API returns 404 with any location filter — name-only gives best coverage
    const params = new URLSearchParams({ FirstName: firstName, LastName: lastName })

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
      // Phones — API returns PeoplePhone array
      const phones: string[] = []
      if (Array.isArray(r.PeoplePhone)) {
        r.PeoplePhone.forEach((p) => {
          if (p.PhoneNumber) phones.push(p.PhoneNumber)
        })
      }

      // Emails — API returns Email array
      const emails: string[] = []
      if (Array.isArray(r.Email)) {
        r.Email.forEach((e) => {
          if (typeof e === 'string') emails.push(e)
          else if (e.EmailAddress) emails.push(e.EmailAddress)
        })
      }

      // Address
      const currentAddress = r.Address ?? (r.City && r.State ? `${r.City}, ${r.State}` : undefined)

      return {
        name: r.FullName ?? `${r.FirstName ?? firstName} ${r.LastName ?? lastName}`.trim(),
        age: r.Age !== undefined ? String(r.Age) : undefined,
        phones: phones.filter((v, i, a) => a.indexOf(v) === i).slice(0, 4),
        emails: emails.filter((v, i, a) => a.indexOf(v) === i).slice(0, 3),
        currentAddress,
        city: r.City,
        state: r.State,
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
