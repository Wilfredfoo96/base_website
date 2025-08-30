# Quick Start Guide

Get your Clerk + Convex login page running in 5 minutes!

## 🚀 Quick Setup

### 1. Install Dependencies
```powershell
# Run in PowerShell
npm install
npm install tailwindcss-animate
```

### 2. Set Up Clerk
1. Go to [Clerk Dashboard](https://dashboard.clerk.com)
2. Create new application
3. Copy your **Publishable Key** (starts with `pk_test_`)

### 3. Set Up Convex
1. Go to [Convex Dashboard](https://dashboard.convex.dev)
2. Create new project
3. Copy your **Deployment URL** (ends with `.convex.cloud`)

### 4. Environment Variables
Create `.env.local` file:
```env
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_your_key_here
NEXT_PUBLIC_CONVEX_URL=https://your-project.convex.cloud
```

### 5. Start Development
```powershell
# Terminal 1: Start Convex
npx convex dev

# Terminal 2: Start Next.js
npm run dev
```

### 6. Open Browser
Navigate to `http://localhost:3000`

## 🎯 What You'll See

- **Beautiful login page** with gradient background
- **Sign In/Sign Up forms** powered by Clerk
- **Real-time authentication** state management
- **Convex integration** ready for database operations

## 🔧 Customization

### Change Colors
Edit `app/globals.css` to modify the color scheme

### Add More Fields
Extend `convex/schema.ts` and `convex/users.ts` for additional user data

### Modify UI
Update `app/page.tsx` to change the layout and styling

## 🚨 Troubleshooting

**"Missing NEXT_PUBLIC_CONVEX_URL"**
- Check your `.env.local` file
- Ensure Convex project is created

**Styling issues**
- Run `npm install tailwindcss-animate`
- Check that all dependencies are installed

**Authentication errors**
- Verify Clerk publishable key is correct
- Check browser console for detailed errors

## 📚 Next Steps

1. **Add user profiles** - Extend the database schema
2. **Create protected routes** - Use the middleware
3. **Add real-time features** - Leverage Convex subscriptions
4. **Deploy to production** - Use Vercel for easy deployment

## 🆘 Need Help?

- Check the full [README.md](README.md)
- Review [Clerk Docs](https://clerk.com/docs)
- Check [Convex Docs](https://docs.convex.dev)
- Open an issue in the repository

---

**Happy coding! 🎉**
