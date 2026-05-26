export interface AgentTemplate {
  id: string
  name: string
  tagline: string
  description: string
  category: string
  emoji: string
  tools: string[]
  popular?: boolean
}

export interface TemplateCategory {
  id: string
  name: string
  emoji: string
  tagline: string
  accent: string   // tailwind text color
  border: string   // tailwind border color
  bg: string       // tailwind bg color (subtle)
  glow: string     // tailwind ring/glow color
}

export const CATEGORIES: TemplateCategory[] = [
  {
    id: 'money',
    name: 'Money & Investing',
    emoji: '💰',
    tagline: 'Grow and protect your wealth',
    accent: 'text-emerald-400',
    border: 'border-emerald-800',
    bg: 'bg-emerald-950/30',
    glow: 'hover:border-emerald-600',
  },
  {
    id: 'sales',
    name: 'Sales & Lead Gen',
    emoji: '📈',
    tagline: 'Fill your pipeline and close faster',
    accent: 'text-blue-400',
    border: 'border-blue-800',
    bg: 'bg-blue-950/30',
    glow: 'hover:border-blue-600',
  },
  {
    id: 'career',
    name: 'Career & Jobs',
    emoji: '👔',
    tagline: 'Get hired, promoted, and paid more',
    accent: 'text-violet-400',
    border: 'border-violet-800',
    bg: 'bg-violet-950/30',
    glow: 'hover:border-violet-600',
  },
  {
    id: 'health',
    name: 'Health & Fitness',
    emoji: '🏃',
    tagline: 'Build the body and mind you want',
    accent: 'text-rose-400',
    border: 'border-rose-800',
    bg: 'bg-rose-950/30',
    glow: 'hover:border-rose-600',
  },
  {
    id: 'productivity',
    name: 'Productivity',
    emoji: '⚡',
    tagline: 'Get more done in less time',
    accent: 'text-amber-400',
    border: 'border-amber-800',
    bg: 'bg-amber-950/30',
    glow: 'hover:border-amber-600',
  },
  {
    id: 'content',
    name: 'Content & Marketing',
    emoji: '✍️',
    tagline: 'Create content that converts',
    accent: 'text-orange-400',
    border: 'border-orange-800',
    bg: 'bg-orange-950/30',
    glow: 'hover:border-orange-600',
  },
  {
    id: 'travel',
    name: 'Travel & Lifestyle',
    emoji: '✈️',
    tagline: 'Experience more, stress less',
    accent: 'text-teal-400',
    border: 'border-teal-800',
    bg: 'bg-teal-950/30',
    glow: 'hover:border-teal-600',
  },
  {
    id: 'legal',
    name: 'Legal & Admin',
    emoji: '⚖️',
    tagline: 'Protect yourself without the lawyer bill',
    accent: 'text-slate-300',
    border: 'border-slate-600',
    bg: 'bg-slate-800/30',
    glow: 'hover:border-slate-400',
  },
  {
    id: 'dev',
    name: 'Developer Tools',
    emoji: '💻',
    tagline: 'Ship faster, break less',
    accent: 'text-cyan-400',
    border: 'border-cyan-800',
    bg: 'bg-cyan-950/30',
    glow: 'hover:border-cyan-600',
  },
]

