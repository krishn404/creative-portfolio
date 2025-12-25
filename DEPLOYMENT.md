# Production Deployment Guide

## Convex Deployment

### Step 1: Deploy Convex to Production

1. **Deploy your Convex backend:**
   ```bash
   npx convex deploy --prod
   ```
   
   Or if you have a specific deployment key:
   ```bash
   npx convex deploy --prod --url https://your-deployment.convex.cloud
   ```

2. **Get your production Convex URL:**
   After deployment, Convex will provide you with a production URL like:
   ```
   https://your-project-name.convex.cloud
   ```

### Step 2: Set Environment Variables in Production

Add the following environment variables to your production platform (Vercel, Netlify, etc.):

#### Required Variables:

```env
# Convex Production URL (from Step 1)
NEXT_PUBLIC_CONVEX_URL=https://your-project-name.convex.cloud

# Cloudinary Configuration
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

# Admin Authentication
ADMIN_PASSWORD=your-secure-password
ADMIN_SESSION_TOKEN=your-session-token
```

### Step 3: Verify Deployment

1. **Check Convex Dashboard:**
   - Visit your Convex dashboard
   - Verify that your functions are deployed
   - Check that your schema is synced

2. **Test API Endpoints:**
   - Test `/api/works` endpoint
   - Test `/api/content` endpoint
   - Verify CRUD operations work

### Troubleshooting 404 Errors

If you're getting 404 errors on CRUD operations:

1. **Verify Environment Variable:**
   - Ensure `NEXT_PUBLIC_CONVEX_URL` is set correctly
   - The URL should start with `https://` and end with `.convex.cloud`
   - No trailing slashes

2. **Check Convex Deployment:**
   ```bash
   npx convex deploy --prod
   ```
   Make sure all functions are deployed successfully

3. **Verify API Routes:**
   - Check that API routes are accessible
   - Verify authentication is working
   - Check server logs for detailed error messages

4. **Network Issues:**
   - Ensure your production server can reach Convex
   - Check firewall settings
   - Verify CORS settings if applicable

### Vercel Deployment

1. **Add Environment Variables:**
   - Go to Vercel Dashboard → Your Project → Settings → Environment Variables
   - Add all required variables
   - Make sure to add them for "Production" environment

2. **Redeploy:**
   - After adding environment variables, trigger a new deployment
   - Or push a new commit to trigger automatic deployment

### Testing Production

After deployment, test these endpoints:

- `GET /api/works` - Should return list of works
- `GET /api/content` - Should return content
- `POST /api/works` - Should create/update work (requires auth)
- `POST /api/content` - Should update content (requires auth)

### Common Issues

**Issue: "NEXT_PUBLIC_CONVEX_URL is not set"**
- Solution: Add the environment variable in your production platform

**Issue: "404 Not Found" on API calls**
- Solution: Verify Convex is deployed and URL is correct
- Check that functions exist in Convex dashboard

**Issue: "Unauthorized" errors**
- Solution: Verify `ADMIN_PASSWORD` and `ADMIN_SESSION_TOKEN` are set
- Check authentication logic in API routes

