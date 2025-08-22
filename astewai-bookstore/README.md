# Astewai Digital Bookstore

A modern full-stack digital bookstore platform built with Next.js 14, TypeScript, and Supabase.

## Features

- 📚 Browse and discover digital books
- 📦 Curated book bundles at discounted prices
- 📖 Personal library with reading progress tracking
- ✍️ Blog system for book-related content
<!--
   Astewai Bookstore — Polished README
   Created by automated assistant. Edit the Vercel link below to point to your live site.
-->

# Astewai Digital Bookstore 📚✨

![Build Status](https://img.shields.io/badge/build-dev--local-yellow)
![License](https://img.shields.io/badge/license-proprietary-gray)
![Tech](https://img.shields.io/badge/tech-Next.js%20%7C%20TypeScript%20%7C%20Supabase-blue)

Live demo: � **Vercel** — [Your Live Site (replace me)](https://vercel.com/) 🚀

Welcome to Astewai — a delightful modern digital bookstore built with Next.js, TypeScript, and Supabase. This README is crafted to be friendly, fun, and useful — with quick setup instructions and highlights so contributors and reviewers can jump in fast.

---

## Quick Links

- Website: https://vercel.com/  (replace with your Vercel deployment URL)
- Docs: `README.md` (this file)
- Issues: GitHub Issues

---

## What is Astewai? 🎯

Astewai is a full-stack prototype for a digital bookstore. It includes browsing, bundles, a personal library, user profiles, and admin tooling. The goal is to be a polished starter for digital content platforms with strong developer ergonomics.

## Highlights ✨

- Beautiful UI with Tailwind CSS and shadcn/ui components
- Fast developer DX using Next.js app router and TypeScript
- Supabase for Auth, Database, and Storage
- Stripe-ready payments wiring (stubbed/configured)
- Robust test scaffolding with Vitest

---

## Features 🚀

- Browse books, bundles, and curated collections
- Personal library with progress tracking
- Admin dashboard to manage content and users
- Email templates (Resend) and analytics integration
- PWA-friendly UI and offline page

---

## Tech Stack 🧩

- Next.js 15.x (App Router)
- React 19
- TypeScript
- Tailwind CSS
- Supabase (Auth, Postgres, Storage)
- Stripe (payments)
- Vitest (tests)
- pnpm (package manager)

---

## Quick Start — Local Development 💻

1. Clone the repo

```powershell
git clone https://github.com/BGTsquare/astewai-bookstore.git
cd astewai-bookstore
```

2. Install dependencies

```powershell
pnpm install
```

3. Create a `.env.local` and add your Supabase + Stripe keys (example):

```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
STRIPE_SECRET_KEY=sk_test_xxx
```

4. Run the dev server

```powershell
pnpm dev
```

5. Open http://localhost:3000

Notes:
- If you run into `next/image` domain errors, add your Supabase storage host to `next.config.ts` under `images.remotePatterns`.

---

## Environment & Deployment 🌐

- The project includes `vercel.json` for Vercel deployments. Connect this repo to Vercel and set environment variables in the Vercel dashboard.
- Add the Supabase project URL and keys to Vercel environment variables for production.

---

## Contributing 🤝

- Fork the repo, create a feature branch, and open a PR.
- Follow existing code style — TypeScript + Tailwind.
- Run tests with `pnpm test` and aim for clean linting and types.

---

## Project Structure 🗂️

Simplified view:

```
src/
├─ app/         # Next.js app router pages
├─ components/  # Reusable UI components
├─ lib/         # Utilities & services
├─ hooks/       # Custom hooks
└─ styles/      # Tailwind & global styles
```

---

## Development Scripts 🛠️

- `pnpm dev` — Start dev server
- `pnpm build` — Build production
- `pnpm start` — Start production server
- `pnpm lint` / `pnpm lint:fix` — Linting
- `pnpm test` — Run tests

---

## Notes & Tips 💡

- Local dev may require adding image hostnames to `next.config.ts` (see `images.remotePatterns`).
- If uploads to Supabase fail with JWT header errors, verify your keys and tokens in `.env.local`.

---

## License

This repository is currently private/proprietary. Contact the maintainers for access.

---

Made with ❤️ and a little automation. If you'd like, I can also open a PR with CI badges, or update the Vercel link to your actual deployment URL.
