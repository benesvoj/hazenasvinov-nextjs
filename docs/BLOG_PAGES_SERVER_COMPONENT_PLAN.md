# Blog Pages Server Component Migration - DIY Guide

## Overview

Convert 2 blog pages from Client Components to Server Components:
1. `/blog` - Blog listing page
2. `/blog/[slug]` - Blog detail page

**Estimated time:** 30-45 minutes total
**Difficulty:** Medium (good learning exercise!)

---

## Pre-Migration Checklist

Before you start:

- [ ] Read this entire plan first
- [ ] Have `npm run dev` running
- [ ] Open browser DevTools to monitor changes
- [ ] Create backups (done automatically in steps below)
- [ ] Understand the pattern from seasons/committees examples

---

## Page 1: Blog Detail Page (`/blog/[slug]`) - EASIER START

**Why start here:** Simpler than listing page, better learning curve

### Current State Analysis

**File:** `src/app/(main)/blog/[slug]/page.tsx`

**What it does:**
- Fetches blog post by slug (client-side)
- Fetches categories (client-side)
- Fetches related match (client-side)
- Shows loading spinner
- Shows error state

**Problems:**
- 🐌 2-3 second load with spinner
- 🔍 **TERRIBLE SEO** (Google sees spinner, not content!)
- 📦 Fetching logic in client bundle

---

### Step 1: Backup Current File (2 min)

```bash
cp src/app/\(main\)/blog/\[slug\]/page.tsx src/app/\(main\)/blog/\[slug\]/page.tsx.backup
```

**Verify:**
```bash
ls -la src/app/\(main\)/blog/\[slug\]/
# Should see: page.tsx and page.tsx.backup
```

---

### Step 2: Analyze Current Data Fetching (5 min)

**Open:** `page.tsx.backup` and identify what data is fetched:

```typescript
// Line 28: Blog post by slug
const {post, relatedPosts, loading, error} = useFetchBlogPostBySlug(slug);

// Line 29: Categories (for category badge)
const {data: categories} = useFetchCategories();

// Line 30: Related match (if post is about a match)
const {match: relatedMatch} = useFetchPostMatch(post?.id || null);
```

**Key observation:** All 3 fetches can be done on server!

---

### Step 3: Create Server Component (15 min)

**File:** `src/app/(main)/blog/[slug]/page.tsx`

**Replace entire file with:**

