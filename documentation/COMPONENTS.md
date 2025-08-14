# GroundHog Frontend - Component Library

This document provides comprehensive information about all UI components, their props, usage examples, and styling guidelines in the GroundHog Frontend system.

## 🧩 Component Overview

The GroundHog Frontend uses a component-based architecture built with React 19 and TypeScript. Components are organized into logical groups and follow consistent design patterns for maintainability and reusability.

### Component Categories

1. **Base UI Components** (`components/ui/`) - Fundamental building blocks
2. **Specialized Components** - Domain-specific functionality
3. **Layout Components** - Page structure and navigation
4. **Data Visualization** - Charts, maps, and analytics

## 🎨 Base UI Components

### Button Component

**Location**: `components/ui/button.tsx`

**Purpose**: Primary interactive element with multiple variants and sizes

**Props**:
```typescript
interface ButtonProps {
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  disabled?: boolean;
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
}
```

**Variants**:
- **Default**: Primary action button with green background
- **Destructive**: Dangerous actions with red styling
- **Outline**: Secondary actions with border
- **Secondary**: Alternative primary actions
- **Ghost**: Subtle interactive elements
- **Link**: Text-based buttons

**Usage Examples**:
```tsx
// Primary button
<Button onClick={handleSubmit}>
  Save Changes
</Button>

// Outline button
<Button variant="outline" onClick={handleCancel}>
  Cancel
</Button>

// Small destructive button
<Button variant="destructive" size="sm" onClick={handleDelete}>
  Delete
</Button>

// Icon button
<Button size="icon" onClick={handleMenu}>
  <Menu className="h-4 w-4" />
</Button>
```

**Styling**: Uses Tailwind CSS with custom color scheme and hover effects

### Input Component

**Location**: `components/ui/input.tsx`

**Purpose**: Form input field with consistent styling and validation states

**Props**:
```typescript
interface InputProps {
  type?: 'text' | 'email' | 'password' | 'number' | 'tel' | 'url';
  placeholder?: string;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  disabled?: boolean;
  error?: boolean;
  className?: string;
}
```

**Usage Examples**:
```tsx
// Basic text input
<Input
  placeholder="Enter farm name"
  value={farmName}
  onChange={(e) => setFarmName(e.target.value)}
/>

// Input with error state
<Input
  type="email"
  placeholder="Enter email"
  error={!!emailError}
  className="border-red-500"
/>

// Disabled input
<Input
  value="Read-only value"
  disabled
  className="bg-gray-100"
/>
```

### Dialog Component

**Location**: `components/ui/dialog.tsx`

**Purpose**: Modal dialogs and popups for focused user interactions

**Props**:
```typescript
interface DialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
}

interface DialogContentProps {
  children: React.ReactNode;
  className?: string;
}

interface DialogHeaderProps {
  children: React.ReactNode;
}

interface DialogFooterProps {
  children: React.ReactNode;
}
```

**Usage Examples**:
```tsx
// Basic dialog
<Dialog open={isOpen} onOpenChange={setIsOpen}>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Confirm Action</DialogTitle>
      <DialogDescription>
        Are you sure you want to proceed?
      </DialogDescription>
    </DialogHeader>
    <DialogFooter>
      <Button variant="outline" onClick={() => setIsOpen(false)}>
        Cancel
      </Button>
      <Button onClick={handleConfirm}>
        Confirm
      </Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

### Select Component

**Location**: `components/ui/select.tsx`

**Purpose**: Dropdown selection component with search and multi-select capabilities

**Props**:
```typescript
interface SelectProps {
  value?: string;
  onValueChange?: (value: string) => void;
  disabled?: boolean;
  children: React.ReactNode;
}

interface SelectItemProps {
  value: string;
  children: React.ReactNode;
  disabled?: boolean;
}
```

**Usage Examples**:
```tsx
// Basic select
<Select value={selectedSensor} onValueChange={setSelectedSensor}>
  <SelectTrigger>
    <SelectValue placeholder="Select sensor type" />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="moisture">Moisture</SelectItem>
    <SelectItem value="temperature">Temperature</SelectItem>
    <SelectItem value="pH">pH</SelectItem>
    <SelectItem value="EC">Electrical Conductivity</SelectItem>
  </SelectContent>
</Select>
```

### Card Component

**Location**: `components/ui/card.tsx`

**Purpose**: Content container with consistent spacing and styling

**Props**:
```typescript
interface CardProps {
  children: React.ReactNode;
  className?: string;
}

interface CardHeaderProps {
  children: React.ReactNode;
  className?: string;
}

interface CardContentProps {
  children: React.ReactNode;
  className?: string;
}

