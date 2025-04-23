# GatherEase - Event Management Platform

GatherEase is a modern event management platform built with Next.js, MongoDB, and Clerk authentication. It allows users to create, manage, and attend events with a clean, intuitive interface.

## Features

- **Event Management**: Create, edit, and delete events
- **User Authentication**: Secure authentication with Clerk
- **Admin Dashboard**: Manage events and attendees
- **Responsive Design**: Works on desktop and mobile devices

## Tech Stack

- [Next.js](https://nextjs.org) - React framework for server-rendered applications
- [MongoDB](https://mongodb.com) - NoSQL database for storing event and user data
- [Clerk](https://clerk.dev) - Authentication and user management
- [Tailwind CSS](https://tailwindcss.com) - Utility-first CSS framework
- [tRPC](https://trpc.io) - End-to-end typesafe APIs
- [shadcn/ui](https://ui.shadcn.com/) - Reusable UI components

## Getting Started

### Prerequisites

- Node.js 18.x or later
- pnpm package manager
- MongoDB database (local or Atlas)

### Installation

1. Clone the repository
   ```bash
   git clone https://github.com/yourusername/gatherease.git
   cd gatherease
   ```

2. Install dependencies
   ```bash
   pnpm install
   ```

3. Set up environment variables
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. Start the development server
   ```bash
   pnpm dev
   ```

## Deployment

For detailed deployment instructions, see [deployment.md](deployment.md).

### Quick Deployment Options

#### Vercel

Deploy directly to Vercel with a few clicks:

```bash
pnpm build
vercel --prod
```

#### Docker

Build and run using Docker:

```bash
# Using Docker Compose
docker-compose up -d

# Or build and run manually
docker build -t gatherease .
docker run -p 3000:3000 --env-file .env gatherease
```

## License

This project is licensed under the MIT License - see the LICENSE file for details.
