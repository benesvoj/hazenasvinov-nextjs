# Blog Post Modal Completion Plan

## Overview
This document outlines the implementation plan for completing the BlogPostModal component by adding:
1. Match selection functionality
2. Image upload functionality

## Current State Analysis

### ✅ What Exists
- **BlogPostModal component** (`src/app/admin/posts/components/BlogPostModal.tsx`)
  - Basic form fields (title, slug, author, status, category, content)
  - Uses `useBlogPostForm` hook for state management
  - Commented-out code for match selection and image upload

- **MatchSelectionModal component** (`src/app/admin/posts/components/MatchSelectionModal.tsx`)
  - Fully functional modal for selecting matches
  - Filters by category and active season
  - Takes: `isOpen`, `onClose`, `onSelect`, `selectedMatchId`, `categoryId`

- **Storage utilities** (`src/utils/supabase/storage.ts`)
  - `uploadClubAsset(file, path)` - uploads to 'club-assets' bucket
  - `deleteClubAsset(path)` - removes file from storage
  - `getClubAssetUrl(path)` - gets public URL

- **Blog schema** (`src/types/entities/blog/schema/blogPostsSchema.ts`)
  - `match_id: string | null`
  - `image_url: string | null`

- **Reference implementation** (`src/app/admin/photo-gallery/components/PhotoUploadModal.tsx`)
  - Shows sophisticated upload pattern with progress tracking

### ❌ What's Missing
1. **Auto-slug generation** - Missing `generateSlug` utility integration
2. Match selection state management in `useBlogPostForm` hook
3. Image upload state management in `useBlogPostForm` hook
4. Integration of MatchSelectionModal in BlogPostModal (UI exists but handler broken)
5. Image upload UI and logic in BlogPostModal (UI exists but handlers missing)
6. Image validation (file size, type)

### 🐛 Current Bugs
1. **Line 168 in BlogPostModal**: `onPress={() => blogPostForm.openMatchModal}` - missing `()` to call function
2. **No slug auto-generation**: When user types title, slug should auto-generate

## Architecture Decisions

### State Management Pattern
Following the established pattern where state is managed in the form hook and passed to the modal:

```
useBlogPostForm (hook)
  ├─ formData (existing)
  ├─ selectedMatch (NEW)
  ├─ imageFile (NEW)
  ├─ imagePreview (NEW)
  ├─ isMatchModalOpen (NEW)
  └─ uploadingImage (NEW)
```

### File Storage Pattern
Blog post images stored in `club-assets` bucket (consistent with photo gallery):
- Path: `blog-posts/{blog_id}/{timestamp}_{filename}`
- Uses existing `uploadClubAsset()` utility
- Bucket: `club-assets` (shared with photo-gallery, club-logos, etc.)

## Implementation Plan

### Phase 1: Enhance `useBlogPostForm` Hook

**File:** `src/hooks/entities/blog/state/useBlogPostForm.ts`

#### 1.1 Add Imports

```typescript
import {Match} from "@/types";
import {generateSlug} from "@/utils/slugGenerator";
```

#### 1.2 Add New State Variables

```typescript
// Add to hook state
const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
const [imageFile, setImageFile] = useState<File | null>(null);
const [imagePreview, setImagePreview] = useState<string>('');
const [isMatchModalOpen, setIsMatchModalOpen] = useState(false);
const [uploadingImage, setUploadingImage] = useState(false);
```

#### 1.3 Add Slug Auto-Generation Handler

```typescript
/**
 * Update form data with auto-slug generation
 * When title changes, automatically generate slug
 */
const updateFormData = useCallback((updates: Partial<BlogFormData>) => {
  setFormData(prev => {
    const newData = { ...prev, ...updates };

    // Auto-generate slug when title changes
    if (updates.title !== undefined) {
      newData.slug = generateSlug(updates.title);
    }

    return newData;
  });
}, []);
```

#### 1.4 Update `openEditMode` Function

