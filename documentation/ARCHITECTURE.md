# GroundHog Frontend - System Architecture

This document provides a comprehensive overview of the GroundHog Frontend system architecture, including component design, data flow, and system interactions.

## 🏗️ System Overview

**GroundHog Frontend** is a modern, responsive web application built with Next.js 15 and React 19, designed for precision agriculture monitoring. The system provides real-time soil health visualization, AI-powered analysis, and autonomous rover navigation management.

### Architecture Principles

- **Component-Based Design**: Modular, reusable UI components
- **Real-Time Data**: Live updates via Supabase Realtime
- **Responsive Design**: Mobile-first approach with progressive enhancement
- **Type Safety**: Full TypeScript implementation
- **Performance**: Optimized rendering and data fetching
- **Scalability**: Designed for multi-farm support

## 🎯 System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                    User Interface Layer                        │
├─────────────────────────────────────────────────────────────────┤
│  Landing Page │ Login │ Onboarding │ Dashboard │ Waypoints    │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                   Component Layer                              │
├─────────────────────────────────────────────────────────────────┤
│  UI Components │ Charts │ Maps │ Forms │ Navigation           │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                   Service Layer                                │
├─────────────────────────────────────────────────────────────────┤
│  Supabase │ OpenAI │ Mapbox │ MQTT │ Utilities                │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                   Data Layer                                   │
├─────────────────────────────────────────────────────────────────┤
│  PostgreSQL │ Real-time │ File Storage │ Edge Functions        │
└─────────────────────────────────────────────────────────────────┘
```

## 🧩 Component Architecture

### 1. Page Components (`app/`)

#### Landing Page (`app/page.tsx`)
**Purpose**: Main entry point with project overview and navigation

**Features**:
- Animated splash screen
- Typewriter effect for project description
- Video background integration
- Navigation to login/onboarding

**Component Structure**:
```typescript
LandingPage
├── HeroSection
├── ProjectDescription
├── VideoBackground
└── NavigationButtons
```

#### Dashboard (`app/dashboard/page.tsx`)
**Purpose**: Main monitoring interface with interactive maps and data visualization

**Features**:
- Interactive Mapbox integration
- Real-time sensor data heatmaps
- Chemical analysis dashboard
- Responsive sidebar navigation

**Component Structure**:
```typescript
Dashboard
├── MapContainer
│   ├── HeatmapLayer
│   ├── RoverMarker
│   └── MapControls
├── Sidebar
│   ├── SensorSelector
│   ├── ChemicalAnalysis
│   └── FarmInfo
└── DataVisualization
    ├── Charts
    └── Statistics
```

#### Onboarding (`app/onboard/page.tsx`)
**Purpose**: Multi-step farm registration and setup

**Features**:
- Step-by-step form wizard
- Interactive map for location selection
- GPS integration
- Farm information collection

**Component Structure**:
```typescript
OnboardingWizard
├── StepIndicator
├── FarmInfoForm
├── LocationSelector
│   ├── MapComponent
│   └── GPSButton
├── WaypointSetup
└── ConfirmationStep
```

#### Login (`app/login/page.tsx`)
**Purpose**: Farm authentication and session management

**Features**:
- Simple farm ID authentication
- Cookie-based session management
- Error handling and validation

**Component Structure**:
```typescript
LoginPage
├── LoginForm
│   ├── FarmIdInput
│   ├── SubmitButton
│   └── ErrorDisplay
└── NavigationLinks
```

#### Waypoints (`app/waypoints/page.tsx`)
**Purpose**: Rover navigation path management

**Features**:
- Waypoint creation and editing
- Path planning and optimization
- Navigation sequence management

**Component Structure**:
```typescript
WaypointsPage
├── PathList
├── WaypointEditor
├── NavigationMap
└── PathOptimizer
```

### 2. Core Components (`components/`)

#### UI Components (`components/ui/`)
**Purpose**: Reusable base UI components built with Radix UI and Tailwind CSS

**Key Components**:
- `Button`: Multiple variants and sizes
- `Dialog`: Modal and popup components
- `Input`: Form input components
- `Select`: Dropdown selection
- `Card`: Content container components
- `Chart`: Data visualization components

#### Specialized Components

**AIAnalysisBox** (`components/AIAnalysisBox.tsx`)
- AI-powered soil analysis display
- Recommendation generation
- Historical analysis tracking

**ChemicalAnalysisDialog** (`components/ChemicalAnalysisDialog.tsx`)
- Detailed soil nutrient breakdown
- Interactive charts and graphs
- Export functionality

**Navbar** (`components/ui/navbar.tsx`)
- Main navigation component
- Farm selection dropdown
- User session management

## 🔌 Service Layer Architecture

### 1. Database Service (`lib/supabaseClient.ts`)

**Purpose**: Primary data access layer for all database operations

**Features**:
- Connection management
- Query execution
- Real-time subscriptions
- Error handling

**Implementation**:
```typescript
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_KEY!;