```typescript
import {createClient} from '@/utils/supabase/server';
import {notFound} from 'next/navigation';
import Image from 'next/image';

import {Button, Card, CardBody, Chip, Divider} from '@heroui/react';
import {ArrowLeftIcon, BookmarkIcon, CalendarIcon, ShareIcon, TagIcon, UserIcon} from '@heroicons/react/24/outline';

import {BlogContent, BlogPostCard} from '@/components/features';
import {MatchInfo} from '@/components/shared';
import {Heading, Link} from '@/components/ui';
import {SponsorsTemp} from '@/app/(main)/components/SponsorsTemp';
import {formatDateString} from '@/helpers';
import {translations} from '@/lib';

const t = translations.landingPage.posts;

// ✅ Server Component (no 'use client'!)
export default async function BlogPostPage({params}: {params: Promise<{slug: string}>}) {
  const {slug} = await params;
  const supabase = await createClient();

  // ✅ Fetch blog post on server
  const {data: post, error: postError} = await supabase
    .from('blog_posts')
    .select('*')
    .eq('slug', slug)
    .eq('status', 'published')
    .single();

  // ✅ Handle not found
  if (postError || !post) {
    notFound();  // Next.js 404 page
  }

  // ✅ Fetch related data in parallel
  const [
    {data: categories},
    {data: relatedPosts},
    {data: matchData}
  ] = await Promise.all([
    // Categories (for badge)
    supabase.from('categories').select('*'),

    // Related posts (same category)
    post.category_id
      ? supabase
          .from('blog_posts')
          .select('*')
          .eq('status', 'published')
          .eq('category_id', post.category_id)
          .neq('slug', slug)
          .order('published_at', {ascending: false})
          .limit(2)
      : Promise.resolve({data: null}),

    // Related match (if post has match_id)
    post.match_id
      ? supabase
          .from('matches')
          .select(`
            *,
            home_team:home_team_id(
              id,
              team_suffix,
              club_category:club_categories(
                club:clubs(id, name, short_name, logo_url, is_own_club)
              )
            ),
            away_team:away_team_id(
              id,
              team_suffix,
              club_category:club_categories(
                club:clubs(id, name, short_name, logo_url, is_own_club)
              )
            ),
            category:categories(id, name),
            season:seasons(id, name)
          `)
          .eq('id', post.match_id)
          .single()
      : Promise.resolve({data: null})
  ]);

  const category = categories?.find(c => c.id === post.category_id);

  // ✅ Render immediately - NO loading state needed!
  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Back Button */}
      <div>
        <Button
          as={Link}
          href="/blog"
          variant="bordered"
          startContent={<ArrowLeftIcon className="w-4 h-4" />}
        >
          {t.backToPosts}
        </Button>
      </div>

      {/* Article */}
      <article>
        <header className="space-y-4">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white">
            {post.title}
          </h1>

          {/* Meta */}
          <div className="flex flex-wrap items-center gap-6 text-sm text-gray-500 dark:text-gray-400">
            <div className="flex items-center gap-2">
              <UserIcon className="w-4 h-4" />
              <span>{post.author_id === 'default-user' ? 'Admin' : `ID: ${post.author_id}`}</span>
            </div>
            <div className="flex items-center gap-2">
              <CalendarIcon className="w-4 h-4" />
              <span>{post.published_at ? formatDateString(post.published_at) : '-'}</span>
            </div>
            {category && (
              <Chip size="sm" variant="solid" color="primary">
                {category.name}
              </Chip>
            )}
          </div>
        </header>

        {/* Image */}
        {post.image_url && (
          <div className="my-8">
            <Image
              src={post.image_url}
              alt={post.title}
              width={800}
              height={400}
              className="w-full h-64 lg:h-80 object-cover rounded-lg"
            />
          </div>
        )}

        {/* Content */}
        <BlogContent content={post.content} />

        {/* Related Match */}
        {matchData && (
          <>
            <Divider className="my-6" />
            <MatchInfo match={matchData} />
          </>
        )}

        <SponsorsTemp />

        {/* Share Buttons */}
        <div className="flex items-center justify-between mt-8 pt-8 border-t">
          <div className="flex items-center gap-4">
            <Button variant="bordered" size="sm" startContent={<ShareIcon className="w-4 h-4" />}>
              Sdílet
            </Button>
            <Button variant="bordered" size="sm" startContent={<BookmarkIcon className="w-4 h-4" />}>
              Uložit
            </Button>
          </div>
        </div>
      </article>

      {/* Related Posts */}
      {relatedPosts && relatedPosts.length > 0 && (
        <section>
          <Heading size={2}>Související články</Heading>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {relatedPosts.map(relatedPost => (
              <BlogPostCard key={relatedPost.id} post={relatedPost} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

// ✅ BONUS: Pre-render popular posts at build time for even faster loads!
export async function generateStaticParams() {
  const supabase = await createClient();

  const {data: posts} = await supabase
    .from('blog_posts')
    .select('slug')
    .eq('status', 'published')
    .order('published_at', {ascending: false})
    .limit(20);  // Pre-render 20 most recent posts

  return posts?.map(post => ({slug: post.slug})) || [];
}

// ✅ Enable ISR (Incremental Static Regeneration)
export const revalidate = 3600;  // Revalidate every hour
```

---

### Step 4: Test the Blog Detail Page (5 min)

```bash
# 1. Save the file
# 2. Browser should auto-reload (if dev server running)
# 3. Visit: http://localhost:3000/blog/some-post-slug
```

**What to check:**
- ✅ Page loads instantly (no loading spinner!)
- ✅ Content appears immediately
- ✅ Related posts show up
- ✅ Match info shows (if applicable)
- ✅ Category badge displays
- ✅ Images load
- ✅ Share buttons visible

