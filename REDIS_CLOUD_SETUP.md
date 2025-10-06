# Redis Cloud Setup Guide

## 🆓 Free Redis Cloud Options

### Option 1: Redis Cloud (Recommended)
1. Go to https://redis.com/try-free/
2. Sign up for free account
3. Create a new database
4. Get your connection string
5. Add to your environment variables

### Option 2: Upstash Redis (Serverless)
1. Go to https://upstash.com/
2. Sign up for free account
3. Create a new Redis database
4. Get your connection string
5. Add to your environment variables

## 🔧 Environment Variables Setup

Add these to your `.env` file:

```bash
# Redis Cloud Configuration
REDIS_URL=redis://username:password@host:port
# OR for Redis Cloud
REDIS_CLOUD_URL=redis://username:password@host:port

# Example:
# REDIS_URL=redis://default:password123@redis-12345.c1.us-east-1-2.ec2.cloud.redislabs.com:12345
```

## 🚀 Render Deployment Setup

1. **In Render Dashboard:**
   - Go to your service settings
   - Add environment variable: `REDIS_URL`
   - Value: Your Redis Cloud connection string

2. **Or add to your `.env` file** (if using environment files)

## ✅ Testing Your Setup

Run this command to test your Redis connection:

```bash
node test-redis-fallback.js
```

## 🔄 Fallback Mode

If Redis is not available, the app will automatically use fallback mode:
- No caching (direct database queries)
- App still works perfectly
- No errors or crashes

## 📊 Redis Cloud Free Tier Limits

| Provider | Storage | Connections | Requests |
|----------|---------|-------------|----------|
| Redis Cloud | 30MB | 30 | Unlimited |
| Upstash | 256MB | 1000 | 10,000/day |
| Railway | 1GB | 100 | Unlimited |

## 🛠️ Troubleshooting

### Connection Issues:
1. Check your connection string format
2. Ensure firewall allows Redis port (usually 6379)
3. Verify credentials are correct

### Fallback Mode:
- App works without Redis
- Caching disabled but functionality preserved
- Check logs for "Redis not available, using fallback mode"
