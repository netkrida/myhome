# MyHome - Multi-Tenant Property Management System

A comprehensive property management system built with Next.js, TypeScript, Prisma, and PostgreSQL.

## 🚀 Quick Start

### Docker Database Setup

```bash
# 1. Edit .env.production
DB_INIT_MODE="reset"  # or "init" or "migrate"

# 2. Deploy
docker-compose up -d

# 3. Check logs
docker-compose logs -f app
```

📖 **Full Guide**: [DOCKER_DATABASE_SETUP.md](DOCKER_DATABASE_SETUP.md)

---

## 📚 Tech Stack

This is a [T3 Stack](https://create.t3.gg/) project bootstrapped with `create-t3-app`.

## What's next? How do I make an app with this?

We try to keep this project as simple as possible, so you can start with just the scaffolding we set up for you, and add additional things later when they become necessary.

If you are not familiar with the different technologies used in this project, please refer to the respective docs. If you still are in the wind, please join our [Discord](https://t3.gg/discord) and ask for help.

- [Next.js](https://nextjs.org)
- [NextAuth.js](https://next-auth.js.org)
- [Prisma](https://prisma.io)
- [Drizzle](https://orm.drizzle.team)
- [Tailwind CSS](https://tailwindcss.com)
- [tRPC](https://trpc.io)

## Learn More

To learn more about the [T3 Stack](https://create.t3.gg/), take a look at the following resources:

- [Documentation](https://create.t3.gg/)
- [Learn the T3 Stack](https://create.t3.gg/en/faq#what-learning-resources-are-currently-available) — Check out these awesome tutorials

You can check out the [create-t3-app GitHub repository](https://github.com/t3-oss/create-t3-app) — your feedback and contributions are welcome!

## 🐳 Docker Deployment

### Database Initialization Modes

| Mode | Use Case | Command |
|------|----------|---------|
| `migrate` | Production (default) | Only run migrations |
| `reset` | Testing (⚠️ deletes data) | Reset DB + seed |
| `init` | First deployment | Migrate + seed |

### Quick Commands

```bash
# Production deployment
DB_INIT_MODE="migrate" docker-compose up -d

# Reset database with new seed
DB_INIT_MODE="reset" docker-compose down -v && docker-compose up -d

# First deployment with seed
DB_INIT_MODE="init" docker-compose up -d
```

### Documentation

- 📖 [Docker Database Setup Guide](DOCKER_DATABASE_SETUP.md)
- 📖 [Full Documentation](docs/DOCKER_DATABASE_RESET.md)
- 📖 [Quick Reference](docs/DOCKER_DB_QUICK_REFERENCE.md)
- 📖 [Implementation Summary](docs/DOCKER_DB_SETUP_SUMMARY.md)

---

## 📝 Environment Configuration

Copy `.env.production.example` to `.env.production` and configure:

```env
# Database
DATABASE_URL="postgresql://postgres:myhome123@postgres:5432/db_myhome"
DB_INIT_MODE="migrate"  # or "reset" or "init"

# NextAuth
NEXTAUTH_URL="https://myhome.co.id"
NEXTAUTH_SECRET="your-secret-here"

# Midtrans
MIDTRANS_SERVER_KEY="your-key"
MIDTRANS_CLIENT_KEY="your-key"

# Cloudinary
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME="your-cloud"
```

---

## 🔧 Development

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

---

## 🗄️ Database Commands

```bash
# Generate Prisma Client
npm run prisma:generate

# Run migrations
npm run db:migrate

# Run seed
npm run db:seed

# Reset database (local)
npm run db:reset

# Reset database (Docker)
npm run db:reset:docker

# Open Prisma Studio
npm run db:studio
```

---

## 📚 Additional Resources

For more deployment options, follow guides for [Vercel](https://create.t3.gg/en/deployment/vercel), [Netlify](https://create.t3.gg/en/deployment/netlify) and [Docker](https://create.t3.gg/en/deployment/docker).
