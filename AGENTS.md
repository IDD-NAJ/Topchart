## Project Summary
Topchart is a high-performance web platform for purchasing airtime and data bundles instantly across all major networks in Ghana (MTN, Vodafone, AirtelTigo). It focuses on reliability, security, and a premium "infrastructure-first" user experience.

## Tech Stack
- **Framework**: Next.js 15 (App Router)
- **Styling**: Tailwind CSS 4, Lucide React icons
- **Database**: Supabase / Neon (PostgreSQL)
- **Payments**: Paystack (Ghana)
- **Chat**: Tawk.to

## Architecture
- **App Router**: Standard Next.js structure with `src/app`.
- **UI Components**: Shadcn-inspired components in `src/components/ui`.
- **Layouts**: Shared `Header` and `Footer` components.
- **API**: Next.js Route Handlers for payments, auth, and user management.

## User Preferences
- **Aesthetic**: Modern, clean, "Contiant-inspired" infrastructure look.
- **Colors**: Deep primary blue, high-contrast typography, subtle borders, and alpha-transparent gradients.
- **Motion**: Subtle staggered reveals and smooth transitions.

## Project Guidelines
- **No Comments**: Avoid adding code comments unless explicitly requested.
- **Minimalist Header**: Keep the header clean with prominent CTAs.
- **Trust Elements**: Include trust badges, compliance info, and supported networks in the footer and hero.
- **Selection Style**: Use custom selection colors (`selection:bg-primary/10`).

## Common Patterns
- **Hero Sections**: Use radial gradients with `--primary-rgb` for depth.
- **Feature Cards**: Border-based cards with subtle shadows and icon containers.
- **Transfers/Top-ups**: Focus on speed and "instant" feedback.
