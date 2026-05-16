# Project Dependencies

This document lists all dependencies required for the Review Responder project.

## Installation

To install all dependencies, run:
```bash
npm install
```

## Production Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| `@google/generative-ai` | ^0.24.1 | Google Gemini AI API for sentiment analysis and topic extraction |
| `@supabase/ssr` | ^0.10.2 | Supabase Server-Side Rendering utilities for authentication |
| `@supabase/supabase-js` | ^2.105.3 | Supabase JavaScript client for database operations |
| `apify-client` | ^2.23.3 | Apify client for Google Maps reviews scraping |
| `docx` | ^9.6.1 | Word document (.docx) generation for report exports |
| `html2pdf.js` | ^0.14.0 | HTML to PDF conversion for report exports |
| `next` | ^16.2.5 | Next.js framework for React SSR and API routes |
| `react` | ^19.0.0 | React library for UI components |
| `react-dom` | ^19.0.0 | React DOM rendering |
| `resend` | ^6.12.3 | Email service for sending alerts and notifications |

## Development Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| `@tailwindcss/oxide-win32-x64-msvc` | ^4.3.0 | Tailwind CSS compiler for Windows |
| `@tailwindcss/postcss` | ^4 | PostCSS plugin for Tailwind CSS |
| `@types/node` | ^20 | TypeScript types for Node.js |
| `@types/react` | ^19 | TypeScript types for React |
| `@types/react-dom` | ^19 | TypeScript types for React DOM |
| `eslint` | ^9 | JavaScript linter |
| `eslint-config-next` | ^16.2.5 | ESLint configuration for Next.js |
| `tailwindcss` | ^4 | Utility-first CSS framework |
| `typescript` | ^5 | TypeScript compiler |

## Environment Variables Required

Create a `.env.local` file with the following variables:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Google APIs
GOOGLE_PLACES_API_KEY=your_google_places_api_key
GEMINI_API_KEY=your_gemini_api_key

# Apify
APIFY_API_TOKEN=your_apify_api_token

# Email Service
RESEND_API_KEY=your_resend_api_key

# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
CRON_SECRET=your_random_secret_here
```

## System Requirements

- **Node.js**: v18.0.0 or higher
- **npm**: v9.0.0 or higher (or yarn/pnpm equivalent)
- **Operating System**: Windows, macOS, or Linux

## Installation Steps

1. Clone the repository
2. Navigate to the project directory
3. Install dependencies:
   ```bash
   npm install
   ```
4. Create `.env.local` file with required environment variables
5. Run the development server:
   ```bash
   npm run dev
   ```
6. Open http://localhost:3000 in your browser

## Build for Production

```bash
npm run build
npm start
```

## Linting

```bash
npm run lint
```

## Notes

- This is a **Node.js/JavaScript project**, not Python, so use `npm install` instead of `pip install`
- All versions use caret (^) notation, allowing minor and patch updates
- The project uses TypeScript for type safety
- Tailwind CSS v4 is used for styling
- Next.js 16 with React 19 provides the latest features
