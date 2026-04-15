# ExpenseTracker

A personalized expense tracker with GitHub OAuth authentication, built with Next.js 14, Prisma, and PostgreSQL.

## Features

- **GitHub OAuth** — sign in with your GitHub account, no passwords
- **Add / Edit / Delete expenses** — with title, amount, category, date, and optional description
- **9 categories** — Food & Dining, Transportation, Shopping, Entertainment, Bills & Utilities, Health & Medical, Education, Travel, Other
- **Dashboard** — summary cards, spending-by-category bar chart, 6-month area trend chart, recent expenses
- **Expenses page** — searchable, filterable table with sort by date or amount
- **Route protection** — unauthenticated users are redirected to the sign-in page

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 14 (App Router) |
| Auth | NextAuth.js v4 + GitHub Provider |
| ORM | Prisma 5 |
| Database | PostgreSQL |
| Styling | Tailwind CSS |
| Charts | Recharts |

## Setup

### 1. Clone & install

```bash
git clone <your-repo>
cd expense-tracker
npm install
```

### 2. Create a GitHub OAuth App

1. Go to **GitHub → Settings → Developer settings → OAuth Apps → New OAuth App**
2. Set **Homepage URL** to `http://localhost:3000`
3. Set **Authorization callback URL** to `http://localhost:3000/api/auth/callback/github`
4. Copy the **Client ID** and generate a **Client Secret**

### 3. Configure environment variables

```bash
cp .env.example .env
```

Edit `.env`:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/expense_tracker"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="<run: openssl rand -base64 32>"
GITHUB_ID="<your-github-client-id>"
GITHUB_SECRET="<your-github-client-secret>"
```

### 4. Set up the database

```bash
# Push schema to your PostgreSQL database
npm run db:push

# Or use migrations (recommended for production)
npm run db:migrate
```

### 5. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Available Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run start` | Start production server |
| `npm run db:push` | Push Prisma schema to database |
| `npm run db:migrate` | Run database migrations |
| `npm run db:studio` | Open Prisma Studio |
| `npm run db:generate` | Regenerate Prisma client |