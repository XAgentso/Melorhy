# Supabase Setup Guide for Melorhy

## 1. Create a Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Sign up or log in to your account
3. Click "New Project"
4. Choose your organization
5. Enter project details:
   - **Name**: `melorhy-music-app`
   - **Database Password**: Create a strong password (save this!)
   - **Region**: Choose the closest to your users
6. Click "Create new project"
7. Wait for the project to be created (2-3 minutes)

## 2. Get Your Project Credentials

1. Go to your project dashboard
2. Click on "Settings" (gear icon) in the sidebar
3. Click on "API" in the settings menu
4. Copy the following values:
   - **Project URL** (looks like: `https://your-project-id.supabase.co`)
   - **anon public** key (starts with `eyJ...`)

## 3. Update Your App Configuration

1. Open `src/lib/supabase.ts` in your project
2. Replace the placeholder values:

```typescript
const supabaseUrl = 'YOUR_SUPABASE_URL' // Replace with your Project URL
const supabaseAnonKey = 'YOUR_SUPABASE_ANON_KEY' // Replace with your anon key
```

## 4. Set Up the Database Schema

1. In your Supabase dashboard, go to "SQL Editor"
2. Click "New Query"
3. Copy and paste the entire contents of `supabase-schema.sql`
4. Click "Run" to execute the schema
5. You should see "Success. No rows returned" if everything worked

## 5. Configure Row Level Security (RLS)

The schema includes RLS policies, but you may need to enable them:

1. Go to "Authentication" → "Policies" in your Supabase dashboard
2. Make sure RLS is enabled for all tables:
   - `users`
   - `tracks`
   - `playlists`
   - `playlist_tracks`

## 6. Test Your Setup

1. Start your development server: `npm run dev`
2. Log in as an artist: `artist@melorhy.com` / `Artist123!`
3. Try uploading a music file
4. Check your Supabase dashboard → "Table Editor" → "tracks" to see if the track was added

## 7. Optional: Set Up Authentication

If you want to use Supabase Auth instead of the demo system:

1. Go to "Authentication" → "Settings" in Supabase
2. Configure your site URL: `http://localhost:5173`
3. Update your login/register pages to use Supabase Auth
4. Replace the demo authentication with Supabase Auth

## 8. Environment Variables (Production)

For production deployment, use environment variables:

1. Create a `.env.local` file:
```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

2. Update `src/lib/supabase.ts`:
```typescript
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY
```

## Troubleshooting

### Common Issues:

1. **"Invalid API key"**: Double-check your anon key
2. **"Failed to fetch"**: Check your project URL
3. **RLS errors**: Make sure Row Level Security policies are set up correctly
4. **CORS errors**: Add your domain to the allowed origins in Supabase settings

### Getting Help:

- [Supabase Documentation](https://supabase.com/docs)
- [Supabase Discord](https://discord.supabase.com)
- Check the browser console for detailed error messages

## Features You Get:

✅ **Real-time sync**: Tracks added by one user appear instantly for all users
✅ **Cloud storage**: All data is stored in Supabase's PostgreSQL database
✅ **User management**: Built-in user authentication and authorization
✅ **Scalable**: Handles multiple users and large music libraries
✅ **Backup**: Automatic database backups and point-in-time recovery
✅ **Analytics**: Built-in usage analytics and performance monitoring
