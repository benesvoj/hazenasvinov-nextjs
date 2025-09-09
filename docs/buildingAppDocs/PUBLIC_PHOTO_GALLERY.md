# Public Photo Gallery Page

This document describes the public photo gallery page that allows visitors to browse albums and view photos.

## Overview

The public photo gallery page (`/photo-gallery`) provides a user-friendly interface for visitors to:
- Browse all public photo albums
- Search through albums by title or description
- View photos within selected albums
- Click on photos to view them in full size
- Navigate between photos using keyboard or mouse controls

## Features

### 🖼️ **Album Browsing**
- Grid layout of all public albums
- Album cover images (or placeholder if no cover)
- Photo count badges
- Album titles and descriptions
- Creation dates
- Hover effects and smooth transitions

### 🔍 **Search Functionality**
- Real-time search through album titles and descriptions
- Responsive search input with magnifying glass icon
- Instant filtering of results

### 📸 **Photo Viewing**
- Responsive grid layout (1-4 columns based on screen size)
- Click any photo to open full-size viewer
- Photo information overlay on hover
- Featured photo badges
- Photo titles and descriptions

### 🖱️ **Photo Viewer Modal**
- Full-screen photo viewing experience
- Navigation between photos (previous/next)
- Keyboard shortcuts (arrow keys, escape)
- Photo metadata display
- Loading states and smooth transitions

## User Experience

### **Navigation Flow**
1. **Landing**: Users see a beautiful header with search functionality
2. **Album Selection**: Browse through available albums in a grid
3. **Photo Browsing**: Click an album to view its photos
4. **Photo Viewing**: Click any photo to open the full viewer
5. **Navigation**: Use arrows or keyboard to browse through photos

### **Responsive Design**
- Mobile-first approach
- Adaptive grid layouts
- Touch-friendly interactions
- Optimized for all screen sizes

### **Accessibility**
- Keyboard navigation support
- Screen reader friendly
- High contrast mode support
- Semantic HTML structure

## Technical Implementation

### **Components**
- `PhotoGalleryPage`: Main page component
- `AlbumCard`: Individual album display
- `PhotoGrid`: Photo grid layout
- `PhotoViewerModal`: Full-size photo viewer

### **State Management**
- Albums and photos data
- Selected album and photo tracking
- Modal open/close states
- Search term filtering

### **Data Flow**
1. Load public albums from Supabase
2. Filter albums based on search term
3. Load photos for selected album
4. Handle photo selection and modal display

## URL Structure

```
/photo-gallery
├── Main page with album grid
├── Album selection
├── Photo grid view
└── Photo viewer modal
```

## Integration

### **Navigation**
- Automatically appears in main navigation
- Accessible via **Fotogalerie** menu item
- Integrated with existing routing system

### **Database**
- Uses existing photo gallery tables
- Only displays public albums (`is_public = true`)
- Leverages existing Supabase infrastructure

### **Styling**
- Consistent with site design language
- Hero UI components throughout
- Dark mode support
- Gradient backgrounds and modern aesthetics

## Future Enhancements

- [ ] Photo sharing functionality
- [ ] Social media integration
- [ ] Photo download options
- [ ] Advanced filtering (by date, category)
- [ ] Slideshow mode
- [ ] Photo comments system
- [ ] User favorites
- [ ] Mobile app integration

## Usage Examples

### **For Visitors**
1. Navigate to `/photo-gallery`
2. Browse available albums
3. Use search to find specific content
4. Click albums to view photos
5. Click photos for full-size viewing
6. Use navigation controls to browse photos

### **For Content Managers**
1. Create albums in admin panel
2. Upload photos to albums
3. Set album visibility (public/private)
4. Organize photos with titles and descriptions
5. Mark important photos as featured

## Performance Considerations

- Lazy loading of photos
- Optimized image sizes
- Efficient database queries
- Minimal re-renders
- Smooth animations and transitions

## Browser Support

- Modern browsers (Chrome, Firefox, Safari, Edge)
- Mobile browsers (iOS Safari, Chrome Mobile)
- Progressive enhancement approach
- Graceful degradation for older browsers
