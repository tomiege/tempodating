# Profile Image Storage Setup

This project uses Supabase Storage for storing user profile images.

## Setup Instructions

### 1. Run the Migration

Execute the migration to add the necessary fields and create the storage bucket:

```bash
# If using Supabase CLI locally
supabase migration up

# Or apply manually in Supabase Dashboard > SQL Editor
```

Run the SQL from `supabase/migrations/add_profile_fields.sql`

### 2. Verify Storage Bucket

In your Supabase Dashboard:

1. Go to **Storage** section
2. Verify that the `profile-images` bucket exists
3. Check that it's set to **public** access

### 3. Manual Storage Bucket Creation (if needed)

If the migration doesn't create the bucket automatically:

1. Go to **Storage** in Supabase Dashboard
2. Click **New Bucket**
3. Name: `profile-images`
4. Public: ✅ **Enabled**
5. Click **Create**

### 4. Configure Storage Policies

The migration automatically sets up these policies:

- **Upload**: Users can only upload to their own folder (`{user_id}/`)
- **Read**: All profile images are publicly accessible
- **Update**: Users can only update their own images
- **Delete**: Users can only delete their own images

## API Endpoints

### Upload Image
- **POST** `/api/upload-image`
- Accepts: `multipart/form-data` with `file` field
- Returns: `{ url: string, path: string }`

### Update Profile
- **PUT** `/api/profile`
- Accepts: `multipart/form-data` or `application/json`
- FormData fields: `name`, `age`, `bio`, `contactInfo`, `isMale`, `photo`
- Returns: Updated user profile object

### Get Profile
- **GET** `/api/profile`
- Returns: Current user profile object

## File Structure

```
profile-images/
  {user-id}/
    {timestamp}.{ext}
```

Each user's images are stored in their own folder identified by their user ID.

## Image Optimization

Images are automatically compressed on the client side before upload:
- Maximum dimension: 1920px
- Maximum file size: 800KB
- Format: JPEG
- Quality: Dynamically adjusted to meet size requirements

## Environment Variables

Ensure these are set in your `.env.local`:

```
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```
