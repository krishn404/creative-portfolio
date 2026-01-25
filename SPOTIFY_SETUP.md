# Spotify Widget Setup Guide

This guide will help you set up the macOS-inspired Spotify widget for your portfolio.

## Prerequisites

1. A Spotify account
2. A Spotify App registered at [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)

## Step 1: Create a Spotify App

1. Go to [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)
2. Click "Create an app"
3. Fill in the app details:
   - **App name**: Your portfolio name (e.g., "My Portfolio")
   - **App description**: Brief description
   - **Redirect URI**: 
     - For local development: `http://localhost:3000/api/spotify/callback`
     - For production: `https://yourdomain.com/api/spotify/callback`
4. Accept the terms and click "Save"
5. Note down your **Client ID** and **Client Secret**

### ⚠️ Troubleshooting: "This redirect URI is not secure" Error

If you see this error when adding the redirect URI, try these solutions:

**Option 1: Use 127.0.0.1 instead of localhost**
- Try: `http://127.0.0.1:3000/api/spotify/callback`
- Make sure to also update your `.env.local` to match:
  ```env
  SPOTIFY_REDIRECT_URI=http://127.0.0.1:3000/api/spotify/callback
  ```

**Option 2: Check for common issues**
- ✅ No trailing slash (should end with `/callback`, not `/callback/`)
- ✅ No extra spaces before or after the URI
- ✅ Exact format: `http://localhost:3000/api/spotify/callback` (lowercase)
- ✅ Make sure you're adding it in the "Redirect URIs" section, not "Website"

**Option 3: Add multiple redirect URIs**
- You can add both `http://localhost:3000/api/spotify/callback` and `http://127.0.0.1:3000/api/spotify/callback`
- Spotify allows multiple redirect URIs (one per line)

**Option 4: Use a different port**
- If port 3000 doesn't work, try a different port like `http://localhost:3001/api/spotify/callback`
- Make sure your Next.js dev server runs on that port

**Note**: For local development, `http://localhost` should work. If it still doesn't, Spotify may have changed their validation rules. In that case, you can:
1. Skip adding the redirect URI during app creation
2. Edit the app settings after creation
3. Add the redirect URI in the "Edit Settings" section

## Step 2: Configure Environment Variables

Create a `.env.local` file in your project root (if it doesn't exist) and add:

```env
SPOTIFY_CLIENT_ID=your_client_id_here
SPOTIFY_CLIENT_SECRET=your_client_secret_here
SPOTIFY_REDIRECT_URI=http://localhost:3000/api/spotify/callback
SPOTIFY_REFRESH_TOKEN=your_refresh_token_here
```

**Important**: Replace the placeholder values with your actual credentials.

## Step 3: Get Your Refresh Token

1. Start your development server:
   ```bash
   npm run dev
   ```

2. Visit the authorization endpoint in your browser:
   ```
   http://localhost:3000/api/spotify/login
   ```

3. You'll be redirected to Spotify to authorize the app. Click "Agree" to grant permissions.

4. After authorization, you'll be redirected back to `/api/spotify/callback` which will display:
   - A success message
   - Your refresh token
   - Instructions to add it to `.env.local`

5. Copy the refresh token from the response and add it to your `.env.local` file:
   ```env
   SPOTIFY_REFRESH_TOKEN=paste_your_refresh_token_here
   ```

6. Restart your development server for the changes to take effect.

## Step 4: Add the Widget to Your Portfolio

Import and use the widget component in any page or component:

```tsx
import SpotifyGlassWidget from "@/components/spotify-glass-widget"

export default function MyPage() {
  return (
    <div>
      {/* Your other content */}
      <SpotifyGlassWidget />
    </div>
  )
}
```

### Example: Adding to the About Section

You can add it to `components/about.tsx` or any other section:

```tsx
import SpotifyGlassWidget from "@/components/spotify-glass-widget"

// Inside your component:
<div className="mt-8">
  <SpotifyGlassWidget />
</div>
```

## Step 5: Production Setup

For production deployment:

1. Update `SPOTIFY_REDIRECT_URI` in your production environment variables:
   ```env
   SPOTIFY_REDIRECT_URI=https://yourdomain.com/api/spotify/callback
   ```

2. Update the Redirect URI in your Spotify App settings to match your production URL.

3. Deploy your application with the environment variables set.

## Features

- **Now Playing**: Shows currently playing track with animated status indicator
- **Last Played**: Falls back to recently played track when nothing is playing
- **Auto-refresh**: Polls Spotify API every 30 seconds
- **Caching**: API responses are cached for 60 seconds to reduce API calls
- **Glass Design**: macOS-inspired frosted glass effect with smooth animations
- **Responsive**: Works on all screen sizes
- **Theme-aware**: Adapts to light/dark mode

## Troubleshooting

### "This redirect URI is not secure" error
See the troubleshooting section in Step 1 above for detailed solutions.

### "Missing Spotify credentials" error
- Ensure all environment variables are set in `.env.local`
- Restart your development server after adding environment variables
- Check that variable names match exactly (case-sensitive)

### "Failed to refresh token" error
- Your refresh token may have expired or been revoked
- Re-run the authorization flow (Step 3) to get a new refresh token
- Make sure the redirect URI in `.env.local` exactly matches the one in Spotify dashboard

### "Invalid redirect URI" error during authorization
- The redirect URI in your `.env.local` must exactly match one of the URIs in your Spotify app settings
- Check for typos, trailing slashes, or port mismatches
- Make sure you're using the same format (localhost vs 127.0.0.1) in both places

### Widget shows "Not available"
- Check that your Spotify account has active playback or recent listening history
- Ensure your Spotify app has the correct scopes enabled
- Check browser console for any API errors
- Verify your refresh token is valid by checking server logs

### Private session error
- If your Spotify account is in a private session, the API may not return data
- Disable private session in Spotify settings

## API Routes

- `/api/spotify/login` - Initiates Spotify authorization
- `/api/spotify/callback` - Handles authorization callback and returns refresh token
- `/api/spotify/status` - Returns current playing or last played track (cached for 60s)

## Security Notes

- Never commit `.env.local` to version control
- Keep your Client Secret and Refresh Token secure
- The refresh token is long-lived but can be revoked in Spotify settings
- All API routes are server-side only for security

