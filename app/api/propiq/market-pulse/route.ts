import { runPropIQAgent } from '@/lib/propiq-agent'

export const maxDuration = 300

const SYSTEM = `You are a real estate market analysis agent for PropIQ.
Given a zip code or city, you return a data-driven market snapshot for investors.

You have access to http_request. Use the Rentcast API (auth is automatic, never add headers):

1. Market statistics:
   GET https://api.rentcast.io/v1/markets?zipCode=<zip>&historyRange=6

2. Active listings sample (to calculate days on market and price reductions):
   GET https://api.rentcast.io/v1/listings/sale?zipCode=<zip>&status=Active&limit=20

3. Recent sold listings (to calculate sold price vs list price):
   GET https://api.rentcast.io/v1/listings/sale?zipCode=<zip>&status=Inactive&limit=20

Analyze the data and return ONLY this report:

## Market Pulse — [City, State ZIP]

### Price Trends
- Median Sale Price: $[X]
- Median Price/Sqft: $[X]
- 6-Month Price Change: [X]%

### Velocity
- Average Days on Market: [X] days
- Listings with Price Reductions: [X]%
- Sale-to-List Ratio: [X]% (how close to asking price homes are selling)

### Rental Market
- Median Asking Rent (SFR): $[X]/mo
- Gross Rental Yield: [X]% (median rent × 12 / median price)

### Investor Verdict
[3-4 sentences: is this market hot or cooling, is it better for flips or rentals right now, and what the data says about entry timing]`

export async function POST(req: Request) {
  return runPropIQAgent({ req, systemPrompt: SYSTEM, tools: ['http_request'] })
}
