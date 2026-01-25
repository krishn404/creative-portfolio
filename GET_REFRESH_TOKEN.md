# Step-by-Step Guide: Get Your Spotify Refresh Token

## Prerequisites Checklist

Before starting, make sure you have:
- ✅ Created a Spotify App at [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)
- ✅ Got your **Client ID** and **Client Secret** from the dashboard
- ✅ Added the redirect URI `http://127.0.0.1:3000/api/spotify/callback` to your Spotify app settings

---

## Step 1: Create/Update `.env.local` File

1. In your project root (`d:\creative-portfolio`), create a file named `.env.local` (if it doesn't exist)

2. Add these lines (replace with your actual values):

```env
SPOTIFY_CLIENT_ID=your_client_id_here
SPOTIFY_CLIENT_SECRET=your_client_secret_here
SPOTIFY_REDIRECT_URI=http://127.0.0.1:3000/api/spotify/callback
SPOTIFY_REFRESH_TOKEN=
```

**Important Notes:**
- Replace `your_client_id_here` with your actual Client ID from Spotify Dashboard
- Replace `your_client_secret_here` with your actual Client Secret
- Keep `SPOTIFY_REFRESH_TOKEN=` empty for now (we'll fill it in Step 4)
- Make sure there are **NO spaces** around the `=` sign
- Make sure the redirect URI matches exactly: `http://127.0.0.1:3000/api/spotify/callback`

---

## Step 2: Verify Spotify App Settings

1. Go to [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)
2. Click on your app
3. Click **"Edit Settings"**
4. In the **"Redirect URIs"** section, make sure you have:
   ```
   http://127.0.0.1:3000/api/spotify/callback
   ```
5. Click **"Add"** and then **"Save"**
6. Make sure there are no extra spaces or trailing slashes

---

## Step 3: Start Your Development Server

1. Open your terminal in the project directory
2. Make sure your dev server is running:
   ```bash
   npm run dev
   ```
3. The server should be running on `http://127.0.0.1:3000` (or `http://localhost:3000`)

---

## Step 4: Get Your Refresh Token

1. **Open your browser** and go to:
   ```
   http://127.0.0.1:3000/api/spotify/login
   ```
   OR
   ```
   http://localhost:3000/api/spotify/login
   ```

2. **You'll be redirected to Spotify** - Log in if needed

3. **Authorize the app** - Click "Agree" or "Authorize" to grant permissions

4. **You'll be redirected back** to a success page that shows:
   - ✅ A green success message
   - 📋 Your refresh token (a long string)
   - 📝 Instructions

5. **Copy the refresh token** - Click the "Copy to Clipboard" button, or manually select and copy the entire token

6. **Paste it in `.env.local`**:
   - Open `.env.local` file
   - Replace the empty `SPOTIFY_REFRESH_TOKEN=` line with:
     ```env
     SPOTIFY_REFRESH_TOKEN=paste_your_copied_token_here
     ```
   - Save the file

---

## Step 5: Restart Your Development Server

1. **Stop the server** (Press `Ctrl+C` in the terminal)
2. **Start it again**:
   ```bash
   npm run dev
   ```

---

## Step 6: Verify It Works

1. **Visit your portfolio** at `http://127.0.0.1:3000`
2. **Scroll to the About section**
3. **You should see**:
   - Your currently playing track (if Spotify is playing), OR
   - Your last played track (if nothing is playing), OR
   - "Not available" (if there's still an issue)

---

## Troubleshooting

### Error: "Missing Spotify configuration"
- Make sure `.env.local` exists in the project root
- Check that all 4 environment variables are set
- Restart your dev server after adding/updating `.env.local`

### Error: "Invalid redirect URI" during authorization
- The redirect URI in `.env.local` must **exactly match** the one in Spotify Dashboard
- Check for:
  - Typos
  - Trailing slashes (should NOT have `/` at the end)
  - `http://` vs `https://`
  - `127.0.0.1` vs `localhost` (must match in both places)

### Still seeing "Not available" after setup
- Check browser console (F12) for errors
- Check terminal/console for server errors
- Verify your refresh token was copied completely (it's a very long string)
- Make sure you restarted the dev server after adding the token

### "Failed to refresh token" error
- Your refresh token might be invalid
- Try getting a new one by repeating Step 4
- Make sure you copied the entire token (no truncation)

---

## Quick Reference

**Your Redirect URI:** `http://127.0.0.1:3000/api/spotify/callback`

**Login URL:** `http://127.0.0.1:3000/api/spotify/login`

**Required Environment Variables:**
- `SPOTIFY_CLIENT_ID`
- `SPOTIFY_CLIENT_SECRET`
- `SPOTIFY_REDIRECT_URI`
- `SPOTIFY_REFRESH_TOKEN`

