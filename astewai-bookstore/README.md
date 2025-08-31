# Astewai Digital Bookstore

A modern full-stack digital bookstore platform built with Next.js 14, TypeScript, and Supabase.

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