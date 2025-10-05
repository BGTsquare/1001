# 📚 Astewai Digital Bookstore

> **Production-Ready Digital Bookstore for Ethiopian Market**

A modern, full-featured digital bookstore built with Next.js, Supabase, and Tailwind CSS. Features manual payment confirmation system optimized for Ethiopian banking, comprehensive admin panel, and PWA support.

## 🚀 Quick Start

**For Fresh Setup**: Use the comprehensive migration approach for production-ready deployment:

1. **Follow the Setup Guide**: See `FRESH_SUPABASE_SETUP_GUIDE.md` for complete instructions
2. **Apply Database Migration**: Use `FRESH_SUPABASE_MIGRATION.sql` for fresh Supabase project
3. **Configure Environment**: Update `.env.local` with your Supabase credentials
4. **Deploy**: Ready for production deployment on Vercel

## 📁 Project Structure

```
astewai-bookstore/
├── FRESH_SUPABASE_MIGRATION.sql    # Complete database migration
├── FRESH_SUPABASE_SETUP_GUIDE.md   # Production setup guide
├── PROJECT_CLEANUP_SUMMARY.md      # Cleanup documentation
├── .env.local                       # Environment configuration
├── src/                            # Application source code
├── scripts/                        # Utility scripts
│   ├── diagnose-production-issues.js
│   ├── test-rpc-functions.js
│   └── make-admin.js
└── supabase/                       # Supabase configuration
```

## Features

- 📚 Browse and discover digital books
- 📦 Curated book bundles at discounted prices
- 📖 Personal library with reading progress tracking
- ✍️ Blog system for book-related content
- 👤 User authentication and profile management
- 🛡️ Admin dashboard for content management
- 💳 Manual payment processing with admin approval
- 📱 Responsive design for all devices

## Tech Stack

- **Frontend**: Next.js 14, TypeScript, Tailwind CSS, Shadcn/ui
- **Backend**: Supabase (Auth, Database, Storage)
- **Database**: PostgreSQL with Row Level Security
- **Payments**: Manual payment system with admin approval
- **Package Manager**: pnpm

## Getting Started

### Prerequisites

- Node.js 18+ 
- pnpm
- Supabase account (for backend services)

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   pnpm install
   ```

3. Set up environment variables (see next tasks for Supabase configuration)

4. Run the development server:
   ```bash
   pnpm dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser

## Available Scripts

- `pnpm dev` - Start development server with Turbopack
- `pnpm build` - Build for production
- `pnpm start` - Start production server
- `pnpm lint` - Run ESLint
- `pnpm lint:fix` - Fix ESLint issues automatically
- `pnpm format` - Format code with Prettier
- `pnpm format:check` - Check code formatting
- `pnpm type-check` - Run TypeScript type checking

## Project Structure

```
src/
├── app/                 # Next.js App Router pages
│   ├── auth/           # Authentication pages
│   ├── books/          # Book browsing pages
│   ├── bundles/        # Bundle pages
│   ├── library/        # User library pages
│   ├── blog/           # Blog pages
│   ├── admin/          # Admin dashboard pages
│   └── api/            # API routes
├── components/         # React components
│   ├── ui/             # Shadcn/ui components
│   ├── auth/           # Authentication components
│   ├── books/          # Book-related components
│   ├── bundles/        # Bundle components
│   ├── library/        # Library components
│   ├── blog/           # Blog components
│   ├── admin/          # Admin components
│   └── layout/         # Layout components
├── lib/                # Utility libraries
├── types/              # TypeScript type definitions
├── utils/              # Utility functions
└── hooks/              # Custom React hooks
```

## Development Status

This project is currently in development. The foundation has been set up with:

- ✅ Next.js 14 with TypeScript
- ✅ Tailwind CSS and Shadcn/ui components
- ✅ ESLint and Prettier configuration
- ✅ Basic project structure and routing
- ✅ Core TypeScript interfaces
- ✅ Basic layout components

Next steps:
- [ ] Supabase integration and authentication
- [ ] Database schema implementation
- [ ] Core feature development

## Contributing

This project follows the spec-driven development methodology. See the `.kiro/specs/astewai-digital-bookstore/` directory for detailed requirements, design, and implementation tasks.

## License

This project is private and proprietary.