```typescript
const openEditMode = useCallback((item: Blog) => {
  setModalMode(ModalMode.EDIT);
  setSelectedPost(item);
  const {id, created_at, updated_at, ...editableFields} = item;
  setFormData(editableFields);

  // NEW: Set image preview if exists
  if (item.image_url) {
    setImagePreview(item.image_url);
  }

  // NEW: Fetch and set match if exists (optional - could be lazy loaded)
  // This would require a useFetchMatchById hook or similar
  if (item.match_id) {
    // TODO: Fetch match details if needed for display
  }
}, []);
```

#### 1.5 Update `resetForm` Function

```typescript
const resetForm = useCallback(() => {
  setFormData(initialFormData);
  setSelectedPost(null);
  setModalMode(ModalMode.ADD);

  // NEW: Reset image and match state
  setSelectedMatch(null);
  setImageFile(null);
  setImagePreview('');
  setIsMatchModalOpen(false);
  setUploadingImage(false);
}, []);
```

#### 1.6 Add Match Selection Handlers

```typescript
const handleMatchSelect = useCallback((match: Match | null) => {
  setSelectedMatch(match);
  setFormData(prev => ({
    ...prev,
    match_id: match?.id || ''
  }));
}, []);

const openMatchModal = useCallback(() => {
  setIsMatchModalOpen(true);
}, []);

const closeMatchModal = useCallback(() => {
  setIsMatchModalOpen(false);
}, []);
```

#### 1.7 Add Image Handlers

```typescript
const handleImageFileChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
  const file = event.target.files?.[0];
  if (!file) return;

  // Validate file type
  if (!file.type.startsWith('image/')) {
    // TODO: Show toast error
    console.error('Selected file is not an image');
    return;
  }

  // Validate file size (5MB limit)
  const MAX_SIZE = 5 * 1024 * 1024; // 5MB
  if (file.size > MAX_SIZE) {
    // TODO: Show toast error
    console.error('Image size exceeds 5MB limit');
    return;
  }

  setImageFile(file);

  // Create preview URL
  const reader = new FileReader();
  reader.onloadend = () => {
    setImagePreview(reader.result as string);
  };
  reader.readAsDataURL(file);
}, []);

const handleRemoveImage = useCallback(() => {
  setImageFile(null);
  setImagePreview('');
  setFormData(prev => ({
    ...prev,
    image_url: ''
  }));
}, []);
```

#### 1.8 Update Return Object

```typescript
return {
  formData,
  setFormData,           // Keep for direct updates (status, category, etc.)
  updateFormData,        // NEW: Use for title changes (auto-generates slug)
  selectedPost,
  modalMode,
  openAddMode,
  openEditMode,
  resetForm,
  validateForm,

  // NEW: Match selection
  selectedMatch,
  handleMatchSelect,
  isMatchModalOpen,
  openMatchModal,
  closeMatchModal,

  // NEW: Image upload
  imageFile,
  imagePreview,
  uploadingImage,
  setUploadingImage,
  handleImageFileChange,
  handleRemoveImage,
};
```

**Important:** Export both `setFormData` (for simple updates) and `updateFormData` (for title changes with auto-slug).

### Phase 2: Update BlogPostModal Component

**File:** `src/app/admin/posts/components/BlogPostModal.tsx`

#### 2.1 Add Import for MatchSelectionModal

```typescript
import MatchSelectionModal from './MatchSelectionModal';
import {XMarkIcon, PhotoIcon} from '@heroicons/react/24/outline';
import Image from 'next/image';
```

#### 2.2 Fix Title Input to Use Auto-Slug Generation

**Current (line 65-68):**
```typescript
<Input
  label="Název článku"
  placeholder="Zadejte název článku"
  value={blogPostForm.formData.title}
  onChange={(e) => blogPostForm.setFormData({
    ...blogPostForm.formData,
    title: e.target.value
  })}
  isRequired
/>
```