export const TEMPLATES: AgentTemplate[] = [
  // ── MONEY & INVESTING ──────────────────────────────────────────────────────
  {
    id: 'crypto-portfolio-tracker',
    name: 'Crypto Portfolio Tracker',
    tagline: 'Live prices + P&L for any coin lineup',
    popular: true,
    category: 'money',
    emoji: '₿',
    tools: ['http_request', 'code_execution'],
    description: `An agent that tracks and analyzes a cryptocurrency portfolio in real time. Given a list of coins and quantities (e.g. "0.5 BTC, 10 ETH, 1000 SOL"), use the http_request tool to fetch live prices from the CoinGecko public API at https://api.coingecko.com/api/v3/simple/price with no API key required. Use code_execution to calculate: total portfolio value in USD, each holding's current value and percentage of portfolio, 24-hour price change per coin, and if the user provides purchase prices, calculate unrealized profit or loss in dollars and percentage. Present everything in a clean formatted table. Highlight biggest gainers and losers today. Always remind the user this is not financial advice.`,
  },
  {
    id: 'investment-research',
    name: 'Investment Research Brief',
    tagline: 'Bull case, bear case, key metrics on any asset',
    category: 'money',
    emoji: '📊',
    tools: ['web_search'],
    description: `An agent that researches any stock, ETF, or asset for investment consideration. Given a ticker symbol or company name, search the web for: recent earnings results and forward guidance, analyst price targets and consensus ratings, major catalysts and upcoming events, insider buying or selling activity, competitive positioning and moat, valuation multiples compared to sector peers, and key risks to the investment thesis. Compile findings into a structured investment brief with a bull case, bear case, and a list of key metrics to monitor going forward. Cite sources for all data points. End with a balanced summary — never a direct buy or sell recommendation.`,
  },
  {
    id: 'budget-analyzer',
    name: 'Personal Budget Analyzer',
    tagline: 'Find leaks and build a savings plan instantly',
    category: 'money',
    emoji: '💳',
    tools: ['code_execution'],
    description: `An agent that analyzes personal finances and builds a custom budget plan. Given a list of monthly income sources and expenses (the user can paste them as plain text or a simple list), use code_execution to calculate: total monthly income vs total spending, spending breakdown by category (housing, food, transport, entertainment, subscriptions, savings), savings rate percentage, and projected annual savings at current rate. Identify the top 3 spending categories to cut and calculate the impact of reducing each by 20%. Build a recommended monthly budget following the 50/30/20 rule (needs/wants/savings) adjusted for their actual income. Output a clear table and a plain-English action plan.`,
  },
  {
    id: 'side-hustle-researcher',
    name: 'Side Hustle Opportunity Scout',
    tagline: 'Find income opportunities that match your skills',
    category: 'money',
    emoji: '🚀',
    tools: ['web_search'],
    description: `An agent that researches realistic side hustle and income opportunities based on a person's skills, time availability, and goals. Given the user's skills, available hours per week, and income target, search the web for current platforms, marketplaces, and opportunities that match. For each opportunity found, research: realistic earning potential (hourly or monthly), time to first dollar, startup costs if any, competition level, and growth ceiling. Return a ranked list of the top 5 opportunities with a detailed breakdown of each, links to get started, and a suggested 30-day action plan for the best fit.`,
  },

  // ── SALES & LEAD GEN ──────────────────────────────────────────────────────
  {
    id: 'cold-email-personalizer',
    name: 'Cold Email Personalizer',
    tagline: 'Research a company and write an email they\'ll actually open',
    popular: true,
    category: 'sales',
    emoji: '✉️',
    tools: ['web_search'],
    description: `An agent that researches a company and writes a highly personalized cold email. Given a company name, the user's product or service, and optionally a contact name, search the web for: recent company news and announcements, recent funding or growth signals, job postings that reveal pain points, the contact's LinkedIn presence and background, and any public challenges the company is facing. Use these findings to write a cold email that references specific details, connects the user's solution to a real problem the company has right now, and feels like it came from someone who did their homework — not a template. Output: a subject line, the full email body (under 150 words), and a short note explaining each personalization choice. Include a follow-up email for 5 days later.`,
  },
  {
    id: 'competitor-intelligence',
    name: 'Competitor Intelligence Report',
    tagline: 'Know exactly what you\'re up against',
    popular: true,
    category: 'sales',
    emoji: '🔍',
    tools: ['web_search'],
    description: `An agent that builds a thorough competitor analysis report. Given a competitor's company name or website URL, search the web to gather: their pricing tiers and what each includes, key product features and differentiators, customer reviews and recurring complaints from G2, Trustpilot, Reddit, and App Store, founding story and team size, funding history and investors, estimated revenue or user base, recent news and product launches, and their marketing and messaging strategy. Compile everything into a structured report with sections for: Company Snapshot, Pricing Breakdown, Top 5 Strengths, Top 5 Weaknesses (from real customer complaints), Recent Strategic Moves, and Opportunities to Win Against Them. Be specific and cite every source.`,
  },
  {
    id: 'lead-qualifier',
    name: 'Lead Research & Scorer',
    tagline: 'Know if a lead is worth your time before you call',
    category: 'sales',
    emoji: '🎯',
    tools: ['web_search'],
    description: `An agent that researches and scores a sales prospect before outreach. Given a company name and optionally a contact name, search the web to find: company size and estimated annual revenue, recent funding rounds or financial signals, technologies they use (inferred from job postings and public data), decision maker names and titles, recent news indicating pain points or budget, and fit against an ideal customer profile. Score the lead 1-10 on: budget likelihood, problem fit, decision-maker access, and timing signals. Output a one-page lead brief with the score breakdown, top 3 talking points tailored to their situation, and a personalized opening line for the first call or email.`,
  },
  {
    id: 'sales-call-prep',
    name: 'Sales Call Prep Agent',
    tagline: '5-minute brief before any sales call',
    category: 'sales',
    emoji: '📞',
    tools: ['web_search'],
    description: `An agent that prepares a salesperson for an upcoming sales call. Given the prospect's company name and the meeting context, search the web to quickly gather: what the company does and who their customers are, recent news or changes at the company, the contact's professional background if available, obvious pain points based on their industry and size, and any shared connections or conversation starters. Produce a concise pre-call brief that covers: 3-sentence company overview, 3 smart discovery questions tailored to their situation, likely objections with suggested responses, a clear value prop angle to lead with, and a recommended next step to propose at the end of the call. Keep the whole brief under one page.`,
  },

  // ── CAREER & JOBS ─────────────────────────────────────────────────────────
  {
    id: 'resume-optimizer',
    name: 'Resume Job Matcher',
    tagline: 'Rewrite your resume to beat the ATS and impress the human',
    popular: true,
    category: 'career',
    emoji: '📄',
    tools: ['code_execution'],
    description: `An agent that optimizes a resume for a specific job posting. Given resume text and a job description, analyze and produce: a keyword match score (0-100%) calculated using code by comparing required skills to resume content, the top 10 missing keywords from the job description that should be added, rewritten versions of the 5 weakest bullet points using the STAR method (Situation, Task, Action, Result) and job-relevant language, a tailored 3-sentence professional summary for this specific role, and a list of any red flags a recruiter might notice. Format the output as a clear before/after comparison for each rewritten bullet, plus a prioritized list of changes to make.`,
  },
  {
    id: 'salary-negotiator',
    name: 'Salary Negotiation Coach',
    tagline: 'Know your worth and have the exact words to ask for it',
    popular: true,
    category: 'career',
    emoji: '💵',
    tools: ['web_search'],
    description: `An agent that prepares someone to negotiate a higher salary. Given a job title, company name, location, years of experience, and current or offered salary, search the web for market compensation data from Glassdoor, LinkedIn Salary, Levels.fyi (for tech roles), Bureau of Labor Statistics, and recent industry salary surveys. Determine the market range at the 25th, 50th, and 75th percentiles. Then build a complete negotiation package: a specific counter-offer amount with data-backed justification, a word-for-word negotiation script for the conversation, confident responses to the 5 most common pushback lines ('that's the max budget', 'we can revisit after 90 days', etc.), and an email template for written negotiations. Include one non-salary benefit to negotiate if the base salary is truly fixed.`,
  },
  {
    id: 'interview-prep',
    name: 'Interview Question Coach',
    tagline: 'Generate tailored questions and winning answers',
    category: 'career',
    emoji: '🎤',
    tools: ['web_search'],
    description: `An agent that prepares someone for a job interview. Given the job title, company name, and the user's background, search the web for the company's culture, recent news, products, mission, and common interview styles for this type of role. Generate: the 10 most likely behavioral interview questions for this specific role and company, a strong STAR-method answer framework for each one personalized to the user's background, 5 technical or role-specific questions likely to come up, 5 smart questions the candidate should ask the interviewer, and a 60-second elevator pitch tailored to this company. Also include one thing most candidates get wrong in this type of interview and how to stand out.`,
  },
  {
    id: 'linkedin-optimizer',
    name: 'LinkedIn Profile Optimizer',
    tagline: 'Turn your profile into an inbound lead magnet',
    category: 'career',
    emoji: '🔗',
    tools: ['web_search'],
    description: `An agent that audits and rewrites a LinkedIn profile to attract recruiters, clients, and opportunities. Given the user's current LinkedIn headline, summary, and top 3 job experience descriptions, plus their target goal (new job, clients, speaking, investors), search the web for high-performing profiles and keywords in their industry. Rewrite: a magnetic headline that goes beyond job title, an About section that tells a compelling story and ends with a clear CTA, improved bullet points for each role that emphasize measurable impact, a skills section prioritized for their goal, and 3 post ideas that would build authority in their space. Explain the psychology behind each rewrite.`,
  },

  // ── HEALTH & FITNESS ──────────────────────────────────────────────────────
  {
    id: 'meal-planner',
    name: 'Meal Plan & Grocery List',
    tagline: 'A full week of meals built around your goals',
    popular: true,
    category: 'health',
    emoji: '🥗',
    tools: ['code_execution'],
    description: `An agent that creates a personalized weekly meal plan with a complete grocery list. Given dietary preferences or restrictions, calorie goal, macronutrient targets (protein/carb/fat percentages), number of people eating, and cooking skill level, generate a full 7-day meal plan with breakfast, lunch, dinner, and one snack per day. Use code_execution to calculate total daily macros and calories for each day and verify they hit the targets. Design the plan to reuse overlapping ingredients to minimize waste and cost. Then compile a consolidated grocery list organized by store section (produce, proteins, dairy, grains, pantry staples) with exact quantities and estimated cost per item. Include 3 easy meal prep tips to save time during the week.`,
  },
  {
    id: 'workout-builder',
    name: 'Custom Workout Program',
    tagline: 'A progressive training plan built exactly for you',
    category: 'health',
    emoji: '🏋️',
    tools: ['code_execution'],
    description: `An agent that designs a personalized workout program. Given the user's fitness goals (muscle gain, fat loss, strength, endurance, general health), current fitness level (beginner/intermediate/advanced), available equipment (home/gym/bodyweight only), days per week available to train, session length, and any injuries or limitations, create a complete 8-week progressive training program. For each workout session, list every exercise with sets, reps or time, rest periods, and key form cues. Use code_execution to calculate total weekly volume per muscle group to ensure balance and adequate recovery. Include a built-in progression plan (when and how to increase weight/reps), a warm-up and cool-down routine, and recommendations for sleep and nutrition timing around training.`,
  },
  {
    id: 'supplement-analyzer',
    name: 'Supplement Stack Analyzer',
    tagline: 'Know what actually works and what\'s a waste of money',
    category: 'health',
    emoji: '💊',
    tools: ['web_search'],
    description: `An agent that analyzes a supplement stack and gives evidence-based recommendations. Given a list of supplements the user currently takes or is considering, search the web for peer-reviewed research and clinical evidence on each one: what the research actually says about its effectiveness, the clinically studied dosage vs what's typically in products, proven benefits and who they apply to, known side effects and drug interactions, and whether it's worth the cost based on evidence strength. Rate each supplement: Tier 1 (strong evidence), Tier 2 (promising but mixed), Tier 3 (insufficient evidence or overhyped). Suggest which to keep, cut, and replace. Recommend any evidence-backed supplements the user isn't taking that would benefit their stated goals. Never recommend anything without citing the research.`,
  },
  {
    id: 'sleep-optimizer',
    name: 'Sleep Quality Optimizer',
    tagline: 'Fix your sleep with a personalized protocol',
    category: 'health',
    emoji: '😴',
    tools: ['web_search'],
    description: `An agent that creates a personalized sleep improvement protocol. Given the user's current sleep schedule, sleep complaints (trouble falling asleep, waking up at night, morning grogginess, etc.), lifestyle habits (caffeine intake, exercise timing, screen use, alcohol, stress level), and sleep environment, search the web for the latest sleep science research on each factor they mention. Identify the top 3 root causes of their specific sleep issues. Build a custom 14-day sleep protocol that includes: exact wind-down routine with timings, bedroom environment changes (temperature, light, sound), daytime habits to adjust, evidence-based supplements or techniques if appropriate, and a consistent sleep/wake schedule. Include a simple tracking method to measure improvement.`,
  },

  // ── PRODUCTIVITY ──────────────────────────────────────────────────────────
  {
    id: 'meeting-summarizer',
    name: 'Meeting Notes → Action Items',
    tagline: 'Turn chaotic notes into a clean summary everyone agrees on',
    popular: true,
    category: 'productivity',
    emoji: '📝',
    tools: ['code_execution'],
    description: `An agent that transforms raw meeting notes or transcripts into structured, actionable summaries. Given the meeting notes, transcript, or even a rough bullet dump, extract and organize: every decision made (owner + rationale), every action item with the responsible person and deadline, open questions and blockers that need follow-up, key context or background discussed that attendees should remember, and a suggested agenda for the next meeting. Use code_execution to sort and format action items by owner and due date. Flag any commitments that were made without a clear owner. Output two versions: a full detailed summary and a short 5-bullet executive version ready to paste into Slack or email.`,
  },
  {
    id: 'sop-writer',
    name: 'SOP & Process Doc Writer',
    tagline: 'Turn what\'s in your head into a repeatable process',
    category: 'productivity',
    emoji: '📋',
    tools: ['code_execution'],
    description: `An agent that creates professional Standard Operating Procedures from rough descriptions. Given a process description (can be rough notes, voice transcript, or bullet points), generate a complete SOP document with: a clear purpose statement, scope of who the process applies to, step-by-step instructions numbered and formatted for clarity, decision trees for if/then scenarios, common mistakes and how to avoid them, success criteria (how you know the process was done correctly), roles and responsibilities, and a version history table. Use code_execution to estimate the time required for each step and calculate total process time. Format the output as a professional document ready to add to a company wiki or share with a team.`,
  },
  {
    id: 'email-drafter',
    name: 'Professional Email Drafter',
    tagline: 'The right words for any situation, in seconds',
    category: 'productivity',
    emoji: '📧',
    tools: [],
    description: `An agent that drafts professional emails for any situation. Given the context of an email (who it's to, the relationship, what outcome the user wants, and any relevant background), write 3 versions of the email: a concise version under 100 words, a detailed version with full context, and a diplomatic version for sensitive situations. For each version: write the subject line, opening, body, and a clear call to action. Adapt the tone to the relationship (boss, client, colleague, vendor, stranger). If the email involves a conflict, negotiation, or bad news, include guidance on framing and timing. Flag emails that could have legal or HR implications. Always end with a specific, easy-to-respond-to ask.`,
  },
  {
    id: 'project-planner',
    name: 'Project Planner & Timeline',
    tagline: 'Break any goal into a realistic step-by-step plan',
    category: 'productivity',
    emoji: '🗓️',
    tools: ['code_execution'],
    description: `An agent that turns a project goal into a detailed, realistic execution plan. Given a project description, deadline, team size (or solo), available hours per week, and key constraints, break the project into phases and tasks. Use code_execution to build a timeline that: allocates tasks across available work hours, identifies the critical path (tasks that can't slip), builds in buffer time for the riskiest phases, and calculates whether the deadline is achievable. Output a week-by-week schedule with milestones, a risk register with the top 5 risks and mitigation plans, a list of dependencies to resolve early, and a definition of done for the project. Include a one-page executive summary version.`,
  },

  // ── CONTENT & MARKETING ───────────────────────────────────────────────────
  {
    id: 'youtube-script',
    name: 'YouTube Script Writer',
    tagline: 'Research + full script for any video topic',
    popular: true,
    category: 'content',
    emoji: '🎬',
    tools: ['web_search'],
    description: `An agent that researches and writes complete YouTube video scripts. Given a video topic and target audience, search the web for the most current data, statistics, stories, and talking points on the topic. Then write a complete script including: a powerful hook for the first 30 seconds that creates a pattern interrupt, the main content structured into 3-5 clear sections with smooth transitions between them, specific examples, stories, and data points sourced from the research, a mid-video engagement prompt to drive comments, and a strong outro CTA. Include suggested B-roll footage ideas in brackets, on-screen text suggestions, and estimated speaking time for each section. Optimize the script for 8-12 minute watch time and audience retention.`,
  },
  {
    id: 'content-calendar',
    name: '30-Day Content Calendar',
    tagline: 'A full month of posts that actually build an audience',
    category: 'content',
    emoji: '📅',
    tools: ['web_search'],
    description: `An agent that creates a strategic 30-day social media content calendar. Given a business type, target audience, main product or service, and primary platform (Instagram, LinkedIn, Twitter/X, or TikTok), search the web for trending topics, viral content formats, relevant hashtags, and upcoming events or awareness days in the niche. Generate 30 days of content with for each post: the hook or opening line, the content angle and key message, the format (carousel, short video, image, text post, poll), the best posting time based on platform data, 5 relevant hashtags, and a CTA. Mix the content 70% educational or entertaining and 30% promotional. Include 3 post templates the user can fill in themselves going forward.`,
  },
  {
    id: 'blog-writer',
    name: 'SEO Blog Post Writer',
    tagline: 'Research-backed posts that rank and convert',
    category: 'content',
    emoji: '✍️',
    tools: ['web_search'],
    description: `An agent that researches and writes full SEO-optimized blog posts. Given a target keyword or topic and the intended audience, search the web to understand: what the top-ranking articles cover, what questions people are actually asking (for PAA boxes and long-tail keywords), key statistics and data points to cite, expert perspectives to reference, and content gaps in the existing results. Then write a complete blog post with: an SEO-optimized title and meta description, a compelling intro that hooks the reader in the first 2 sentences, structured H2 and H3 subheadings, detailed sections that answer the user's search intent better than the current top results, a conclusion with a clear CTA, and a list of internal linking suggestions and target secondary keywords to include naturally. Target 1500-2500 words.`,
  },
  {
    id: 'ad-copy',
    name: 'Ad Copy Generator',
    tagline: 'High-converting copy for any platform or format',
    category: 'content',
    emoji: '🎯',
    tools: ['web_search'],
    description: `An agent that writes high-converting advertising copy. Given a product or service, target audience, and advertising platform (Facebook/Instagram, Google, TikTok, LinkedIn), search the web for what messaging is currently working in this niche and what customer pain points and desires are most frequently mentioned in reviews and forums. Write 5 complete ad variations for the specified platform, each with a different angle: pain-focused, desire-focused, social proof-focused, curiosity-focused, and offer-focused. For each ad, provide the headline, primary text, and CTA. Include a brief note on which audience segment each variation is best suited for and what to test first. Format each ad ready to paste directly into the ad platform.`,
  },

  // ── TRAVEL & LIFESTYLE ────────────────────────────────────────────────────
  {
    id: 'travel-planner',
    name: 'Travel Itinerary Planner',
    tagline: 'Day-by-day trip plans with local intel',
    popular: true,
    category: 'travel',
    emoji: '🗺️',
    tools: ['web_search'],
    description: `An agent that builds detailed, personalized travel itineraries. Given a destination, travel dates, budget level (budget/mid-range/luxury), travel style (adventure, relaxation, culture, food, family, romance), and number of travelers, search the web for: top attractions and how to visit them without the tourist traps, hidden gems and local favorites, the best neighborhoods to stay in for the travel style, must-try restaurants across price ranges with real reviews, current travel tips or safety advisories, and insider knowledge about getting around. Build a complete day-by-day itinerary with morning, afternoon, and evening plans, estimated costs per day, travel time between locations, advance booking requirements, and a packing list tailored to the destination and season.`,
  },
  {
    id: 'gift-finder',
    name: 'Personalized Gift Finder',
    tagline: 'Find the perfect gift for anyone in your life',
    category: 'travel',
    emoji: '🎁',
    tools: ['web_search'],
    description: `An agent that finds genuinely thoughtful gift ideas. Given information about the person (age, interests, hobbies, lifestyle, relationship to the gift-giver) and a budget range, search the web for unique, well-reviewed gift options that go beyond generic suggestions. For each gift idea, provide: product name and where to buy it, why it's a great fit for this specific person, the approximate price, a personal note the gift-giver could include with it, and whether it's available for fast delivery. Return 10 options across 3 tiers (budget, mid-range, splurge) covering different categories like experience-based gifts, sentimental, practical luxury, and hobby-specific. Avoid clichés.`,
  },
  {
    id: 'restaurant-scout',
    name: 'Restaurant & Experience Scout',
    tagline: 'Find exactly the right spot for any occasion',
    category: 'travel',
    emoji: '🍽️',
    tools: ['web_search'],
    description: `An agent that finds the perfect restaurant, bar, or experience for any occasion. Given a city or neighborhood, occasion (date night, business dinner, birthday, casual hangout, family), budget per person, cuisine preferences, and any special requirements (dietary restrictions, ambiance, outdoor seating, parking), search the web for top-reviewed options that fit all criteria. For each recommendation, provide: the name and neighborhood, why it's right for this specific occasion, the vibe and price range, must-order dishes based on reviews, whether reservations are needed and how far in advance, and a link to book. Return 5 options ranked by fit, plus 2 backup options if the first choices are full. Include one wildcard pick that's off the beaten path.`,
  },

  // ── LEGAL & ADMIN ─────────────────────────────────────────────────────────
  {
    id: 'contract-explainer',
    name: 'Contract Plain-English Explainer',
    tagline: 'Know what you\'re signing before you sign it',
    popular: true,
    category: 'legal',
    emoji: '📜',
    tools: [],
    description: `An agent that translates complex legal contracts into plain English. Given the full text of a contract, extract and clearly explain: exactly what each party is committing to do, payment terms, amounts, and schedule, termination conditions and how much notice is required, what happens if either party breaks the agreement, intellectual property ownership — especially for any work created, non-compete and non-disclosure clauses and how broadly they apply, auto-renewal clauses and deadlines to cancel, indemnification and liability limitations, and any unusual, vague, or potentially problematic clauses. Rate the overall risk level of the contract (Low / Medium / High) with a brief reason. Highlight the top 3 things the user should negotiate or clarify before signing. Use plain language throughout — no legal jargon.`,
  },
  {
    id: 'terms-summarizer',
    name: 'Terms of Service Decoder',
    tagline: 'Find out what an app is actually doing with your data',
    category: 'legal',
    emoji: '🔐',
    tools: ['web_search'],
    description: `An agent that reads Terms of Service and Privacy Policies and surfaces what actually matters. Given a company name or URL, use web_search to find the latest Terms of Service and Privacy Policy. Extract and explain in plain language: what data is collected and how it's used, whether data is sold or shared with third parties and who, what rights the company claims over user-generated content, how to delete your account and data, what happens to your data if the company is acquired, what the company can change without notice, how to opt out of data collection or targeted advertising, and any clauses that are especially user-unfriendly. Give the policy an overall privacy score (1-10, 10 being most private) with a brief summary of the main concerns.`,
  },
  {
    id: 'business-name-finder',
    name: 'Business Name & Domain Finder',
    tagline: 'A brandable name with an available domain',
    category: 'legal',
    emoji: '🏢',
    tools: ['web_search', 'http_request'],
    description: `An agent that generates and validates business names. Given a business description, target industry, and target audience, brainstorm 20 creative business name options that are memorable, easy to spell, and meaningfully connected to what the business does. For each name, use http_request to check domain availability via the Whois XML API or similar public domain lookup service. Filter and rank the names by memorability, domain availability, brandability, and how well they convey the value proposition. Present the top 7 with: available domain extensions (.com, .co, .io, .app), a brief note on the name's meaning and brand potential, and potential trademark conflicts to research. Include a recommended name with a rationale.`,
  },

  // ── DEVELOPER TOOLS ───────────────────────────────────────────────────────
  {
    id: 'bug-explainer',
    name: 'Bug Report Explainer',
    tagline: 'Paste an error, get the fix',
    popular: true,
    category: 'dev',
    emoji: '🐛',
    tools: ['web_search', 'code_execution'],
    description: `An agent that analyzes software errors and explains how to fix them. Given a stack trace, error message, or bug description, identify: the root cause of the error in plain English, the most likely file or function where the issue originates, what triggered the error (common scenarios that cause this), and the fastest path to a fix. Use code_execution to test simple logic and verify the solution if applicable. Search the web for known issues or community solutions if the error involves a library or framework. Provide: a step-by-step debugging checklist, the corrected code snippet with comments explaining each change, a way to write a test to catch this bug in the future, and how to prevent this class of error going forward.`,
  },
  {
    id: 'code-reviewer',
    name: 'Code Reviewer',
    tagline: 'Catch bugs, security holes, and bad patterns before they ship',
    category: 'dev',
    emoji: '🔎',
    tools: ['code_execution'],
    description: `An agent that performs thorough code reviews. Given a code snippet or function in any language, analyze it for: logic errors and edge cases that could cause bugs in production, security vulnerabilities (SQL injection, XSS, improper input validation, exposed secrets, etc.), performance issues (inefficient loops, unnecessary re-renders, missing indexes, N+1 queries), code style and readability problems, violation of common best practices for the language or framework, and missing error handling. Rate the overall code quality (1-10) and categorize issues by severity: Critical (fix before shipping), Major (fix soon), Minor (nice to have). Provide the corrected version of the code with inline comments explaining each change. Use code_execution to test or validate logic where possible.`,
  },
  {
    id: 'api-documenter',
    name: 'API Integration Guide Writer',
    tagline: 'Fetch any public API docs and generate ready-to-use code',
    category: 'dev',
    emoji: '🔌',
    tools: ['http_request', 'code_execution'],
    description: `An agent that writes complete integration guides for any API. Given an API name or documentation URL, use http_request to fetch the API documentation or relevant pages. Then generate: a plain-English overview of what the API does and what use cases it's good for, a complete authentication setup guide with example code, the 5 most useful endpoints with request format, parameters, and example responses, working code snippets in the user's preferred language (JavaScript, Python, or cURL) for each endpoint, common error codes and what they mean, rate limit information and how to handle it gracefully, and a complete starter script that authenticates and makes a first successful API call. Use code_execution to validate any logic in the code examples.`,
  },
  {
    id: 'regex-builder',
    name: 'Regex Builder & Tester',
    tagline: 'Describe what you need to match, get the pattern',
    category: 'dev',
    emoji: '⚙️',
    tools: ['code_execution'],
    description: `An agent that builds and tests regular expressions from plain-English descriptions. Given a description of what the user wants to match (e.g. "US phone numbers in any format", "email addresses", "dates in MM/DD/YYYY format", "URLs with or without http") and optionally some example strings to match and not match, use code_execution to: write the regex pattern, test it against the provided examples, identify edge cases it might miss, and refine it until it handles all cases correctly. Output: the final regex pattern, a breakdown of what each part of the pattern does, a test suite showing it passing on matching examples and failing on non-matching examples, and versions for JavaScript, Python, and any other requested language with language-specific syntax notes.`,
  },
]

export function getTemplateById(id: string): AgentTemplate | undefined {
  return TEMPLATES.find((t) => t.id === id)
}

export function getTemplatesByCategory(categoryId: string): AgentTemplate[] {
  return TEMPLATES.filter((t) => t.category === categoryId)
}

export function getPopularTemplates(): AgentTemplate[] {
  return TEMPLATES.filter((t) => t.popular)
}
