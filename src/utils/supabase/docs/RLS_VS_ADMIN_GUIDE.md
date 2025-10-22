# Supabase Client vs Admin Client - Complete Guide

Understanding when to use regular `supabase` client vs `admin` client in API routes.

## Quick Reference

| Client | Auth | RLS | Use Cases |
|--------|------|-----|-----------|
| `supabase` | User's token | ✅ Respects | User-specific queries, reads |
| `admin` | Service role | ❌ Bypasses | System operations, bulk updates |

## What is RLS (Row Level Security)?

RLS policies control which rows a user can access in your database tables. They're defined in Supabase and enforce data isolation between users.

**Example RLS Policy:**
```sql
-- Users can only see their own posts
CREATE POLICY "Users see own posts" ON posts
  FOR SELECT USING (auth.uid() = author_id);
```

## The Two Clients

### 1. Regular `supabase` Client

**Characteristics:**
- Uses user's authentication token
- Respects RLS policies
- Limited to what the authenticated user can access
- **Safer** - can't accidentally leak data

**When to use:**
- Reading user-specific data
- Most GET operations
- Operations where RLS should apply
- When you want database-level security enforcement

**Example:**
```typescript
export async function GET(request: NextRequest) {
  return withAuth(async (user, supabase) => {
    // Will only return posts the user can access per RLS
    const {data} = await supabase
      .from('posts')
      .select('*')
      .eq('author_id', user.id);

    return successResponse(data);
  });
}
```

### 2. Admin `admin` Client

**Characteristics:**
- Uses service role key (super admin)
- **Bypasses ALL RLS policies**
- Can access/modify any data
- **Powerful but dangerous** - use with caution

**When to use:**
- System-level operations (materialized views, stats)
- Bulk updates across multiple users
- Operations that RLS would incorrectly block
- Admin actions that need full database access

**Example:**
```typescript
export async function PATCH(request: NextRequest, {params}: {params: {id: string}}) {
  return withAdminAuth(async (user, supabase, admin) => {
    const body = await request.json();
    const updateData = prepareUpdateData(body);

    // Use admin to bypass RLS for system-level category updates
    const {data, error} = await admin
      .from('categories')
      .update(updateData)
      .eq('id', params.id)
      .select()
      .single();

    if (error) throw error;
    return successResponse(data);
  });
}
```

## Decision Tree

```
Need to perform database operation?
│
├─ Is this user-specific data?
│  │
│  ├─ YES → Use `supabase` (respects RLS)
│  │    Example: User's own posts, profile
│  │
│  └─ NO → Continue...
│
├─ Does this operation need to access data across users?
│  │
│  ├─ YES → Use `admin` (bypasses RLS)
│  │    Example: Bulk updates, system stats
│  │
│  └─ NO → Continue...
│
├─ Is this a public resource (categories, settings)?
│  │
│  ├─ For READ → Use `supabase` (safer)
│  │
│  └─ For WRITE → Use `admin` (system operation)
```

## Common Patterns

### Pattern 1: User Data (Use `supabase`)

```typescript
// ✅ GOOD: Reading user's own data
export async function GET(request: NextRequest) {
  return withAuth(async (user, supabase) => {
    // RLS ensures user only sees their data
    const {data} = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', user.id)
      .single();

    return successResponse(data);
  });
}
```

### Pattern 2: Admin Managing System Resources (Use `admin`)

```typescript
// ✅ GOOD: Admin updating global categories
export async function PATCH(request: NextRequest, {params}: {params: {id: string}}) {
  return withAdminAuth(async (user, supabase, admin) => {
    const body = await request.json();
    const updateData = prepareUpdateData(body);

    // Categories are global - use admin to bypass RLS
    const {data, error} = await admin
      .from('categories')
      .update(updateData)
      .eq('id', params.id)
      .select()
      .single();

    if (error) throw error;
    return successResponse(data);
  });
}
```

### Pattern 3: Admin Viewing User Data (Use `supabase` with caution)

```typescript
// ⚠️ CAREFUL: Admin viewing specific user's data
export async function GET(request: NextRequest, {params}: {params: {userId: string}}) {
  return withAdminAuth(async (user, supabase, admin) => {
    // Option A: Use admin if RLS would block this
    const {data} = await admin
      .from('user_profiles')
      .select('*')
      .eq('user_id', params.userId)
      .single();

    // Option B: Use supabase if RLS allows admin access
    // (requires proper RLS policy for admins)

    return successResponse(data);
  });
}
```

### Pattern 4: Mixed Operations

```typescript
// ✅ GOOD: Using both clients appropriately
export async function POST(request: NextRequest) {
  return withAdminAuth(async (user, supabase, admin) => {
    const body = await request.json();

    // Check current user's quota with regular client (RLS applies)
    const {data: userQuota} = await supabase
      .from('user_quotas')
      .select('remaining')
      .eq('user_id', user.id)
      .single();

    if (userQuota.remaining <= 0) {
      return errorResponse('Quota exceeded', 403);
    }

    // Create system-level resource with admin client
    const {data} = await admin
      .from('global_resources')
      .insert(body)
      .select()
      .single();

    return successResponse(data);
  });
}
```

