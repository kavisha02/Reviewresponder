# ReviewResponder

AI-powered review management SaaS for businesses. Monitor, analyze, and respond to Google reviews with AI-generated responses.

## Features

### 🎯 Core Features
- **Multi-Location Management** — Manage multiple business locations from one account
- **AI-Powered Responses** — Generate professional review responses using Google Gemini
- **Real-Time Analytics** — Dashboard with sentiment analysis, rating trends, and response rates
- **Review Sorting** — Sort by urgency, date, author name, or location
- **Google Places API Integration** — Sync real reviews from Google Maps (up to 5 per sync)
- **Contact Form** — Support requests via email (Resend integration)

### 📊 Analytics
- Rating distribution (1-5 stars)
- Review status breakdown (new, draft, published, ignored)
- Monthly review volume (6-month history)
- Sentiment analysis (positive, neutral, negative)
- Language detection (English, Hindi, Hinglish)
- Response rate tracking

### 🔐 Security & Auth
- Supabase Authentication (email/password)
- Row-Level Security (RLS) on database
- Secure API endpoints with user verification
- Environment variables for sensitive keys

### 💰 Pricing Tiers
- **Starter (Free)** — 1 location, 20 reviews/month, AI drafts
- **Pro ($29/month)** — 1 location, unlimited reviews, auto-publish, email alerts
- **Agency ($79/month)** — 10 locations, unlimited reviews, client reporting, priority support

---

## Tech Stack

### Frontend
- **Next.js 16.2.5** — React framework with App Router
- **TypeScript** — Type-safe code
- **Tailwind CSS v4** — Utility-first styling
- **Turbopack** — Fast bundler

### Backend
- **Next.js API Routes** — Serverless functions
- **Supabase** — PostgreSQL database + Auth
- **Google Generative AI** — Gemini 1.5 Flash for AI responses
- **Google Places API** — Real review syncing
- **Resend** — Email service for contact forms

### Database
- **PostgreSQL** (via Supabase)
- **Row-Level Security (RLS)** for data isolation
- Tables: `users`, `businesses`, `reviews`, `collaborators` (planned)

---

## Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn
- Git
- Supabase account
- Google Cloud account (for APIs)
- Resend account (for emails)

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/kavishah02/ReviewResponder.git
cd ReviewResponder
```

2. **Install dependencies**
```bash
npm install
```

3. **Set up environment variables**

Create `.env.local`:
```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Google APIs
GEMINI_API_KEY=your_gemini_key
GOOGLE_PLACES_API_KEY=your_google_places_key

# Email
RESEND_API_KEY=your_resend_key
```

See `.env.example` for all required variables.

4. **Set up Supabase database**

Run the SQL schema from `SUPABASE_SCHEMA.sql` in your Supabase dashboard.

5. **Start development server**
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## Project Structure

```
ReviewResponder/
├── app/
│   ├── api/                    # API routes
│   │   ├── business/create/    # Create business
│   │   ├── reviews/            # Review operations
│   │   ├── contact/            # Contact form
│   │   └── ...
│   ├── auth/                   # Auth pages (login, signup, callback)
│   ├── dashboard/              # Main dashboard
│   │   ├── page.tsx            # Reviews dashboard
│   │   ├── analytics/          # Analytics page
│   │   └── setup/              # Business setup
│   ├── home/                   # Home hub page
│   ├── faq/                    # FAQ page
│   ├── help/                   # Help & support page
│   ├── page.tsx                # Landing page
│   ├── layout.tsx              # Root layout
│   └── globals.css             # Global styles
├── components/                 # Reusable components
│   ├── ReviewCard.tsx          # Review card with AI responses
│   ├── LocationSwitcher.tsx    # Multi-location dropdown
│   ├── ReviewSortDropdown.tsx  # Sort reviews
│   ├── DashboardClient.tsx     # Dashboard client logic
│   ├── SyncReviewsButton.tsx   # Google Places sync
│   ├── ContactForm.tsx         # Support contact form
│   └── ...
├── lib/
│   ├── supabase/               # Supabase client setup
│   ├── types.ts                # TypeScript interfaces
│   └── mock-reviews.ts         # Mock data for testing
├── middleware.ts               # Auth middleware
├── .env.local                  # Environment variables (gitignored)
├── .env.example                # Environment template
├── .gitignore                  # Git ignore rules
├── package.json                # Dependencies
├── tsconfig.json               # TypeScript config
└── README.md                   # This file
```

---

## Key Pages

| Page | Route | Description |
|---|---|---|
| Landing | `/` | Public landing page with pricing |
| Sign Up | `/auth/signup` | User registration |
| Login | `/auth/login` | User login |
| Home Hub | `/home` | Post-login dashboard hub |
| Reviews | `/dashboard` | Main review management |
| Analytics | `/dashboard/analytics` | Full analytics report |
| Setup | `/dashboard/setup` | Add new business location |
| FAQ | `/faq` | Frequently asked questions |
| Help | `/help` | Help & support with contact form |

---

## API Endpoints

### Business
- `POST /api/business/create` — Create new business location

### Reviews
- `POST /api/reviews/generate-response` — Generate AI response
- `POST /api/reviews/publish-response` — Publish response
- `POST /api/reviews/seed-more` — Re-seed mock reviews
- `POST /api/reviews/sync-from-google-places` — Sync real reviews from Google

### Support
- `POST /api/contact` — Submit contact form

---

## Features in Development

- [ ] Team collaboration (invite team members)
- [ ] Auto-publish positive reviews
- [ ] WhatsApp alerts for negative reviews
- [ ] Google Business Profile API posting
- [ ] Cron jobs for auto-monitoring
- [ ] Stripe + Razorpay payments
- [ ] Advanced analytics dashboard
- [ ] Review templates
- [ ] Multi-language support

---

## Testing

### Mock Data
The app comes with 28 diverse mock reviews for testing:
- All ratings (1-5 stars)
- Multiple languages (English, Hindi, Hinglish)
- Different tones (positive, negative, sarcastic, etc.)
- Spread across 6 months

Seed mock reviews:
```bash
POST /api/reviews/seed-more
Body: { "businessId": "your_id" }
```

### Real Reviews
Sync real Google Maps reviews:
1. Get your Google Place ID from Google Maps
2. Click "Sync Real Reviews" on dashboard
3. Enter Place ID
4. Up to 5 reviews sync instantly

---

## Environment Variables

See `.env.example` for complete list. Required:

```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
GEMINI_API_KEY
GOOGLE_PLACES_API_KEY
RESEND_API_KEY
```

---

## Deployment

### Vercel (Recommended)
```bash
npm install -g vercel
vercel
```

### Docker
```bash
docker build -t reviewresponder .
docker run -p 3000:3000 reviewresponder
```

---

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## License

MIT License — see LICENSE file for details

---

## Support

- 📧 Email: support@reviewresponder.com
- 💬 Contact form: `/help`
- 📖 FAQ: `/faq`
- 🐛 Issues: GitHub Issues

---

## Roadmap

**Phase 1 (Current)** — Core review management + AI responses  
**Phase 2** — Team collaboration + advanced analytics  
**Phase 3** — Google Business Profile API integration  
**Phase 4** — Payments (Stripe + Razorpay)  
**Phase 5** — Mobile app + advanced features  

---

## Author

Built by Kavi Shah

---

## Acknowledgments

- Google Generative AI (Gemini)
- Supabase
- Next.js
- Tailwind CSS
- Resend
