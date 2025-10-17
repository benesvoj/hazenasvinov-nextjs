# Environment Setup Guide

This guide will help you set up the required environment variables for the project.

## Quick Setup

1. **Copy the example file**:
   ```bash
   cp .env.local.example .env.local
   ```

2. **Get your Supabase credentials**:
   - **Access Token**: https://app.supabase.com/account/tokens
     - Click "Generate new token"
     - Give it a name (e.g., "Local Development")
     - Copy the token (starts with `sbp_`)

   - **Project Reference ID**: https://app.supabase.com/project/YOUR_PROJECT/settings/general
     - Look for "Reference ID" in the General settings
     - Copy the value (usually a string like "abcdefghijklmnop")

3. **Edit `.env.local`** and fill in the values:
   ```bash
   # Supabase Type Generation
   SUPABASE_ACCESS_TOKEN=sbp_your_access_token_here
   SUPABASE_PROJECT_REF=your-project-ref-here

   # Other Supabase credentials
   NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
   ```

4. **Test the setup**:
   ```bash
   npm run db:generate-types
   ```

## What These Variables Are Used For

### Development Tools
- **`SUPABASE_ACCESS_TOKEN`** - Required for `npm run db:generate-types` to fetch database schema
- **`SUPABASE_PROJECT_REF`** - Your Supabase project identifier

### Application Runtime
- **`NEXT_PUBLIC_SUPABASE_URL`** - Your Supabase project URL (client-side)
- **`NEXT_PUBLIC_SUPABASE_ANON_KEY`** - Public API key (client-side)
- **`SUPABASE_SERVICE_ROLE_KEY`** - Service role key (server-side only, has admin privileges)

### Authentication
- **`NEXTAUTH_SECRET`** - Secret for NextAuth.js session encryption
- **`NEXTAUTH_URL`** - Base URL of your application

## Security Notes

- ⚠️ **NEVER commit `.env.local` to git** (it's in `.gitignore`)
- ⚠️ **NEVER expose `SUPABASE_SERVICE_ROLE_KEY` on the client side**
- ⚠️ Keep your `SUPABASE_ACCESS_TOKEN` private - it has access to your database schema
- ✅ Variables starting with `NEXT_PUBLIC_` are safe to expose on the client side

## Troubleshooting

### "SUPABASE_ACCESS_TOKEN environment variable is not set"
- Make sure you've created `.env.local` from the example
- Make sure you've added the `SUPABASE_ACCESS_TOKEN` value
- Try restarting your terminal/IDE after adding the variable

### "Access token not provided"
- Your token might have expired - generate a new one at https://app.supabase.com/account/tokens
- Make sure there are no spaces around the `=` sign in `.env.local`
- Make sure the line doesn't start with `#` (which marks it as a comment)

### Token format
Your access token should look like: `sbp_1234567890abcdef...` (starts with `sbp_`)

## Related Documentation

- [Type Generation Setup](./docs/TYPE_GENERATION_SETUP_COMPLETE.md)
- [Database Type Generation Guide](./docs/DATABASE_TYPE_GENERATION.md)

---

**Need Help?** Check the [example file](./.env.local.example) for the complete template.