**Replace with:**
```typescript
<Input
  label="Název článku"
  placeholder="Zadejte název článku"
  value={blogPostForm.formData.title}
  onChange={(e) => blogPostForm.updateFormData({ title: e.target.value })}
  isRequired
/>
```

**Why:** Using `updateFormData` instead of `setFormData` triggers auto-slug generation.

#### 2.3 Fix Match Modal Button Handler

**Current (line 168):**
```typescript
onPress={() => blogPostForm.openMatchModal}  // ❌ Missing ()
```

**Replace with:**
```typescript
onPress={blogPostForm.openMatchModal}  // ✅ Correct
```

**Why:** The function reference is passed directly since `openMatchModal` doesn't need parameters.

#### 2.4 Update Match Selection Section (Already Uncommented)

The match selection UI is already in place (lines 137-179), but needs the button fix from step 2.3.

```typescript
{/* Match Selection (Optional) */}
<div>
  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
    Související zápas (volitelné)
  </label>
  {blogPostForm.selectedMatch ? (
    <div className="p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-800">
      <div className="flex items-center justify-between">
        <div>
          <div className="font-medium text-gray-900 dark:text-white">
            {blogPostForm.selectedMatch.home_team.name} vs {blogPostForm.selectedMatch.away_team.name}
          </div>
          <div className="text-sm text-gray-500">
            {blogPostForm.selectedMatch.competition} • {formatDateString(blogPostForm.selectedMatch.date)}
          </div>
        </div>
        <Button
          size="sm"
          variant="light"
          color="danger"
          onPress={() => blogPostForm.handleMatchSelect(null)}
        >
          Odstranit
        </Button>
      </div>
    </div>
  ) : (
    <Button
      variant="bordered"
      startContent={<MagnifyingGlassIcon className="w-4 h-4"/>}
      onPress={blogPostForm.openMatchModal}
      className="w-full justify-start"
      isDisabled={!blogPostForm.formData.category_id}
    >
      Vybrat zápas
    </Button>
  )}
  <p className="text-xs text-gray-500 mt-1">
    {!blogPostForm.formData.category_id
      ? 'Nejdříve vyberte kategorii'
      : 'Vyberte zápas pro propojení s článkem'}
  </p>
</div>
```

#### 2.5 Update Image Upload Section (Already Uncommented)

The image upload UI is already in place (lines 181-240). No changes needed - it already references:
- `blogPostForm.imagePreview`
- `blogPostForm.imageFile`
- `blogPostForm.handleImageFileChange`
- `blogPostForm.handleRemoveImage`
- `blogPostForm.uploadingImage`

These handlers will be added in Phase 1.

```typescript
{/* Image Upload */}
<div>
  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
    Obrázek článku
  </label>

  {blogPostForm.imagePreview ? (
    <div className="space-y-3">
      <div className="relative w-full h-48 bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden flex items-center justify-center">
        <Image
          src={blogPostForm.imagePreview}
          alt="Preview"
          width={200}
          height={200}
          className="object-cover"
        />
        <Button
          onPress={blogPostForm.handleRemoveImage}
          className="absolute top-2 right-2"
          title="Odstranit obrázek"
          radius="full"
          size="sm"
          color="danger"
          variant="flat"
          isIconOnly
          aria-label="Odstranit obrázek"
          startContent={<XMarkIcon className="h-4 w-4"/>}
        />
      </div>
      <p className="text-xs text-gray-500">
        {blogPostForm.imageFile
          ? 'Obrázek bude nahrán při uložení článku'
          : 'Stávající obrázek'}
      </p>
    </div>
  ) : (
    <div className="space-y-3">
      <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center hover:border-gray-400 dark:hover:border-gray-500 transition-colors">
        <PhotoIcon className="mx-auto h-12 w-12 text-gray-400"/>
        <div className="mt-2">
          <label htmlFor="image-upload" className="cursor-pointer">
            <span className="text-sm font-medium text-blue-600 hover:text-blue-500">
              Nahrajte obrázek
            </span>
            <span className="text-gray-500"> nebo přetáhněte</span>
          </label>
          <input
            id="image-upload"
            type="file"
            className="hidden"
            accept="image/*"
            onChange={blogPostForm.handleImageFileChange}
            disabled={blogPostForm.uploadingImage}
          />
        </div>
        <p className="text-xs text-gray-500 mt-1">PNG, JPG, GIF do 5MB</p>
      </div>
    </div>
  )}
</div>
```