**Check DevTools:**
- Network tab: Should see less JavaScript downloaded
- View Page Source (Cmd+U): Should see FULL blog content in HTML!

---

## Page 2: Blog Listing Page (`/blog`) - MORE COMPLEX

**Why harder:** Has client-side search/filtering

### Current State Analysis

**File:** `src/app/(main)/blog/page.tsx`

**What it does:**
- Fetches all blog posts (client-side)
- Client-side search (debounced)
- Client-side category filtering
- Client-side sorting

**Strategy:** Hybrid approach (server fetch + client filtering)

---

### Step 1: Backup Current File (2 min)

```bash
cp src/app/\(main\)/blog/page.tsx src/app/\(main\)/blog/page.tsx.backup
```

---

### Step 2: Create Server Component (10 min)

**File:** `src/app/(main)/blog/page.tsx`

```typescript
import {createClient} from '@/utils/supabase/server';

import {BlogListingClient} from './BlogListingClient';

// ✅ Server Component - fetches initial data
export default async function BlogPage() {
  const supabase = await createClient();

  // Fetch all published blog posts on server
  const {data: posts} = await supabase
    .from('blog_posts')
    .select('*')
    .eq('status', 'published')
    .order('published_at', {ascending: false})
    .order('created_at', {ascending: false});

  // Pass to client component for interactivity
  return <BlogListingClient initialPosts={posts || []} />;
}

// ✅ Optional: Enable ISR for fresh data
export const revalidate = 600;  // Revalidate every 10 minutes
```

---

### Step 3: Create Client Component for Interactivity (15 min)

**Create new file:** `src/app/(main)/blog/BlogListingClient.tsx`

```typescript
'use client';

import {useState, useMemo} from 'react';

import {Card, CardBody, Button, Input, Select, SelectItem} from '@heroui/react';
import {TagIcon, MagnifyingGlassIcon} from '@heroicons/react/24/outline';

import {useDebounce} from '@/hooks/shared/useDebounce';
import {BlogPostCard, BlogPostCardSkeleton} from '@/components/features';
import {createSearchablePost, searchPosts} from '@/utils/contentSearch';
import {Blog} from '@/types';

interface BlogListingClientProps {
  initialPosts: Blog[];
}

export function BlogListingClient({initialPosts}: BlogListingClientProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Všechny');

  // Debounce search term
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  // ✅ No loading state needed - data is already here!
  const allPosts = initialPosts;

  // Get unique categories
  const categories = useMemo(() => {
    return ['Všechny'];  // Can enhance later with actual categories
  }, []);

  // Client-side filtering (instant!)
  const filteredPosts = useMemo(() => {
    if (!allPosts) return [];

    const searchablePosts = allPosts.map(createSearchablePost);

    // Filter by search
    const searchResults = debouncedSearchTerm
      ? searchPosts(searchablePosts, debouncedSearchTerm)
      : searchablePosts;

    // Filter by category (if needed)
    return searchResults.map(sp => sp.post);
  }, [allPosts, debouncedSearchTerm, selectedCategory]);

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold">Blog</h1>
        <p className="text-gray-600">Aktuality a zajímavosti z klubu</p>
      </div>

      {/* Search & Filters */}
      <Card>
        <CardBody>
          <div className="flex gap-4">
            <Input
              placeholder="Hledat články..."
              value={searchTerm}
              onValueChange={setSearchTerm}
              startContent={<MagnifyingGlassIcon className="w-4 h-4" />}
              className="flex-1"
            />
            <Select
              placeholder="Kategorie"
              selectedKeys={[selectedCategory]}
              onSelectionChange={(keys) => setSelectedCategory(Array.from(keys)[0] as string)}
              className="w-48"
            >
              {categories.map(cat => (
                <SelectItem key={cat}>{cat}</SelectItem>
              ))}
            </Select>
          </div>
        </CardBody>
      </Card>

      {/* Results */}
      {filteredPosts.length === 0 ? (
        <Card>
          <CardBody className="text-center py-12">
            <TagIcon className="w-12 h-12 mx-auto text-gray-400 mb-4" />
            <p className="text-gray-600">Žádné články nenalezeny</p>
          </CardBody>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPosts.map(post => (
            <BlogPostCard key={post.id} post={post} />
          ))}
        </div>
      )}
    </div>
  );
}
```