export const supabase = createClient(supabaseUrl, supabaseKey);
```

**Key Operations**:
- CRUD operations for all tables
- Real-time data subscriptions
- Row-level security enforcement
- Connection pooling

### 2. AI Service (`lib/openaiClient.ts`)

**Purpose**: Integration with OpenAI API for soil analysis

**Features**:
- Soil health assessment
- Nutrient recommendation generation
- Historical analysis comparison
- Predictive analytics

**Implementation**:
```typescript
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true,
});
```

**AI Analysis Flow**:
```
Sensor Data → OpenAI API → Analysis → Recommendations → Storage
```

### 3. Mapping Service (Mapbox Integration)

**Purpose**: Interactive map visualization and location services

**Features**:
- Real-time heatmap rendering
- GPS coordinate handling
- Satellite and street view toggles
- Custom map styling

**Integration Points**:
- Dashboard map container
- Onboarding location selector
- Waypoint navigation planning
- Rover tracking

### 4. MQTT Service (`lib/mqttTemplate.ts`)

**Purpose**: Real-time communication with autonomous rover

**Features**:
- Rover location updates
- Sensor data streaming
- Navigation command transmission
- Connection status monitoring

**Note**: Currently implemented as a template for future integration

## 📊 Data Flow Architecture

### 1. User Authentication Flow

```
User Input → Farm ID Validation → Session Creation → Cookie Storage → Dashboard Access
```

**Implementation Details**:
- Simple farm ID-based authentication
- Cookie-based session persistence
- Automatic session validation
- Secure session management

### 2. Data Collection Flow

```
Rover Sensors → MQTT → Database → Real-time Updates → Dashboard Visualization
```

**Real-time Pipeline**:
1. **Data Ingestion**: Rover sensors collect soil data
2. **Transmission**: MQTT protocol for real-time communication
3. **Storage**: PostgreSQL database via Supabase
4. **Distribution**: Supabase Realtime for live updates
5. **Visualization**: React components with live data binding

### 3. AI Analysis Flow

```
Sensor Data → OpenAI API → Analysis Engine → Recommendations → Storage → Display
```

**Analysis Process**:
1. **Data Aggregation**: Collect sensor readings and historical data
2. **AI Processing**: Send to OpenAI for soil health analysis
3. **Result Generation**: Generate actionable recommendations
4. **Storage**: Save analysis results to database
5. **Display**: Present insights in chemical analysis dashboard

### 4. Navigation Flow

```
Waypoint Creation → Path Planning → Rover Commands → Navigation Execution → Data Collection
```

**Navigation Process**:
1. **Path Definition**: Create waypoints and navigation sequences
2. **Route Optimization**: Calculate optimal paths between points
3. **Command Generation**: Create rover navigation instructions
4. **Execution**: Rover follows planned route
5. **Data Collection**: Collect soil samples at each waypoint

## 🎨 UI/UX Architecture

### Design System

**Color Palette**:
- **Primary**: Green (#10B981) - Agriculture theme
- **Secondary**: Blue (#3B82F6) - Technology theme
- **Accent**: Orange (#F59E0B) - Warning/attention
- **Neutral**: Gray scale for text and backgrounds

**Typography**:
- **Headings**: Inter font family for modern appearance
- **Body**: System fonts for optimal readability
- **Code**: Monospace fonts for technical content

**Component Variants**:
- **Buttons**: Primary, secondary, outline, ghost
- **Cards**: Default, elevated, interactive
- **Forms**: Input, select, textarea with validation states

### Responsive Design

**Breakpoints**:
- **Mobile**: 320px - 768px
- **Tablet**: 768px - 1024px
- **Desktop**: 1024px+

**Layout Adaptations**:
- **Mobile**: Stacked layout with collapsible sidebar
- **Tablet**: Side-by-side layout with responsive sizing
- **Desktop**: Full layout with expanded sidebar

### Animation System

**Transitions**:
- **Page Transitions**: Smooth navigation between routes
- **Component Animations**: Fade, slide, and scale effects
- **Interactive Feedback**: Hover states and click animations
- **Loading States**: Skeleton screens and progress indicators

## 🔒 Security Architecture

### Authentication & Authorization

**Session Management**:
- Cookie-based authentication
- Secure session storage
- Automatic session validation
- Farm-level data isolation

**Data Security**:
- Row-level security (RLS) in database
- API key management
- Secure environment variable handling
- HTTPS enforcement

### Data Privacy

**Farm Isolation**:
- Each farm's data is completely isolated
- No cross-farm data access
- Secure API endpoints
- Encrypted data transmission

## 📈 Performance Architecture

### Optimization Strategies

**Code Splitting**:
- Route-based code splitting
- Component lazy loading
- Dynamic imports for heavy components
- Bundle size optimization

**Data Fetching**:
- Optimistic updates
- Background data refresh
- Intelligent caching strategies
- Debounced user inputs

**Rendering Optimization**:
- React.memo for component memoization
- useCallback and useMemo hooks
- Virtual scrolling for large datasets
- Efficient re-rendering strategies

### Caching Strategy

**Client-Side Caching**:
- React Query for server state management
- Local storage for user preferences
- Memory caching for frequently accessed data
- Optimistic updates for better UX

**Server-Side Caching**:
- Supabase query result caching
- Static asset optimization
- CDN integration for global performance
- Database query optimization

## 🚀 Scalability Architecture

### Multi-Farm Support

**Data Isolation**:
- Separate database schemas per farm
- Farm-specific API endpoints
- Isolated user sessions
- Independent data processing

**Resource Management**:
- Efficient database queries
- Optimized data structures
- Scalable storage solutions
- Load balancing considerations

### Future Enhancements

**Microservices Architecture**:
- Separate services for different domains
- API gateway for request routing
- Service discovery and load balancing
- Independent scaling of services

**Real-time Scaling**:
- WebSocket clustering
- Message queue systems
- Event-driven architecture
- Horizontal scaling support

## 🔧 Development Architecture

### Build System

**Next.js Configuration**:
- Turbopack for development
- Webpack for production builds
- TypeScript compilation
- Tailwind CSS processing

**Development Tools**:
- ESLint for code quality
- Prettier for code formatting
- TypeScript for type safety
- Hot module replacement

### Testing Strategy

**Testing Layers**:
- **Unit Tests**: Component and utility testing
- **Integration Tests**: Service layer testing
- **E2E Tests**: User workflow testing
- **Performance Tests**: Load and stress testing

**Testing Tools**:
- Jest for unit testing
- React Testing Library for component testing
- Cypress for E2E testing
- Lighthouse for performance testing

## 📊 Monitoring & Observability

### Performance Monitoring

**Metrics Collection**:
- Page load times
- Component render performance
- API response times
- User interaction metrics

**Error Tracking**:
- JavaScript error monitoring
- API failure tracking
- User experience metrics
- Performance degradation alerts

### Analytics Integration

**User Analytics**:
- Page view tracking
- User interaction patterns
- Feature usage statistics
- Conversion funnel analysis

**Business Metrics**:
- Farm onboarding completion rates
- Dashboard usage patterns
- Feature adoption rates
- User satisfaction metrics

## 🔄 Deployment Architecture

### Environment Management

**Environment Types**:
- **Development**: Local development setup
- **Staging**: Pre-production testing
- **Production**: Live system deployment

**Configuration Management**:
- Environment-specific variables
- Feature flags and toggles
- A/B testing support
- Gradual rollout capabilities

### CI/CD Pipeline

**Build Process**:
- Automated testing
- Code quality checks
- Build optimization
- Artifact generation

**Deployment Process**:
- Automated deployment
- Health checks
- Rollback capabilities
- Zero-downtime updates

## 📞 Support & Maintenance

### Documentation

**Technical Documentation**:
- API reference guides
- Component usage examples
- Architecture decision records
- Troubleshooting guides

**User Documentation**:
- User manuals
- Feature guides
- Video tutorials
- FAQ sections

### Maintenance Procedures

**Regular Maintenance**:
- Dependency updates
- Security patches
- Performance monitoring
- Database optimization

**Emergency Procedures**:
- Incident response plans
- Rollback procedures
- Support escalation
- Communication protocols

---

**Architecture documentation completed!** This provides a comprehensive understanding of the GroundHog Frontend system design. 🏗️