## Anti-Patterns (What NOT to do)

### ❌ Using admin for everything

```typescript
// ❌ BAD: Using admin client unnecessarily
export async function GET(request: NextRequest) {
  return withAuth(async (user, supabase, admin) => {
    // Don't use admin when regular supabase would work!
    const {data} = await admin  // ❌ WRONG
      .from('posts')
      .select('*')
      .eq('author_id', user.id);

    return successResponse(data);
  });
}

// ✅ GOOD: Use regular supabase
export async function GET(request: NextRequest) {
  return withAuth(async (user, supabase) => {
    const {data} = await supabase  // ✅ CORRECT
      .from('posts')
      .select('*')
      .eq('author_id', user.id);

    return successResponse(data);
  });
}
```

### ❌ Bypassing RLS when it should apply

```typescript
// ❌ BAD: Admin bypassing RLS for user data
export async function DELETE(request: NextRequest, {params}: {params: {postId: string}}) {
  return withAdminAuth(async (user, supabase, admin) => {
    // This allows deleting ANY post, even if user doesn't own it!
    const {error} = await admin  // ❌ SECURITY ISSUE
      .from('posts')
      .delete()
      .eq('id', params.postId);

    if (error) throw error;
    return successResponse({success: true});
  });
}

// ✅ GOOD: Check ownership first
export async function DELETE(request: NextRequest, {params}: {params: {postId: string}}) {
  return withAuth(async (user, supabase) => {
    // Verify user owns the post
    const {data: post} = await supabase
      .from('posts')
      .select('author_id')
      .eq('id', params.postId)
      .single();

    if (!post || post.author_id !== user.id) {
      return errorResponse('Not authorized to delete this post', 403);
    }

    // Now safe to delete (or use admin if needed for soft deletes, etc.)
    const {error} = await supabase
      .from('posts')
      .delete()
      .eq('id', params.postId);

    if (error) throw error;
    return successResponse({success: true});
  });
}
```

## Real-World Examples from Our Codebase

### Categories (Global Resources)

```typescript
// GET - Use regular supabase (respects RLS, safer for reads)
export async function GET(request: NextRequest, {params}: {params: {id: string}}) {
  return withAuth(async (user, supabase) => {
    // Categories are public, but use supabase for consistent security
    const {data, error} = await supabase
      .from('categories')
      .select('*')
      .eq('id', params.id)
      .single();

    if (error) throw error;
    return successResponse(data);
  });
}

// PATCH - Use admin (system-level update, needs to bypass RLS)
export async function PATCH(request: NextRequest, {params}: {params: {id: string}}) {
  return withAdminAuth(async (user, supabase, admin) => {
    const body = await request.json();
    const updateData = prepareUpdateData(body);

    // Use admin because categories are global system resources
    const {data, error} = await admin
      .from('categories')
      .update(updateData)
      .eq('id', params.id)
      .select()
      .single();

    if (error) throw error;
    return successResponse(data);
  });
}
```

### Category Fees (Nested Resources)

```typescript
// GET - Regular supabase for reading
export async function GET(request: NextRequest, {params}: {params: {id: string}}) {
  return withAuth(async (user, supabase) => {
    const {data, error} = await supabase
      .from('category_membership_fees')
      .select('*, categories(name)')
      .eq('category_id', params.id)
      .eq('is_active', true);

    if (error) throw error;
    return successResponse(data);
  });
}

// PATCH - Admin for updates (with validation)
export async function PATCH(
  request: NextRequest,
  {params}: {params: {id: string; feeId: string}}
) {
  return withAdminAuth(async (user, supabase, admin) => {
    // Verify fee belongs to category (security check)
    const {data: existingFee} = await supabase
      .from('category_membership_fees')
      .select('id')
      .eq('id', params.feeId)
      .eq('category_id', params.id)
      .single();

    if (!existingFee) {
      return errorResponse('Fee not found or does not belong to category', 404);
    }

    // Use admin for the actual update
    const body = await request.json();
    const {data, error} = await admin
      .from('category_membership_fees')
      .update({
        ...body,
        updated_by: user.id,
      })
      .eq('id', params.feeId)
      .select()
      .single();

    if (error) throw error;
    return successResponse(data);
  });
}
```

## Key Takeaways

1. **Default to `supabase`** - It's safer and respects RLS
2. **Use `admin` sparingly** - Only when you need to bypass RLS
3. **Always validate ownership** - Even with admin client
4. **Think about security** - What would happen if RLS was bypassed?
5. **Document your choice** - Comment why you chose admin vs supabase

## Further Reading

- [Supabase RLS Documentation](https://supabase.com/docs/guides/auth/row-level-security)
- [Service Role Key Best Practices](https://supabase.com/docs/guides/api/api-keys)