interface CardFooterProps {
  children: React.ReactNode;
  className?: string;
}
```

**Usage Examples**:
```tsx
// Basic card
<Card>
  <CardHeader>
    <CardTitle>Sensor Data</CardTitle>
    <CardDescription>Latest readings from the field</CardDescription>
  </CardHeader>
  <CardContent>
    <p>Moisture: 65.4%</p>
    <p>Temperature: 22.1°C</p>
    <p>pH: 6.8</p>
  </CardContent>
  <CardFooter>
    <Button>View Details</Button>
  </CardFooter>
</Card>
```

## 🗺️ Specialized Components

### AIAnalysisBox Component

**Location**: `components/AIAnalysisBox.tsx`

**Purpose**: Displays AI-generated soil analysis and recommendations

**Props**:
```typescript
interface AIAnalysisBoxProps {
  farmId: string;
  sensorData: AIAnalysisInput;
  onAnalysisComplete?: (analysis: AIAnalysisOutput) => void;
}
```

**Features**:
- Real-time AI analysis generation
- Soil health recommendations
- Historical analysis tracking
- Actionable insights display

**Usage Examples**:
```tsx
<AIAnalysisBox
  farmId="FARM_001"
  sensorData={{
    pH: 6.8,
    EC: 1.2,
    temperature_c: 22.1,
    moisture_pct: 65.4
  }}
  onAnalysisComplete={(analysis) => {
    console.log('Analysis completed:', analysis);
  }}
/>
```

**Internal Structure**:
```tsx
AIAnalysisBox
├── AnalysisHeader
├── SensorDataDisplay
├── AIProcessingIndicator
├── AnalysisResults
│   ├── Summary
│   ├── Recommendations
│   └── Status
└── ActionButtons
```

### ChemicalAnalysisDialog Component

**Location**: `components/ChemicalAnalysisDialog.tsx`

**Purpose**: Detailed soil nutrient analysis with interactive charts

**Props**:
```typescript
interface ChemicalAnalysisDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  chemicalData: ChemicalEstimate[];
  farmId: string;
}
```

**Features**:
- Interactive nutrient charts
- Historical trend analysis
- Export functionality
- Comparative analysis

**Usage Examples**:
```tsx
<ChemicalAnalysisDialog
  open={isDialogOpen}
  onOpenChange={setIsDialogOpen}
  chemicalData={chemicalAnalysis}
  farmId="FARM_001"
/>
```

**Chart Components**:
- **Macronutrients Chart**: N, P, K levels over time
- **Micronutrients Chart**: Cu, Fe, Zn, B levels
- **Soil Properties Chart**: pH, EC, sulphur trends

### Navbar Component

**Location**: `components/ui/navbar.tsx`

**Purpose**: Main navigation with farm selection and user controls

**Props**:
```typescript
interface NavbarProps {
  currentFarm?: string;
  onFarmChange?: (farmId: string) => void;
  farms?: FarmLocation[];
}
```

**Features**:
- Farm selection dropdown
- Navigation menu
- User session management
- Responsive design

**Usage Examples**:
```tsx
<Navbar
  currentFarm="FARM_001"
  onFarmChange={handleFarmChange}
  farms={availableFarms}
/>
```

## 📊 Data Visualization Components

### Chart Component

**Location**: `components/ui/chart.tsx`

**Purpose**: Reusable chart component for data visualization

**Props**:
```typescript
interface ChartProps {
  data: ChartData;
  type: 'line' | 'bar' | 'pie' | 'doughnut';
  options?: ChartOptions;
  className?: string;
}
```

**Chart Types**:
- **Line Charts**: Time series data (sensor readings, trends)
- **Bar Charts**: Categorical data (nutrient levels, comparisons)
- **Pie Charts**: Composition data (soil type distribution)
- **Doughnut Charts**: Progress indicators

**Usage Examples**:
```tsx
// Line chart for sensor data
<Chart
  type="line"
  data={sensorChartData}
  options={{
    responsive: true,
    scales: {
      y: { beginAtZero: true }
    }
  }}
/>

// Bar chart for nutrient comparison
<Chart
  type="bar"
  data={nutrientChartData}
  options={{
    responsive: true,
    plugins: {
      legend: { position: 'top' }
    }
  }}
/>
```

### Heatmap Configuration

**Location**: `components/heatmapConfig.ts`

**Purpose**: Configuration for Mapbox heatmap visualization

**Configuration Options**:
```typescript
interface HeatmapConfig {
  sensorType: 'moisture' | 'temperature' | 'pH' | 'EC';
  colorScheme: string[];
  intensity: number;
  radius: number;
  opacity: number;
}
```

**Color Schemes**:
- **Moisture**: Blue (dry) to Red (wet)
- **Temperature**: Blue (cold) to Red (hot)
- **pH**: White (neutral) to Red (acidic/alkaline)
- **EC**: Blue (low) to Purple (high)

**Usage Examples**:
```tsx
import { getHeatmapConfig } from './heatmapConfig';

