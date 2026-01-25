import { NextRequest, NextResponse } from "next/server"
import { exchangeCodeForTokens } from "@/lib/spotify"

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get("code")
  const error = searchParams.get("error")

  if (error) {
    return new NextResponse(
      `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Spotify Authorization Failed</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
    }
    .container {
      background: white;
      border-radius: 16px;
      padding: 40px;
      max-width: 500px;
      width: 100%;
      box-shadow: 0 20px 60px rgba(0,0,0,0.3);
    }
    h1 { color: #e74c3c; margin-bottom: 16px; }
    p { color: #666; line-height: 1.6; }
  </style>
</head>
<body>
  <div class="container">
    <h1>❌ Authorization Failed</h1>
    <p>Spotify authorization failed: ${error}</p>
    <p style="margin-top: 20px;">
      <a href="/api/spotify/login" style="color: #667eea; text-decoration: none;">← Try again</a>
    </p>
  </div>
</body>
</html>`,
      {
        status: 400,
        headers: { "Content-Type": "text/html" },
      }
    )
  }

  if (!code) {
    return new NextResponse(
      `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>No Authorization Code</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
    }
    .container {
      background: white;
      border-radius: 16px;
      padding: 40px;
      max-width: 500px;
      width: 100%;
      box-shadow: 0 20px 60px rgba(0,0,0,0.3);
    }
    h1 { color: #e74c3c; margin-bottom: 16px; }
    p { color: #666; line-height: 1.6; }
  </style>
</head>
<body>
  <div class="container">
    <h1>❌ No Authorization Code</h1>
    <p>No authorization code was provided in the callback.</p>
    <p style="margin-top: 20px;">
      <a href="/api/spotify/login" style="color: #667eea; text-decoration: none;">← Try again</a>
    </p>
  </div>
</body>
</html>`,
      {
        status: 400,
        headers: { "Content-Type": "text/html" },
      }
    )
  }

  try {
    const { refreshToken } = await exchangeCodeForTokens(code)

    // Return an HTML page with the refresh token
    return new NextResponse(
      `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Spotify Authorization Success</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
      background: linear-gradient(135deg, #1DB954 0%, #1ed760 100%);
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
    }
    .container {
      background: white;
      border-radius: 16px;
      padding: 40px;
      max-width: 600px;
      width: 100%;
      box-shadow: 0 20px 60px rgba(0,0,0,0.3);
    }
    h1 { color: #1DB954; margin-bottom: 8px; font-size: 28px; }
    .success-icon { font-size: 48px; margin-bottom: 16px; }
    .message { color: #333; margin-bottom: 24px; line-height: 1.6; }
    .token-container {
      background: #f5f5f5;
      border: 2px dashed #1DB954;
      border-radius: 8px;
      padding: 20px;
      margin: 24px 0;
      position: relative;
    }
    .token-label {
      font-size: 12px;
      color: #666;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 8px;
      font-weight: 600;
    }
    .token-value {
      font-family: 'Monaco', 'Menlo', 'Courier New', monospace;
      font-size: 14px;
      color: #333;
      word-break: break-all;
      user-select: all;
      background: white;
      padding: 12px;
      border-radius: 4px;
      border: 1px solid #ddd;
    }
    .copy-btn {
      background: #1DB954;
      color: white;
      border: none;
      padding: 12px 24px;
      border-radius: 8px;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      margin-top: 12px;
      width: 100%;
      transition: background 0.2s;
    }
    .copy-btn:hover { background: #1ed760; }
    .copy-btn:active { transform: scale(0.98); }
    .copy-btn.copied {
      background: #4CAF50;
    }
    .instructions {
      background: #e8f5e9;
      border-left: 4px solid #1DB954;
      padding: 16px;
      border-radius: 4px;
      margin-top: 24px;
    }
    .instructions h3 {
      color: #2e7d32;
      margin-bottom: 8px;
      font-size: 16px;
    }
    .instructions ol {
      margin-left: 20px;
      color: #333;
      line-height: 1.8;
    }
    .instructions code {
      background: white;
      padding: 2px 6px;
      border-radius: 3px;
      font-family: 'Monaco', 'Menlo', 'Courier New', monospace;
      font-size: 13px;
      color: #1DB954;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="success-icon">✅</div>
    <h1>Authorization Successful!</h1>
    <p class="message">Your Spotify account has been authorized. Copy the refresh token below and add it to your <code>.env.local</code> file.</p>
    
    <div class="token-container">
      <div class="token-label">Refresh Token</div>
      <div class="token-value" id="token">${refreshToken}</div>
      <button class="copy-btn" onclick="copyToken()" id="copyBtn">Copy to Clipboard</button>
    </div>

    <div class="instructions">
      <h3>📝 Next Steps:</h3>
      <ol>
        <li>Copy the refresh token above</li>
        <li>Open your <code>.env.local</code> file in the project root</li>
        <li>Add or update this line: <code>SPOTIFY_REFRESH_TOKEN=your_token_here</code></li>
        <li>Restart your development server</li>
        <li>The Spotify widget should now work on your portfolio!</li>
      </ol>
    </div>
  </div>

  <script>
    function copyToken() {
      const token = document.getElementById('token').textContent;
      navigator.clipboard.writeText(token).then(() => {
        const btn = document.getElementById('copyBtn');
        btn.textContent = '✓ Copied!';
        btn.classList.add('copied');
        setTimeout(() => {
          btn.textContent = 'Copy to Clipboard';
          btn.classList.remove('copied');
        }, 2000);
      }).catch(err => {
        alert('Failed to copy. Please manually select and copy the token.');
      });
    }
  </script>
</body>
</html>`,
      {
        status: 200,
        headers: { "Content-Type": "text/html" },
      }
    )
  } catch (error) {
    console.error("Error exchanging code for tokens:", error)
    const errorMessage = error instanceof Error ? error.message : String(error)
    return new NextResponse(
      `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Authorization Error</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
    }
    .container {
      background: white;
      border-radius: 16px;
      padding: 40px;
      max-width: 500px;
      width: 100%;
      box-shadow: 0 20px 60px rgba(0,0,0,0.3);
    }
    h1 { color: #e74c3c; margin-bottom: 16px; }
    p { color: #666; line-height: 1.6; }
    .error-details {
      background: #fee;
      border-left: 4px solid #e74c3c;
      padding: 12px;
      margin-top: 16px;
      border-radius: 4px;
      font-family: monospace;
      font-size: 13px;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>❌ Authorization Error</h1>
    <p>Failed to exchange authorization code for tokens.</p>
    <div class="error-details">${errorMessage}</div>
    <p style="margin-top: 20px;">
      <a href="/api/spotify/login" style="color: #667eea; text-decoration: none;">← Try again</a>
    </p>
  </div>
</body>
</html>`,
      {
        status: 500,
        headers: { "Content-Type": "text/html" },
      }
    )
  }
}