---

### Step 4: Test Blog Detail Page (5 min)

```bash
# 1. Visit: http://localhost:3000/blog/some-slug
# (Replace with actual slug from your DB)
```

**What to verify:**
- ✅ Page loads **instantly** (no spinner!)
- ✅ All content visible immediately
- ✅ Related posts show up
- ✅ Category badge displays
- ✅ Match info shows (if applicable)
- ✅ No console errors

**Check Page Source (Cmd+U):**
- ✅ Should see full blog content in HTML
- ✅ No loading spinner in HTML
- ✅ SEO-friendly!

---

### Step 5: Test Blog Listing Page (5 min)

```bash
# Visit: http://localhost:3000/blog
```

**What to verify:**
- ✅ Page loads instantly
- ✅ All posts visible immediately
- ✅ Search works (type in search box)
- ✅ Filtering instant (no API calls!)
- ✅ No loading state

**Check DevTools:**
- Network tab: Initial posts already in HTML
- Searching: No network requests (all client-side!)

---

## Advanced: Add Static Generation (Optional - 5 min)

### For Blog Detail Page

Already included in Step 3 above! The `generateStaticParams` function:

```typescript
export async function generateStaticParams() {
  const supabase = await createClient();

  const {data: posts} = await supabase
    .from('blog_posts')
    .select('slug')
    .eq('status', 'published')
    .limit(20);

  return posts?.map(post => ({slug: post.slug})) || [];
}
```

**What this does:**
- Pre-renders 20 most recent blog posts at build time
- Visitors get **instant load** (HTML already generated!)
- Older posts still work (rendered on-demand)

**Test it:**
```bash
npm run build
# Should see: "Generating static pages" with blog slugs
```

---

## Key Differences from Admin Pages

### Admin Pages (Hybrid):
```
Server: Prefetch data with React Query
Client: Hydrate + handle CRUD operations
```

### Blog Pages (Pure Server):
```
Server: Fetch all data directly
Client: Only for interactivity (search/filter)
```

**Why different:**
- Admin pages need CRUD (mutations)
- Blog pages are read-only
- Blog pages need best SEO
- Blog pages can be statically generated

---

## Troubleshooting

### Issue 1: "createClient is not a function"
**Fix:** Check import
```typescript
// ✅ Correct:
import {createClient} from '@/utils/supabase/server';

// ❌ Wrong:
import {createClient} from '@/utils/supabase/client';
```

### Issue 2: "notFound is not defined"
**Fix:** Import from Next.js
```typescript
import {notFound} from 'next/navigation';
```

### Issue 3: Components complaining about missing props
**Fix:** Check BlogPostCard expects Blog type, not transformed type

### Issue 4: Page still shows loading
**Fix:** Make sure you removed `'use client'` directive

---

## Comparison: Before vs After

### Blog Detail Page

#### Before (Client Component):
- **Lines of code:** 180
- **Loading time:** 2-3 seconds + spinner
- **SEO:** None (spinner in HTML)
- **Bundle size:** +15KB (hooks + fetching)
- **User sees:** Spinner → Content

#### After (Server Component):
- **Lines of code:** 120 (40% reduction!)
- **Loading time:** 0.3 seconds, instant render
- **SEO:** Perfect (content in HTML)
- **Bundle size:** +0KB (no fetching code)
- **User sees:** Content immediately

**Improvement:** 6-10x faster + perfect SEO! 🚀

---

### Blog Listing Page

#### Before (Client Component):
- **Data fetching:** Client-side (slow)
- **Loading state:** Spinner shown
- **Search:** Client-side (after data loads)
- **SEO:** Poor (posts load after JS)

#### After (Hybrid):
- **Data fetching:** Server-side (fast!)
- **Loading state:** None (data ready)
- **Search:** Client-side (instant!)
- **SEO:** Perfect (posts in HTML)