const config = getHeatmapConfig('moisture');
// Returns moisture-specific heatmap configuration
```

## 🎭 Layout Components

### Sidebar Component

**Location**: `components/ui/sidebar.tsx`

**Purpose**: Collapsible sidebar for dashboard navigation

**Props**:
```typescript
interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  children: React.ReactNode;
  className?: string;
}
```

**Features**:
- Collapsible design
- Responsive behavior
- Smooth animations
- Content organization

**Usage Examples**:
```tsx
<Sidebar isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)}>
  <SidebarHeader>
    <h2>Dashboard</h2>
  </SidebarHeader>
  <SidebarContent>
    <SidebarItem>Overview</SidebarItem>
    <SidebarItem>Maps</SidebarItem>
    <SidebarItem>Analytics</SidebarItem>
  </SidebarContent>
</Sidebar>
```

### Navigation Menu Component

**Location**: `components/ui/navigation-menu.tsx`

**Purpose**: Horizontal navigation menu with dropdown support

**Props**:
```typescript
interface NavigationMenuProps {
  items: NavigationItem[];
  activeItem?: string;
  onItemClick?: (item: NavigationItem) => void;
}
```

**Usage Examples**:
```tsx
const navigationItems = [
  { label: 'Dashboard', href: '/dashboard' },
  { label: 'Waypoints', href: '/waypoints' },
  { label: 'Analytics', href: '/analytics' }
];

<NavigationMenu
  items={navigationItems}
  activeItem="dashboard"
  onItemClick={(item) => router.push(item.href)}
/>
```

## 🔧 Utility Components

### Skeleton Component

**Location**: `components/ui/skeleton.tsx`

**Purpose**: Loading placeholders for content

**Props**:
```typescript
interface SkeletonProps {
  className?: string;
  children?: React.ReactNode;
}
```

**Usage Examples**:
```tsx
// Basic skeleton
<Skeleton className="h-4 w-full" />

// Card skeleton
<Card>
  <CardHeader>
    <Skeleton className="h-6 w-1/3" />
    <Skeleton className="h-4 w-2/3" />
  </CardHeader>
  <CardContent>
    <Skeleton className="h-4 w-full mb-2" />
    <Skeleton className="h-4 w-3/4" />
  </CardContent>
</Card>
```

### Switch Component

**Location**: `components/ui/switch.tsx`

**Purpose**: Toggle switch for boolean settings

**Props**:
```typescript
interface SwitchProps {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  disabled?: boolean;
  className?: string;
}
```

**Usage Examples**:
```tsx
<Switch
  checked={isEnabled}
  onCheckedChange={setIsEnabled}
  className="data-[state=checked]:bg-green-600"
/>
```

### Toggle Component

**Location**: `components/ui/toggle.tsx`

**Purpose**: Button group toggle for multiple options

**Props**:
```typescript
interface ToggleProps {
  pressed: boolean;
  onPressedChange: (pressed: boolean) => void;
  children: React.ReactNode;
  disabled?: boolean;
  className?: string;
}
```

**Usage Examples**:
```tsx
<Toggle
  pressed={selectedSensor === 'moisture'}
  onPressedChange={() => setSelectedSensor('moisture')}
>
  Moisture
</Toggle>
```

## 🎨 Styling Guidelines

### Design System

**Color Palette**:
```css
/* Primary Colors */
--primary: #10B981;      /* Green - Agriculture */
--primary-foreground: #FFFFFF;

/* Secondary Colors */
--secondary: #3B82F6;    /* Blue - Technology */
--secondary-foreground: #FFFFFF;

/* Accent Colors */
--accent: #F59E0B;       /* Orange - Warning */
--accent-foreground: #FFFFFF;

/* Neutral Colors */
--background: #FFFFFF;
--foreground: #111827;
--muted: #F3F4F6;
--muted-foreground: #6B7280;
```

**Typography Scale**:
```css
/* Heading Sizes */
--h1: 2.25rem;    /* 36px */
--h2: 1.875rem;   /* 30px */
--h3: 1.5rem;     /* 24px */
--h4: 1.25rem;    /* 20px */

