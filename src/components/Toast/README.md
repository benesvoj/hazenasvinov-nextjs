# Unified Toast System

This component provides a consistent way to show success, danger, and warning toasts across the entire application using HeroUI's toast system.

## Usage

### Import the toast functions

```tsx
import { showToast } from "@/components/Toast";
// or
import { useToast } from "@/components/Toast";
```

### Basic Usage

```tsx
// Success toast
showToast.success("Operation completed successfully!");

// Danger/Error toast
showToast.danger("Something went wrong!");

// Warning toast
showToast.warning("Please check your input.");
```

### Using the hook in components

```tsx
function MyComponent() {
  const toast = useToast();
  
  const handleSuccess = () => {
    toast.success("Success message");
  };
  
  const handleError = () => {
    toast.danger("Error message");
  };
  
  return (
    <div>
      <button onClick={handleSuccess}>Show Success</button>
      <button onClick={handleError}>Show Error</button>
    </div>
  );
}
```

### Custom options

```tsx
// Custom title and duration
showToast.success("Data saved!", {
  title: "Custom Title",
  duration: 3000
});

// Custom danger toast
showToast.danger("Validation failed", {
  title: "Form Error",
  duration: 10000
});
```

### Custom toast type

```tsx
import { showToast, ToastType } from "@/components/Toast";

const toastType: ToastType = "warning";
showToast.custom(toastType, "Custom warning message");
```

## Toast Types

- **Success**: Green toast with "Úspěch" title (5 seconds)
- **Danger**: Red toast with "Chyba" title (7 seconds)  
- **Warning**: Yellow toast with "Upozornění" title (6 seconds)

## Default Configuration

- **Success**: Green color, 5 second duration
- **Danger**: Red color, 7 second duration
- **Warning**: Yellow color, 6 second duration

## Benefits

1. **Consistent styling** across the application
2. **Unified API** for all toast types
3. **Type safety** with TypeScript
4. **Easy to maintain** - change styles in one place
5. **HeroUI integration** - uses the official toast system
