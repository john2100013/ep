# Header Component Documentation

## Overview

The `Header` component is a modern, reusable navigation component that replaces the old `Navbar` component. It provides a professional header with responsive design, user menu, mobile drawer navigation, and business branding.

## Location

`frontend/src/components/Header.tsx`

## Features

### 🎨 Design Improvements

- **Modern Gradient AppBar**: Blue gradient background with subtle shadows
- **Enhanced Typography**: Clear visual hierarchy with brand name and business info
- **Responsive Design**: 
  - Desktop: Full navigation menu in header
  - Tablet: Condensed menu with drawer
  - Mobile: Hamburger menu with full-screen drawer
- **User Avatar**: Dynamic initials-based avatar with hover effects
- **Business Badge**: Display business name in header (desktop view)
- **Smooth Transitions**: All interactive elements have animations

### 🧭 Navigation

Complete navigation menu with all major sections:
- Dashboard
- Invoices
- Quotations
- Items
- Accounts
- Goods Return
- Damage Tracking
- Analytics
- Settings

### 📱 Responsive Features

| Device | Behavior |
|--------|----------|
| **Desktop (>960px)** | Full navigation menu in AppBar, business badge visible |
| **Tablet (600-960px)** | Hamburger menu, condensed layout |
| **Mobile (<600px)** | Full mobile drawer with all navigation items |

### 👤 User Menu

Dropdown menu with:
- User name and email
- Settings link
- Logout button
- Professional styling with hover effects

### 🎯 Mobile Navigation Drawer

Left-side drawer containing:
- All navigation items with icons
- User information
- Logout button
- Smooth animations

## Usage

### Basic Implementation

```tsx
import Header from './components/Header';

function App() {
  return (
    <Box>
      <Header />
      {/* Rest of your app content */}
    </Box>
  );
}
```

### With Custom Title

```tsx
<Header title="My Custom Title" />
```

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `title` | string | `'Invoice App'` | The main header title/brand name |

## Component Structure

### Main Sections

1. **AppBar Container**
   - Sticky positioning
   - Gradient background
   - Container with max-width

2. **Toolbar Layout**
   - Left: Logo and brand
   - Center: Navigation menu (desktop only)
   - Right: User menu and avatar

3. **User Menu Dropdown**
   - User information
   - Settings option
   - Logout button

4. **Mobile Drawer**
   - Full navigation list
   - User section
   - Responsive width

## Styling Details

### Colors

- **Primary Blue**: `#0066ff`
- **Darker Blue**: `#0052cc`
- **Background**: `linear-gradient(135deg, #0066ff 0%, #0052cc 100%)`
- **Hover**: `rgba(255, 255, 255, 0.15)`

### Typography

- **Title**: h6 variant, 700 weight, responsive size
- **User Name**: body2, 600 weight
- **Email**: caption variant
- **Menu Items**: 0.875rem, 500 weight

### Spacing

- Container max-width: `lg` (1280px)
- Toolbar padding: Vertical 1, disables gutters
- Gap between elements: 0.5rem to 2rem

## Icons Used

- **ShopIcon**: Brand/logo icon
- **MenuIcon**: Mobile menu toggle
- **DashboardIcon**: Dashboard link
- **Receipt, Description**: Invoice/Quotation icons
- **Inventory**: Items icon
- **AccountBalance**: Financial accounts icon
- **AssignmentReturn**: Goods return icon
- **ErrorOutline**: Damage tracking icon
- **BarChart**: Analytics icon
- **Settings**: Settings icon
- **AccountCircle**: User account icon
- **ExitToApp**: Logout icon

## Responsive Breakpoints

- **Mobile**: < 600px
- **Tablet**: 600px - 960px
- **Desktop**: > 960px

## Integration

### Replaced Old Navbar

The `Header` component replaces the old `Navbar` component throughout the application.

**Before:**
```tsx
import Navbar from './components/Navbar';

function App() {
  return <Navbar />;
}
```

**After:**
```tsx
import Header from './components/Header';

function App() {
  return <Header />;
}
```

### Current Integration

Already integrated in `frontend/src/App.tsx`:

```tsx
import Header from './components/Header';

function App() {
  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#f8f9fa' }}>
      <Header />
      <Routes>
        {/* routes */}
      </Routes>
    </Box>
  );
}
```

## Key Improvements Over Old Navbar

| Feature | Old Navbar | New Header |
|---------|-----------|-----------|
| Design | Basic blue bar | Modern gradient design |
| Mobile Navigation | Limited | Full mobile drawer |
| Business Display | Text only | Badge + tooltip |
| User Avatar | Icon only | Avatar with initials |
| Animations | None | Smooth transitions |
| Mobile Drawer | None | Full drawer with all items |
| Responsive | Basic | Advanced breakpoints |
| Settings Access | Menu only | Menu + drawer |
| Business Badge | Hidden on mobile | Visible on desktop |

## Customization

### Changing Colors

Edit the gradient in the AppBar `sx` prop:

```tsx
background: 'linear-gradient(135deg, #your_color 0%, #darker_color 100%)',
```

### Adding Navigation Items

Add to `navigationItems` array:

```tsx
const navigationItems = [
  // ... existing items
  { label: 'New Item', icon: <YourIcon />, path: '/new-path' },
];
```

### Adjusting Responsive Breakpoints

Modify the `useMediaQuery` hook:

```tsx
const isMobile = useMediaQuery(theme.breakpoints.down('sm')); // Change from 'md'
```

## State Management

### Component State

- `anchorEl`: Controls user menu dropdown position
- `mobileDrawerOpen`: Controls mobile drawer visibility

### Context Usage

Uses `useAuth` hook to access:
- `user`: Current user information
- `business`: Current business details
- `logout`: Logout function
- `isAuthenticated`: Authentication status

## Mobile Drawer Features

- **Overlay**: Closes when clicking outside
- **Animation**: Smooth slide-in from left
- **Width**: 80% of screen, max 300px
- **Content**: Full navigation with icons
- **User Section**: Shows name, email, and logout button

## Accessibility

- Proper ARIA labels on icon buttons
- Semantic HTML structure
- Keyboard navigation support (MUI default)
- Color contrast meets WCAG standards
- Icons have associated text labels

## Performance

- No unnecessary re-renders (proper state management)
- Efficient icon rendering with Material-UI icons
- CSS-in-JS optimized with sx prop
- Responsive breakpoints prevent mobile rendering of desktop components

## Browser Support

Supports all modern browsers:
- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)
- Mobile browsers (iOS Safari, Chrome Mobile)

## Dependencies

- Material-UI (MUI) components
- Material-UI Icons
- React Router
- Custom AuthContext

## Future Enhancements

Potential improvements:
- [ ] Search functionality in header
- [ ] Notifications bell icon
- [ ] Dark mode toggle
- [ ] Language selector
- [ ] Recent items quick access
- [ ] Breadcrumb navigation
- [ ] Activity status indicator
- [ ] Quick shortcuts menu

---

**Created**: November 16, 2025  
**Last Updated**: November 16, 2025  
**Status**: ✅ Production Ready
