# Local Development Setup

This guide will help you set up the BizModelAI application for local development in Cursor.

## Prerequisites

1. **Node.js** (v18 or higher)
2. **Yarn** (this project uses Yarn as the package manager)
3. **PostgreSQL database** (local or remote)

## Setup Steps

### 1. Install Dependencies

```bash
yarn install
```

### 2. Database Setup

You have several options for the database:

#### Option A: Local PostgreSQL

- Install PostgreSQL locally
- Create a database called `bizmodelai`
- Update the `DATABASE_URL` in `.env` file

#### Option B: Free Cloud Database (Recommended)

- **Supabase**: Go to [supabase.com](https://supabase.com), create a project, and get the connection string
- **Neon**: Go to [neon.tech](https://neon.tech), create a database, and get the connection string
- Update the `DATABASE_URL` in `.env` file

### 3. Environment Variables

The `.env` file has been created with all necessary variables. Update these:

**Required:**

- `DATABASE_URL`: Your PostgreSQL connection string
- `SESSION_SECRET`: Any random string for session security

**Optional (for full functionality):**

- `OPENAI_API_KEY`: Get from [OpenAI](https://platform.openai.com/api-keys)
- `RESEND_API_KEY`: Get from [Resend](https://resend.com) for email functionality
- `STRIPE_SECRET_KEY` & `STRIPE_PUBLISHABLE_KEY`: Get from [Stripe](https://stripe.com) for payments
- `PAYPAL_CLIENT_ID` & `PAYPAL_CLIENT_SECRET`: Get from [PayPal Developer](https://developer.paypal.com)

### 4. Database Migration

Run the database migrations to set up the schema:

```bash
yarn db:push
```

### 5. Start Development Server

```bash
yarn dev
```

The application will be available at:

- Frontend: http://localhost:5173
- Backend API: http://localhost:5000

## Project Structure

- `client/`: React frontend application
- `server/`: Express.js backend API
- `shared/`: Shared types and utilities
- `migrations/`: Database migration files

## Development Commands

- `yarn dev`: Start development server
- `yarn build`: Build for production
- `yarn check`: TypeScript type checking
- `yarn db:push`: Push database schema changes

## Common Issues

### Database Connection Issues

- Make sure PostgreSQL is running
- Verify the `DATABASE_URL` format: `postgresql://username:password@host:port/database`
- Check firewall settings if using a remote database

### Missing Features

- Without `OPENAI_API_KEY`: AI-powered insights won't work
- Without `STRIPE_SECRET_KEY`: Payment processing won't work
- Without `RESEND_API_KEY`: Email functionality won't work

### Port Conflicts

- If port 5000 is in use, change `PORT` in `.env`
- If port 5173 is in use, update `vite.config.ts`

## Testing the Setup

1. Visit http://localhost:5173
2. Check the health endpoint: http://localhost:5000/api/health/detailed
3. Try creating an account and taking the quiz

## MCP Server Integrations

For enhanced development experience, you can connect to these MCP servers in Cursor:

- **Neon**: For database management if using Neon as your database
- **Sentry**: For error monitoring and debugging
- **Context7**: For up-to-date documentation on the frameworks used
- **Netlify**: For deployment when ready

Click the "MCP Servers" button in Cursor's chat interface to connect to these services.
