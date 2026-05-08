# ReviewResponder - Requirements & Setup

## System Requirements

- **Node.js**: 18.0.0 or higher
- **npm**: 9.0.0 or higher (or yarn 3.0+)
- **Git**: 2.30.0 or higher
- **OS**: Windows, macOS, or Linux

---

## External Services Required

### 1. Supabase (Database & Auth)
- **URL**: https://supabase.com
- **Free Tier**: Yes (perfect for development)
- **What you need**:
  - Supabase Project URL
  - Anon Key (public)
  - Service Role Key (secret)

### 2. Google Cloud (APIs)
- **URL**: https://console.cloud.google.com
- **APIs needed**:
  - Google Generative AI (Gemini)
  - Google Places API
- **Free Tier**: Yes (limited)
- **What you need**:
  - GEMINI_API_KEY
  - GOOGLE_PLACES_API_KEY

### 3. Resend (Email Service)
- **URL**: https://resend.com
- **Free Tier**: Yes (3,000 emails/month)
- **What you need**:
  - RESEND_API_KEY

---

## NPM Dependencies

### Production Dependencies
```
@google/generative-ai@^0.24.1    # Google Gemini AI
@supabase/ssr@^0.10.2             # Supabase SSR client
@supabase/supabase-js@^2.105.3    # Supabase JS client
next@^16.2.5                      # Next.js framework
react@^19.0.0                     # React library
react-dom@^19.0.0                 # React DOM
```

### Development Dependencies
```
@tailwindcss/postcss@^4           # Tailwind CSS
@types/node@^20                   # Node.js types
@types/react@^19                  # React types
@types/react-dom@^19              # React DOM types
eslint@^9                         # Code linting
eslint-config-next@^16.2.5        # Next.js ESLint config
tailwindcss@^4                    # Tailwind CSS
typescript@^5                     # TypeScript
```

---

## Installation Steps

### 1. Clone Repository
```bash
git clone https://github.com/kavishah02/ReviewResponder.git
cd ReviewResponder
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Create Environment File
Create `.env.local` in project root:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

# Google APIs
GEMINI_API_KEY=your_gemini_api_key_here
GOOGLE_PLACES_API_KEY=your_google_places_api_key_here

# Email Service
RESEND_API_KEY=your_resend_api_key_here
```

### 4. Set Up Supabase Database
1. Go to Supabase dashboard
2. Create new project
3. Run SQL schema (see SUPABASE_SCHEMA.sql)
4. Copy URL and keys to `.env.local`

### 5. Start Development Server
```bash
npm run dev
```

Open http://localhost:3000

---

## Available Scripts

```bash
npm run dev      # Start development server (port 3000)
npm run build    # Build for production
npm start        # Start production server
npm run lint     # Run ESLint
```

---

## Database Schema

### Tables
- `users` — Supabase Auth users
- `businesses` — Business locations
- `reviews` — Customer reviews
- `collaborators` — Team members (planned)

### Key Fields
```sql
-- businesses
id, user_id, name, business_type, created_at

-- reviews
id, business_id, platform, external_id, author_name, 
rating, review_text, review_date, status, 
draft_response, published_response, created_at
```

---

## API Keys Setup

### Google Gemini API
1. Go to https://console.cloud.google.com
2. Create new project
3. Enable "Google Generative AI API"
4. Create API key
5. Add to `.env.local` as `GEMINI_API_KEY`

### Google Places API
1. Same Google Cloud project
2. Enable "Places API"
3. Create API key (or use same key)
4. Add to `.env.local` as `GOOGLE_PLACES_API_KEY`

### Supabase
1. Go to https://supabase.com
2. Create new project
3. Go to Settings → API
4. Copy Project URL and keys
5. Add to `.env.local`

### Resend
1. Go to https://resend.com
2. Sign up
3. Go to API Keys
4. Create new key
5. Add to `.env.local` as `RESEND_API_KEY`

---

## Troubleshooting

### "Module not found"
```bash
npm install
```

### "API key not configured"
- Check `.env.local` exists
- Verify all keys are correct
- Restart dev server: `npm run dev`

### "Supabase connection failed"
- Check SUPABASE_URL and keys
- Verify project is active in Supabase dashboard
- Check internet connection

### "Port 3000 already in use"
```bash
npm run dev -- -p 3001
```

---

## Performance Notes

- **Build time**: ~30-60 seconds (Turbopack)
- **Dev server startup**: ~5-10 seconds
- **API response time**: <500ms (with Gemini)
- **Database queries**: <100ms (Supabase)

---

## Security Checklist

- [ ] `.env.local` is in `.gitignore`
- [ ] Never commit API keys
- [ ] Use environment variables for secrets
- [ ] Enable Supabase RLS policies
- [ ] Verify API endpoints check user auth
- [ ] Use HTTPS in production
- [ ] Rotate API keys regularly

---

## Deployment Checklist

- [ ] All environment variables set
- [ ] Database migrations run
- [ ] Build succeeds: `npm run build`
- [ ] No console errors
- [ ] Tests pass (if applicable)
- [ ] `.env.local` NOT committed
- [ ] `.gitignore` includes sensitive files

---

## Support

- 📖 Docs: See README.md
- 🐛 Issues: GitHub Issues
- 💬 Help: `/help` page in app
- 📧 Email: support@reviewresponder.com

---

## Version History

- **v0.1.0** (Current) — Initial release with core features
  - Multi-location management
  - AI-powered responses
  - Analytics dashboard
  - Google Places API integration
  - Contact form

---

## License

MIT License
