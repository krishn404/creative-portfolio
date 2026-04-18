# Creative Portfolio

A modern, responsive portfolio website with an advanced admin dashboard for managing creative works.

## Features

- **Convex Database**: Real-time data synchronization
- **Cloudinary Integration**: Optimized image storage and delivery
- **Status Lifecycle**: Draft, Published, and Archived states for works
- **Theme Support**: Light and dark mode with seamless switching
- **Responsive Design**: Fully optimized for mobile, tablet, and desktop
- **Admin Dashboard**: Complete content management system
- **Confirmation Dialogs**: Prevent accidental deletions
- **Real-time Updates**: Instant synchronization across all clients

## Setups

### 1. Install Dependencies

```bash
npm install
```

### 2. Set Up Convex

```bash
npx convex dev
```

This will:
- Create a new Convex project
- Generate your `NEXT_PUBLIC_CONVEX_URL`
- Set up the database schema

### 3. Configure Environment Variables

Create a `.env.local` file in the root directory:

```env
# Convex
NEXT_PUBLIC_CONVEX_URL=https://your-project.convex.cloud

# Cloudinary
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

# Admin
ADMIN_PASSWORD=your-secure-password
ADMIN_SESSION_TOKEN=your-session-token
```

### 4. Run Development Server

```bash
npm run dev
```

Visit `http://localhost:3000` to see your portfolio and `http://localhost:3000/admin` for the admin dashboard.

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `NEXT_PUBLIC_CONVEX_URL` | Your Convex deployment URL | Yes |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary cloud name | Yes |
| `CLOUDINARY_API_KEY` | Cloudinary API key | Yes |
| `CLOUDINARY_API_SECRET` | Cloudinary API secret | Yes |
| `ADMIN_PASSWORD` | Password for admin login | Yes |
| `ADMIN_SESSION_TOKEN` | Session token for authentication | Yes |

## Deployment

### Deploy to Vercel

1. Push your code to GitHub
2. Import your repository in Vercel
3. Add all environment variables in the Vercel dashboard
4. Deploy

### Deploy Convex

```bash
npx convex deploy
```

This will give you a production Convex URL to use in your Vercel environment variables.

## Admin Dashboard

Access the admin dashboard at `/admin` to:

- Manage portfolio works (add, edit, delete)
- Control work status (draft, published, archived)
- Edit about section content
- Update contact information
- Manage social links

### Status Lifecycle

- **Draft**: Hidden from public view, visible only in admin
- **Published**: Visible on the public portfolio
- **Archived**: Hidden from public, kept in admin for records

## Technology Stack

- **Framework**: Next.js 16
- **Database**: Convex
- **Styling**: Tailwind CSS v4
- **Animations**: Framer Motion
- **Image Storage**: Cloudinary
- **UI Components**: shadcn/ui
- **Theme**: next-themes

## License

© 2025 Krishnakant Maharshi. All rights reserved.
