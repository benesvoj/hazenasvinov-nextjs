# Clubs Navigation Feature

This feature adds navigation capabilities to the club detail page, allowing administrators to easily move between clubs without returning to the clubs list.

## 🚀 **Features**

### **1. Previous/Next Navigation**
- **Previous Club Button**: Navigate to the previous club in alphabetical order
- **Next Club Button**: Navigate to the next club in alphabetical order
- **Smart Disabling**: Buttons are disabled when at the beginning/end of the list

### **2. Keyboard Navigation**
- **Left Arrow (←)**: Navigate to previous club
- **Right Arrow (→)**: Navigate to next club
- **Smart Input Handling**: Keyboard navigation is disabled when typing in input fields

### **3. Quick Jump Dropdown**
- **Searchable List**: Dropdown with all clubs for quick navigation
- **Current Selection**: Shows the currently selected club
- **Instant Navigation**: Click any club to jump directly to it

### **4. Position Indicator**
- **Current Position**: Shows "X z Y" format (e.g., "3 z 15")
- **Keyboard Hint**: Displays "(← → pro navigaci)" to inform users about keyboard shortcuts

## 🎯 **User Experience**

### **Navigation Flow**
1. **Browse Clubs**: Use previous/next buttons to move through clubs sequentially
2. **Quick Access**: Use the dropdown to jump to any specific club
3. **Keyboard Shortcuts**: Use arrow keys for hands-free navigation
4. **Visual Feedback**: Clear indication of current position and available navigation options

### **Responsive Design**
- **Desktop**: Horizontal layout with all elements in one row
- **Tablet**: Center section stacks vertically, navigation buttons remain horizontal
- **Mobile**: Full vertical stacking for optimal mobile experience

## 🔧 **Technical Implementation**

### **Components**
- **`ClubsNavigation`**: Main navigation component
- **`useClubsNavigation`**: Custom hook for fetching clubs and navigation logic

### **Data Flow**
1. Hook fetches all clubs ordered by name
2. Finds current club position in the list
3. Calculates previous/next club availability
4. Provides navigation data to component

### **Performance Optimizations**
- **Memoized Data**: Clubs list is fetched once and cached
- **Prefetching**: Next.js prefetching for smooth navigation
- **Efficient Updates**: Only re-renders when necessary

## 📱 **Usage Examples**

### **Sequential Navigation**
```
Club A → Club B → Club C → Club D
   ↑        ↑        ↑        ↑
Previous  Current  Current  Next
```

### **Quick Jump**
```
[Přejít na klub... ▼]
├── Club A
├── Club B ← Current
├── Club C
└── Club D
```

### **Keyboard Shortcuts**
```
← Previous Club    → Next Club
```

## 🎨 **Design Features**

### **Visual Hierarchy**
- **Primary Actions**: Previous/Next buttons with clear labels
- **Secondary Actions**: Quick jump dropdown for power users
- **Information Display**: Position indicator with keyboard hints

### **Accessibility**
- **Screen Reader Support**: Proper ARIA labels and descriptions
- **Keyboard Navigation**: Full keyboard accessibility
- **Visual Indicators**: Clear button states and disabled states

### **Responsive Breakpoints**
- **lg+**: Full horizontal layout
- **sm-lg**: Center section stacks, buttons remain horizontal
- **<sm**: Full vertical stacking

## 🔄 **State Management**

### **Loading States**
- Shows "Načítání navigace..." while fetching clubs
- Graceful fallback if navigation data fails to load

### **Error Handling**
- Displays error messages if clubs cannot be fetched
- Continues to work if navigation fails (falls back to basic functionality)

### **Empty States**
- Hides navigation if no clubs are available
- Handles edge cases gracefully

## 🚀 **Future Enhancements**

### **Potential Improvements**
- **Search Functionality**: Add search within the quick jump dropdown
- **Recent Clubs**: Remember last visited clubs for quick access
- **Favorite Clubs**: Allow users to mark frequently accessed clubs
- **Bulk Operations**: Navigate through clubs while performing bulk actions

### **Performance Optimizations**
- **Virtual Scrolling**: For very large club lists
- **Caching Strategy**: Implement more sophisticated caching
- **Lazy Loading**: Load clubs in chunks for better performance

## 📝 **Configuration**

### **Customization Options**
- **Button Sizes**: Adjust button sizes via CSS classes
- **Color Schemes**: Modify colors through Tailwind classes
- **Layout Options**: Adjust responsive breakpoints as needed

### **Integration Points**
- **Club Detail Page**: Automatically integrated into club detail views
- **Admin Layout**: Consistent with admin panel design patterns
- **Navigation System**: Extends existing admin navigation capabilities
