import AgentPage from '@/components/AgentPage'
import { Mail } from 'lucide-react'

export default function OfferWriterPage() {
  return (
    <AgentPage
      title="Offer Letter Writer"
      subtitle="Direct mail letters to owners"
      placeholder="Owner: B&W Capital LLC, 1201 W Peachtree St NW Atlanta GA. Property: 623 Montevista St SW Atlanta 30310. Offering $210,000 cash, quick close."
      apiRoute="/api/propiq/offer-writer"
      icon={Mail}
      iconColor="text-violet-400"
      examples={[
        'Owner: B&W Capital LLC, 1201 W Peachtree St NW STE 2300, Atlanta GA 30309. Property: 623 Montevista St SW, Atlanta GA 30310. Absentee owner, 131 days on market, asking $249,900. I want to offer $210,000 cash.',
        'Owner: John Smith, 4521 Oak Ave, Dallas TX 75201. Property: 1847 Elm St, Dallas TX 75208. Owner-occupied, listed 90 days, asking $185,000. Offer $160,000 cash, 2-week close.',
        'Owner: Hernandez Family Trust, PO Box 1234, Phoenix AZ 85001. Property: 7123 W Hazelwood St, Phoenix AZ 85033. LLC owner, 141 days on market. Write a general interest letter without a specific price.',
      ]}
    />
  )
}