/* Body Sizes */
--body: 1rem;     /* 16px */
--small: 0.875rem; /* 14px */
--tiny: 0.75rem;   /* 12px */
```

**Spacing Scale**:
```css
/* Spacing Units */
--space-1: 0.25rem;   /* 4px */
--space-2: 0.5rem;    /* 8px */
--space-3: 0.75rem;   /* 12px */
--space-4: 1rem;      /* 16px */
--space-6: 1.5rem;    /* 24px */
--space-8: 2rem;      /* 32px */
--space-12: 3rem;     /* 48px */
--space-16: 4rem;     /* 64px */
```

### Component Variants

**Button Variants**:
```tsx
// Default variant
className="bg-primary text-primary-foreground hover:bg-primary/90"

// Outline variant
className="border border-input bg-background hover:bg-accent hover:text-accent-foreground"

// Destructive variant
className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
```

**Card Variants**:
```tsx
// Default card
className="rounded-lg border bg-card text-card-foreground shadow-sm"

// Elevated card
className="rounded-lg border bg-card text-card-foreground shadow-lg"

// Interactive card
className="rounded-lg border bg-card text-card-foreground shadow-sm hover:shadow-md transition-shadow"
```

## 📱 Responsive Design

### Breakpoint System

**Mobile First Approach**:
```css
/* Base styles (mobile) */
.component {
  padding: 1rem;
  font-size: 0.875rem;
}

/* Tablet and up */
@media (min-width: 768px) {
  .component {
    padding: 1.5rem;
    font-size: 1rem;
  }
}

/* Desktop and up */
@media (min-width: 1024px) {
  .component {
    padding: 2rem;
    font-size: 1.125rem;
  }
}
```

**Responsive Utilities**:
```tsx
// Responsive padding
className="p-4 md:p-6 lg:p-8"

// Responsive text sizes
className="text-sm md:text-base lg:text-lg"

// Responsive grid
className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
```

## 🧪 Testing Components

### Component Testing

**Test Structure**:
```tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { Button } from './Button';

describe('Button Component', () => {
  it('renders with correct text', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByText('Click me')).toBeInTheDocument();
  });

  it('calls onClick when clicked', () => {
    const handleClick = jest.fn();
    render(<Button onClick={handleClick}>Click me</Button>);
    
    fireEvent.click(screen.getByText('Click me'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });
});
```

**Mock Data**:
```tsx
// Mock component props
const mockProps = {
  farmId: 'TEST_FARM',
  sensorData: {
    pH: 6.8,
    EC: 1.2,
    temperature_c: 22.1,
    moisture_pct: 65.4
  }
};

// Test component with mock data
render(<AIAnalysisBox {...mockProps} />);
```

## 📚 Component Documentation

### Storybook Integration

**Component Stories**:
```tsx
// Button.stories.tsx
export default {
  title: 'UI/Button',
  component: Button,
  parameters: {
    docs: {
      description: {
        component: 'Primary interactive element with multiple variants'
      }
    }
  }
};

export const Primary = {
  args: {
    children: 'Primary Button',
    variant: 'default'
  }
};

export const Secondary = {
  args: {
    children: 'Secondary Button',
    variant: 'secondary'
  }
};
```

### Usage Examples

**Common Patterns**:
```tsx
// Form with validation
<Card>
  <CardHeader>
    <CardTitle>Farm Information</CardTitle>
  </CardHeader>
  <CardContent>
    <div className="space-y-4">
      <Input
        placeholder="Farm Name"
        value={farmName}
        onChange={(e) => setFarmName(e.target.value)}
        error={!!farmNameError}
      />
      {farmNameError && (
        <p className="text-sm text-destructive">{farmNameError}</p>
      )}
    </div>
  </CardContent>
  <CardFooter>
    <Button onClick={handleSubmit}>Save Farm</Button>
  </CardFooter>
</Card>
```

## 🔄 Component Updates

### Version History

**Component Evolution**:
- **v1.0**: Basic component structure
- **v1.1**: Added responsive design
- **v1.2**: Enhanced accessibility features
- **v1.3**: Performance optimizations

**Migration Guide**:
```tsx
// Old usage
<Button variant="primary" size="medium">

// New usage
<Button variant="default" size="default">
```

## 📞 Support & Contributing

### Component Development

**Adding New Components**:
1. Create component file in appropriate directory
2. Add TypeScript interfaces for props
3. Implement component logic
4. Add comprehensive tests
5. Update documentation
6. Create Storybook stories

**Component Guidelines**:
- Follow naming conventions
- Use consistent prop patterns
- Implement proper error handling
- Ensure accessibility compliance
- Add comprehensive documentation

### Getting Help

- **Component Issues**: Check component documentation
- **Styling Questions**: Review design system guidelines
- **Testing Help**: Refer to testing examples
- **Support Contact**: ntiglao@umd.edu

---

**Component library documentation completed!** This provides comprehensive information about all UI components and their usage. 🧩

