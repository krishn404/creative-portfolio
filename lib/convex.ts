import { ConvexHttpClient } from "convex/browser"

// Get Convex URL from environment variable
// In production, this should be set to your deployed Convex URL
// Format: https://your-project-name.convex.cloud
const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL

if (!convexUrl) {
  const errorMessage = 
    "NEXT_PUBLIC_CONVEX_URL is not set. Please set it in your environment variables.\n" +
    "For production deployment:\n" +
    "1. Run: npx convex deploy\n" +
    "2. Copy the deployment URL\n" +
    "3. Set NEXT_PUBLIC_CONVEX_URL in your production environment variables"
  
  if (process.env.NODE_ENV === "production") {
    throw new Error(errorMessage)
  } else {
    console.warn(errorMessage)
  }
}

// Create a singleton Convex client instance
// This client is used for server-side operations (API routes, server actions)
export const convex = new ConvexHttpClient(convexUrl || "https://mock.convex.cloud")

// Log the Convex URL in development (not in production for security)
if (process.env.NODE_ENV === "development" && convexUrl) {
  console.log("✓ Convex client initialized with URL:", convexUrl)
}