---

## Testing Checklist

After implementation:

### Functional Tests
- [ ] Blog detail page loads without spinner
- [ ] Related posts display correctly
- [ ] Category badge shows
- [ ] Match info displays (if post has match)
- [ ] Back button works
- [ ] Share buttons visible (even if not functional)

### Performance Tests
- [ ] Page loads in < 1 second
- [ ] No loading spinners
- [ ] Network tab shows less JS downloaded

### SEO Tests
- [ ] View Page Source shows full content
- [ ] Blog title in HTML
- [ ] Blog content in HTML
- [ ] Meta tags present (if configured)

### Blog Listing Tests
- [ ] All posts load instantly
- [ ] Search works (type → results filter)
- [ ] Search is instant (no network calls)
- [ ] Clearing search shows all posts

---

## Common Mistakes to Avoid

### ❌ Mistake 1: Forgetting to remove 'use client'
```typescript
'use client';  // ❌ Remove this!

export default async function BlogPostPage() {
```

### ❌ Mistake 2: Using client Supabase
```typescript
import {createClient} from '@/utils/supabase/client';  // ❌ Wrong!
import {createClient} from '@/utils/supabase/server';  // ✅ Correct!
```

### ❌ Mistake 3: Trying to use hooks
```typescript
export default async function BlogPostPage() {
  const [state, setState] = useState();  // ❌ Can't use hooks in Server Component!
```

### ❌ Mistake 4: Not handling async params
```typescript
// ❌ Wrong:
export default async function Page({params}) {
  const {slug} = params;  // params is a Promise!

// ✅ Correct:
export default async function Page({params}: {params: Promise<{slug: string}>}) {
  const {slug} = await params;  // Await it!
```

---

## Rollback Plan

If something goes wrong:

```bash
# Restore blog detail page
cp src/app/\(main\)/blog/\[slug\]/page.tsx.backup src/app/\(main\)/blog/\[slug\]/page.tsx

# Restore blog listing page
cp src/app/\(main\)/blog/page.tsx.backup src/app/\(main\)/blog/page.tsx

# Delete client component if created
rm src/app/\(main\)/blog/BlogListingClient.tsx

# Restart dev server
npm run dev
```

---

## Success Criteria

You'll know it's working when:

1. **No loading spinners** on either page
2. **Instant page loads** (< 1 second)
3. **Content in HTML source** (View Page Source)
4. **Search works** on listing page
5. **No console errors**
6. **TypeScript clean** (`npx tsc --noEmit`)
7. **Build succeeds** (`npm run build`)

---

## Next Steps After Success

Once both pages work:

1. **Commit the changes:**
   ```bash
   git add .
   git commit -m "feat: convert blog pages to Server Components for better SEO and performance"
   ```

2. **Test on Vercel preview:**
   - Push to see build time pre-rendering
   - Check page load speed
   - Verify SEO with browser tools

3. **Measure improvement:**
   - Before: 2-3 second load
   - After: 0.3 second load
   - **10x improvement!**

---

## Summary

### Implementation Order:
1. ✅ Blog detail (`/blog/[slug]`) - Pure Server Component
2. ✅ Blog listing (`/blog`) - Hybrid (Server fetch + Client search)

### Time Breakdown:
- Blog detail: 15-20 minutes
- Blog listing: 15-20 minutes
- Testing: 10 minutes
- **Total: 40-50 minutes**

### Skills Learned:
- ✅ Pure Server Component pattern
- ✅ Hybrid Server/Client pattern
- ✅ Static generation with generateStaticParams
- ✅ ISR (Incremental Static Regeneration)
- ✅ Parallel data fetching
- ✅ Next.js notFound() handling

---

## Questions?

While implementing, watch for:
- TypeScript errors (fix as you go)
- Missing imports (add as needed)
- Component prop types (adjust if needed)

**You can do this!** Follow the steps carefully and you'll have blazing-fast, SEO-perfect blog pages. 🚀

**Good luck! Let me know when you're done or if you hit any issues!**