#### 2.6 Verify MatchSelectionModal Integration

The MatchSelectionModal is already integrated (lines 263-269). No changes needed:

```typescript
<MatchSelectionModal
  isOpen={blogPostForm.isMatchModalOpen}
  onClose={blogPostForm.closeMatchModal}
  onSelect={blogPostForm.handleMatchSelect}
  selectedMatchId={blogPostForm.selectedMatch?.id}
  categoryId={blogPostForm.formData.category_id || undefined}
/>
```

### Phase 3: Update Submit Handler in page.tsx.backup

**File:** `src/app/admin/posts/page.tsx.backup`

#### 3.1 Update `handleSubmitPost` Function

```typescript
const handleSubmitPost = async () => {
  const {valid, errors} = blogPostForm.validateForm();

  if (!valid) {
    errors.forEach(error => showToast.danger(error));
    return;
  }

  let imageUrl = blogPostForm.formData.image_url;

  // Upload new image if file is selected
  if (blogPostForm.imageFile) {
    blogPostForm.setUploadingImage(true);

    const timestamp = Date.now();
    const fileExtension = blogPostForm.imageFile.name.split('.').pop();
    const fileName = `${timestamp}.${fileExtension}`;
    const blogId = blogPostForm.selectedPost?.id || 'new';
    const filePath = `blog-posts/${blogId}/${fileName}`;

    const uploadResult = await uploadClubAsset(blogPostForm.imageFile, filePath);

    if (uploadResult.error) {
      showToast.danger('Nepodařilo se nahrát obrázek');
      blogPostForm.setUploadingImage(false);
      return;
    }

    imageUrl = uploadResult.url;
    blogPostForm.setUploadingImage(false);
  }

  let success = false;

  if (blogPostForm.modalMode === ModalMode.ADD) {
    const insertData: BlogPostInsert = {
      ...blogPostForm.formData,
      image_url: imageUrl || null,
    };
    success = await createBlog(insertData);
  } else {
    if (!blogPostForm.selectedPost) return;
    success = await updateBlog(blogPostForm.selectedPost.id, {
      id: blogPostForm.selectedPost.id,
      ...blogPostForm.formData,
      image_url: imageUrl || null,
    });
  }

  if (success) {
    await refetchBlog();
    blogPostForm.resetForm();
    onModalClose();
  }
};
```

#### 3.2 Add Import for Storage Utility

```typescript
import {uploadClubAsset} from '@/utils/supabase/storage';
```

#### 3.3 Update BlogPostModal Props

```typescript
<BlogPostModal
  isOpen={isModalOpen}
  onClose={onModalClose}
  onSubmit={handleSubmitPost}
  mode={blogPostForm.modalMode}
  categories={categories || []}
  categoriesLoading={categoriesLoading}
  blogPostForm={blogPostForm}  // Already passed ✓
/>
```

## Testing Checklist

### Match Selection
- [ ] Click "Vybrat zápas" button
- [ ] Verify modal opens with matches filtered by category
- [ ] Select a match and verify it displays correctly
- [ ] Click "Odstranit" and verify match is cleared
- [ ] Verify button is disabled when no category is selected
- [ ] Verify match_id is saved to database on submit

### Image Upload
- [ ] Click image upload area
- [ ] Select valid image (< 5MB, PNG/JPG/GIF)
- [ ] Verify image preview appears
- [ ] Click remove button and verify image is cleared
- [ ] Try uploading file > 5MB and verify error
- [ ] Try uploading non-image file and verify error
- [ ] Submit form and verify image is uploaded to storage
- [ ] Verify image_url is saved to database
- [ ] Edit existing post with image and verify preview shows
- [ ] Replace image in edit mode and verify old/new handling

