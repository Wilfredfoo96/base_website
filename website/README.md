# Clerk + Convex Login Integration

A modern Next.js 14+ application that demonstrates seamless integration between Clerk authentication and Convex database, following best practices for the App Router architecture.

## Features

- 🔐 **Clerk Authentication**: Modern, secure authentication with social logins
- 🗄️ **Convex Database**: Real-time database with automatic sync
- 🎨 **Modern UI**: Built with Tailwind CSS and shadcn/ui components
- 📱 **Responsive Design**: Mobile-first approach with beautiful gradients
- ⚡ **Performance**: Optimized with Next.js 14+ features
- 🛡️ **Security**: Middleware protection and secure environment variables

## Tech Stack

- **Frontend**: Next.js 14+ (App Router)
- **Authentication**: Clerk
- **Database**: Convex
- **Styling**: Tailwind CSS + shadcn/ui
- **Language**: TypeScript
- **Deployment**: Vercel (recommended)

## Prerequisites

Before you begin, ensure you have:

1. **Node.js 18+** installed
2. **Clerk Account** - [Sign up here](https://clerk.com)
3. **Convex Account** - [Sign up here](https://convex.dev)

## Setup Instructions

### 1. Clone and Install Dependencies

```bash
# Install dependencies
npm install

# Install additional required packages
npm install tailwindcss-animate
```

### 2. Configure Clerk

1. Go to your [Clerk Dashboard](https://dashboard.clerk.com)
2. Create a new application
3. Copy your **Publishable Key** and **Secret Key**
4. Go to **JWT Templates** → **New Template** → **Convex**
5. Copy the **Issuer URL** (Frontend API URL)

### 3. Configure Convex

1. Go to your [Convex Dashboard](https://dashboard.convex.dev)
2. Create a new project
3. Copy your **Deployment URL**
4. Run the following command to sync your schema:

```bash
npx convex dev
```

### 4. Environment Variables

Create a `.env.local` file in your project root:

```env
# Clerk Configuration
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_your_publishable_key_here
CLERK_SECRET_KEY=sk_test_your_secret_key_here
CLERK_FRONTEND_API_URL=https://your-app.clerk.accounts.dev

# Convex Configuration
NEXT_PUBLIC_CONVEX_URL=https://your-project.convex.cloud
CONVEX_DEPLOY_KEY=your_convex_deploy_key_here
```

### 5. Deploy Convex Schema

```bash
# Start Convex development server
npx convex dev

# Deploy to production (when ready)
npx convex deploy
```

### 6. Run the Application

```bash
# Development mode
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

## Project Structure

```
├── app/                    # Next.js App Router
│   ├── globals.css        # Global styles with Tailwind
│   ├── layout.tsx         # Root layout with providers
│   └── page.tsx           # Main login page
├── components/             # Reusable components
│   ├── ui/                # shadcn/ui components
│   │   ├── button.tsx     # Button component
│   │   ├── card.tsx       # Card component
│   │   └── input.tsx      # Input component
│   └── ConvexClientProvider.tsx  # Convex + Clerk integration
├── convex/                 # Convex backend
│   ├── auth.config.js     # Clerk authentication config
│   ├── schema.ts          # Database schema
│   ├── users.ts           # User-related functions
│   └── _generated/        # Auto-generated types
├── lib/                    # Utility functions
│   └── utils.ts           # Class name utilities
├── middleware.ts           # Clerk middleware
└── package.json            # Dependencies
```

## Key Integration Points

### Clerk + Convex Provider Setup

The `ConvexClientProvider` component wraps your app with both Clerk and Convex contexts:

```tsx
<ClerkProvider>
  <ConvexClientProvider>
    {children}
  </ConvexClientProvider>
</ClerkProvider>
```

### Authentication State Management

Use Convex's authentication components instead of Clerk's for better integration:

```tsx
import { Authenticated, Unauthenticated, AuthLoading } from 'convex/react'

// Instead of Clerk's <SignedIn>, <SignedOut>
<Authenticated>
  {/* User is authenticated */}
</Authenticated>
<Unauthenticated>
  {/* User is not authenticated */}
</Unauthenticated>
```

### Database Queries with Authentication

Access user identity in Convex functions:

```tsx
export const getCurrentUser = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) {
      throw new Error('Not authenticated')
    }
    // Use identity.email, identity.name, etc.
  },
})
```

## Usage Examples

### 1. Basic Authentication Flow

The app automatically handles:
- Sign in/Sign up forms
- User profile management
- Authentication state
- Protected routes

### 2. Adding Custom User Data

Extend the user profile in Convex:

```tsx
// In convex/users.ts
export const updateUserBio = mutation({
  args: { bio: v.string() },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) throw new Error('Not authenticated')
    
    // Update user bio logic
  },
})
```

### 3. Real-time Data Sync

Convex automatically syncs data across all connected clients:

```tsx
// In your React component
const userProfile = useQuery(api.users.getCurrentUser)
```

## Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Connect your repository to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy!

### Environment Variables in Production

Ensure these are set in your production environment:
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
- `CLERK_SECRET_KEY`
- `CLERK_FRONTEND_API_URL`
- `NEXT_PUBLIC_CONVEX_URL`

## Troubleshooting

### Common Issues

1. **"Missing NEXT_PUBLIC_CONVEX_URL"**
   - Check your `.env.local` file
   - Ensure Convex project is properly configured

2. **"Not authenticated" errors**
   - Verify Clerk JWT template is configured for Convex
   - Check that `CLERK_FRONTEND_API_URL` matches your JWT template issuer

3. **Styling issues**
   - Ensure Tailwind CSS is properly configured
   - Check that `tailwindcss-animate` is installed

### Getting Help

- [Clerk Documentation](https://clerk.com/docs)
- [Convex Documentation](https://docs.convex.dev)
- [Next.js Documentation](https://nextjs.org/docs)

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

MIT License - feel free to use this project for your own applications!
