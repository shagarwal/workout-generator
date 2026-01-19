# Setting Up Redis for Persistent Workout Links

This app uses Redis (via Vercel's managed Redis) to store shared workout links persistently. Follow these steps to set it up:

## 1. Create a Redis Database on Vercel

1. Go to your [Vercel Dashboard](https://vercel.com/dashboard)
2. Navigate to **Storage** tab
3. Click **Create Database**
4. Select **Redis** (formerly called "KV")
5. Choose a name (e.g., "workout-generator-redis")
6. Select your preferred region (choose one close to your users)
7. Click **Create**

## 2. Connect to Your Project

1. In the Redis database page, click on the **Connect** tab
2. Select your `workout-generator` project
3. Click **Connect Project**

This will automatically add the required environment variables to your project.

## 3. Get Environment Variables (For Local Development)

To get the Redis connection URL for local development:

1. In your Redis database page, click the **.env.local** tab
2. Copy the `KV_URL` environment variable shown
3. Create a `.env.local` file in your project root (this file is gitignored)
4. Paste the variable

The variable will look like:
```
KV_URL=redis://default:xxxxx@redis-xxxxx.upstash.io:6379
```

## 4. Deploy or Run Locally

### For Production (Vercel):
Just push your code to GitHub and Vercel will automatically use the KV environment variables.

### For Local Development:
1. Make sure you have `.env.local` with the KV credentials
2. Run `npm run dev`
3. The app will connect to your Vercel KV instance

## How It Works

- When users click **SHARE**, the workout is stored in Redis with a 6-character ID
- The link looks like: `https://your-app.com/?w=abc123`
- Links persist forever (no expiration) across deployments
- Uses the `redis` npm package to connect to Vercel's managed Redis (Upstash)

## Free Tier Limits

Vercel Redis (powered by Upstash) Free Tier includes:
- 256 MB storage (~100,000+ workout links)
- 10,000 commands per day
- Built on Redis 6.x

For most use cases, the free tier is more than sufficient!

## Troubleshooting

**Error: "Connection refused" or "Failed to create short link"**
- Make sure you've connected the Redis database to your project in Vercel dashboard
- Check that the `KV_URL` environment variable is set
- For local development, ensure `.env.local` exists with the correct `KV_URL`

**Share link says "Workout not found"**
- The Redis database might not be connected
- Check Vercel deployment logs for errors
- Verify the `KV_URL` environment variable is correctly set in your Vercel project settings

**Local development not working**
- Make sure you have `.env.local` with the `KV_URL` from your Vercel Redis database
- Restart your dev server after adding the environment variable