### Integration
- [ ] Create new blog post with match and image
- [ ] Edit blog post and change match
- [ ] Edit blog post and change image
- [ ] Edit blog post and remove match
- [ ] Edit blog post and remove image
- [ ] Verify form reset clears all state
- [ ] Verify validation still works
- [ ] Test with different categories

## Edge Cases to Handle

1. **Image Upload Failure**
   - Show error toast
   - Don't save blog post if image upload fails
   - Allow user to retry or continue without image

2. **Large Image Files**
   - Consider adding client-side image compression
   - Show file size in preview

3. **Match Selection Without Category**
   - Disable match selection button
   - Show helpful message

4. **Edit Mode Image Handling**
   - Show existing image from URL
   - Only upload new image if file is selected
   - Consider deleting old image from storage (optional)

5. **Concurrent Operations**
   - Disable submit button during image upload
   - Show loading state

## Future Enhancements

1. **Image Optimization**
   - Client-side compression before upload
   - Multiple image sizes (thumbnail, full)
   - WebP format support

2. **Drag and Drop**
   - Add drag-and-drop for image upload
   - Visual feedback during drag

3. **Image Cropping**
   - Add crop tool for consistent aspect ratios
   - Preview different crop sizes

4. **Multiple Images**
   - Support for image galleries
   - Featured image selection

5. **Match Preview**
   - Show match result if completed
   - Show team logos

## Notes

- The implementation follows the established pattern where `useBlogPostForm` manages all state
- Image upload happens before blog post creation/update to ensure data consistency
- Match selection requires category to filter matches appropriately
- All UI components use HeroUI library for consistency
- Error handling should show user-friendly toast messages

## Related Files

- `src/hooks/entities/blog/state/useBlogPostForm.ts` - Form state management
- `src/app/admin/posts/components/BlogPostModal.tsx` - Main modal component
- `src/app/admin/posts/page.tsx.backup` - Parent page with submit handler
- `src/app/admin/posts/components/MatchSelectionModal.tsx` - Match selection modal
- `src/utils/supabase/storage.ts` - Storage utilities
- `src/types/entities/blog/schema/blogPostsSchema.ts` - Type definitions

## Current Implementation Status

### ✅ Already Implemented (Fixed in Previous Session)
- BlogPostModal receives `blogPostForm` as prop (no duplicate hook instances)
- Match selection UI is uncommented and integrated
- Image upload UI is uncommented and integrated
- MatchSelectionModal is properly connected

### 🔧 Needs Implementation (This Session)
1. Add slug auto-generation to `useBlogPostForm`
2. Fix button handler bug (line 168)
3. Add match selection state & handlers to `useBlogPostForm`
4. Add image upload state & handlers to `useBlogPostForm`
5. Update page.tsx.backup submit handler to upload images

### 📝 Implementation Summary

**Phase 1:** Enhance `useBlogPostForm` hook (~60 min)
- Add slug auto-generation with `generateSlug` utility
- Add match selection state and handlers
- Add image upload state and handlers

**Phase 2:** Fix BlogPostModal bugs (~15 min)
- Fix title input to use `updateFormData`
- Fix match button handler

**Phase 3:** Update page.tsx.backup submit handler (~30 min)
- Add image upload logic before create/update
- Handle upload errors gracefully

**Total Estimated Time:** ~1h 45min

## Anti-Pattern Warning

⚠️ **Important:** This implementation corrects the previous anti-pattern where `useBlogPostForm` was instantiated in both the parent component and the modal component, causing state to not be shared. The hook is now instantiated ONLY in the parent (`page.tsx.backup`) and passed to the modal as a prop.

This ensures:
- Single source of truth for form state
- Edit mode data properly loads
- State changes are reflected across all components
- No duplicate hook instances
- Auto-slug generation works correctly