# Clerk Webhook Configuration Fix

## Current Issues

1. **Wrong Webhook URL**: `http://easylogistics.my/webhook`
   - Should be: `https://easylogistics.my/api/webhooks/clerk`
   - Must use HTTPS in production
   - Must include full path `/api/webhooks/clerk`

2. **All Webhooks Failing**: Likely due to:
   - Incorrect URL
   - Missing environment variable in production
   - SSL/HTTPS issues

## How to Fix

### Step 1: Update Webhook URL in Clerk Dashboard

1. Go to [Clerk Dashboard](https://dashboard.clerk.com)
2. Navigate to **Webhooks** → Your webhook endpoint
3. Update the endpoint URL to:
   ```
   https://easylogistics.my/api/webhooks/clerk
   ```
   ⚠️ **Important**: 
   - Use `https://` (not `http://`)
   - Include the full path `/api/webhooks/clerk`
   - Remove trailing slashes

### Step 2: Verify Environment Variables in Production

Make sure these are set in your production environment (Vercel):

1. **CLERK_WEBHOOK_SECRET**: `whsec_h9nc84bzzgYMg9cdySzLPdCjquHuoFHO`
2. **NEXT_PUBLIC_CONVEX_URL**: Your Convex URL

**In Vercel:**
1. Go to your project settings
2. Navigate to **Environment Variables**
3. Add/verify:
   - `CLERK_WEBHOOK_SECRET` = `whsec_h9nc84bzzgYMg9cdySzLPdCjquHuoFHO`
   - `NEXT_PUBLIC_CONVEX_URL` = Your Convex URL

### Step 3: Test the Webhook

After updating:
1. Save the webhook configuration in Clerk
2. Test by creating a new user or triggering a test event
3. Check the "Message Attempts" tab in Clerk Dashboard
4. Should see successful deliveries (green checkmarks)

## What Each Webhook Event Does

### `user.created`
- **When**: New user signs up through Clerk
- **Action**: Creates user record in Convex database
- **Data Synced**: 
  - Clerk ID
  - First name, last name
  - Email address
  - Profile image
  - Marks as webhook-created (not auto-generated)

### `user.updated`
- **When**: User updates their profile in Clerk
- **Action**: Updates user record in Convex
- **Data Synced**: Same as user.created

### `user.deleted`
- **When**: User account is deleted in Clerk
- **Action**: Removes user from Convex database
- **Purpose**: Keeps database clean

### `session.created`
- **When**: User signs in (creates a new session)
- **Action**: Updates `lastSignInAt` timestamp in Convex
- **Purpose**: Track user activity

## Troubleshooting

### If webhooks still fail:

1. **Check Vercel Logs**:
   - Go to Vercel Dashboard → Your Project → Logs
   - Look for webhook errors

2. **Verify SSL Certificate**:
   - Ensure `https://easylogistics.my` has valid SSL
   - Test: `curl https://easylogistics.my/api/webhooks/clerk`

3. **Check Webhook Secret**:
   - Must match exactly: `whsec_h9nc84bzzgYMg9cdySzLPdCjquHuoFHO`
   - No extra spaces or quotes

4. **Test Endpoint Manually**:
   ```bash
   curl -X POST https://easylogistics.my/api/webhooks/clerk \
     -H "Content-Type: application/json" \
     -d '{"test": "data"}'
   ```
   Should return an error about missing signature (this is expected - means endpoint is reachable)

## Expected Behavior After Fix

✅ New user signups → Automatically created in Convex  
✅ User profile updates → Synced to Convex  
✅ User deletions → Removed from Convex  
✅ User sign-ins → Last sign-in timestamp updated  
✅ All webhook attempts show as "Succeeded" in Clerk Dashboard

## Next Steps

1. Update webhook URL in Clerk Dashboard
2. Verify environment variables in Vercel
3. Test with a new user signup
4. Monitor webhook delivery in Clerk Dashboard



