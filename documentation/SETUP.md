# GroundHog Frontend - Setup Guide

This guide provides complete step-by-step instructions for setting up and running the GroundHog Frontend system from scratch.

## 🎯 Prerequisites

### Required Software
- **Node.js**: Version 18.0.0 or higher
- **npm**: Version 8.0.0 or higher (comes with Node.js)
- **Git**: For cloning the repository
- **Code Editor**: VS Code recommended (with TypeScript support)

### Required Accounts & API Keys
- **Mapbox Account**: For map services
- **Supabase Account**: For database services
- **OpenAI Account**: For AI analysis features

## 🚀 Step-by-Step Setup

### 1. Environment Setup

#### Install Node.js
```bash
# macOS (using Homebrew)
brew install node

# Windows (download from nodejs.org)
# Download and install Node.js 18+ from https://nodejs.org/

# Linux (Ubuntu/Debian)
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Verify installation
node --version  # Should show v18.x.x or higher
npm --version   # Should show 8.x.x or higher
```

#### Install Git
```bash
# macOS
brew install git

# Windows
# Download from https://git-scm.com/

# Linux
sudo apt-get install git
```

### 2. Project Setup

#### Clone Repository
```bash
# Navigate to your desired development directory
cd /Users/yourusername/Documents/GitHub

# Clone the repository
git clone <repository-url>
cd groundhog-frontend

# Verify the project structure
ls -la
```

**Expected Directory Structure:**
```
groundhog-frontend/
├── app/                    # Next.js app directory
├── components/            # React components
├── lib/                   # Utility libraries
├── documentation/         # This documentation
├── package.json          # Dependencies
├── tsconfig.json         # TypeScript config
└── next.config.ts        # Next.js config
```

#### Install Dependencies
```bash
# Install all required packages
npm install

# Verify installation
npm list --depth=0
```

### 3. Environment Configuration

#### Create Environment File
```bash
# Create .env.local file in the root directory
touch .env.local
```

#### Configure Environment Variables
Edit `.env.local` with the following content:

```env
# Mapbox Configuration
NEXT_PUBLIC_MAPBOX_KEY=your_mapbox_api_key_here

# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
NEXT_PUBLIC_SUPABASE_KEY=your_supabase_service_role_key_here

# OpenAI Configuration
NEXT_PUBLIC_OPENAI_API_KEY=your_openai_api_key_here
```

**How to obtain these keys:**

1. **Mapbox API Key**:
   - Go to [Mapbox](https://account.mapbox.com/)
   - Create account or sign in
   - Navigate to Access Tokens
   - Create a new token with appropriate permissions

2. **Supabase Keys**:
   - Go to [Supabase](https://supabase.com/)
   - Create account or sign in
   - Create a new project
   - Go to Settings > API
   - Copy the URL and anon key

3. **OpenAI API Key**:
   - Go to [OpenAI Platform](https://platform.openai.com/)
   - Create account or sign in
   - Navigate to API Keys
   - Create a new secret key

### 4. Database Setup

#### Supabase Project Configuration
1. **Create Tables**: Execute the following SQL in your Supabase SQL editor:

```sql
-- Farm location table
CREATE TABLE farm_location (
  id SERIAL PRIMARY KEY,
  farm_id TEXT UNIQUE NOT NULL,
  farm_name TEXT NOT NULL,
  farmer_name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  lat DOUBLE PRECISION NOT NULL,
  long DOUBLE PRECISION NOT NULL
);

-- Chemical estimate table
CREATE TABLE chemical_estimate (
  id SERIAL PRIMARY KEY,
  farmID TEXT NOT NULL REFERENCES farm_location(farm_id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  nitrogen DOUBLE PRECISION,
  phosphorus DOUBLE PRECISION,
  potassium DOUBLE PRECISION,
  ec DOUBLE PRECISION,
  sulphur DOUBLE PRECISION,
  ph DOUBLE PRECISION,
  zinc DOUBLE PRECISION,
  iron DOUBLE PRECISION,
  boron DOUBLE PRECISION,
  copper DOUBLE PRECISION
);

-- Rover points table
CREATE TABLE rover_points (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  farm_id TEXT NOT NULL REFERENCES farm_location(farm_id),
  moisture DOUBLE PRECISION,
  temperature DOUBLE PRECISION,
  pH DOUBLE PRECISION,
  EC DOUBLE PRECISION,
  lat DOUBLE PRECISION NOT NULL,
  long DOUBLE PRECISION NOT NULL
);

-- Waypoints table
CREATE TABLE waypoints (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  farm_id TEXT NOT NULL REFERENCES farm_location(farm_id),
  name TEXT NOT NULL,
  lat DOUBLE PRECISION NOT NULL,
  long DOUBLE PRECISION NOT NULL,
  order_index INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Waypoint paths table
CREATE TABLE waypoint_paths (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  farm_id TEXT NOT NULL REFERENCES farm_location(farm_id),
  name TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- AI analysis records table
CREATE TABLE ai_analysis_records (
  id SERIAL PRIMARY KEY,
  farm_id TEXT NOT NULL REFERENCES farm_location(farm_id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  input_data JSONB NOT NULL,
  output_data JSONB NOT NULL,
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

2. **Set Row Level Security (RLS)**:
```sql
-- Enable RLS on all tables
ALTER TABLE farm_location ENABLE ROW LEVEL SECURITY;
ALTER TABLE chemical_estimate ENABLE ROW LEVEL SECURITY;
ALTER TABLE rover_points ENABLE ROW LEVEL SECURITY;
ALTER TABLE waypoints ENABLE ROW LEVEL SECURITY;
ALTER TABLE waypoint_paths ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_analysis_records ENABLE ROW LEVEL SECURITY;

-- Create policies (example for farm_location)
CREATE POLICY "Users can view their own farm data" ON farm_location
  FOR SELECT USING (true);

CREATE POLICY "Users can insert their own farm data" ON farm_location
  FOR INSERT WITH CHECK (true);
```

### 5. Development Server Setup

#### Start Development Server
```bash
# Start the development server
npm run dev

# Alternative: Start with specific port
npm run dev -- -p 3001
```

#### Verify Installation
1. **Open Browser**: Navigate to `http://localhost:3000`
2. **Check Console**: Open browser dev tools and verify no errors
3. **Test Pages**: Navigate through different pages to ensure they load

### 6. Build and Production Setup

#### Build for Production
```bash
# Create production build
npm run build

# Start production server
npm start
```

#### Production Environment
For production deployment, ensure:
- All environment variables are properly set
- Database connections are configured for production
- SSL certificates are in place
- Domain names are configured

## 🔧 Configuration Files

### File Locations and Purposes

| File | Location | Purpose |
|------|----------|---------|
| `package.json` | `/Users/yourusername/Documents/GitHub/groundhog-frontend/` | Dependencies and scripts |
| `.env.local` | `/Users/yourusername/Documents/GitHub/groundhog-frontend/` | Environment variables |
| `tsconfig.json` | `/Users/yourusername/Documents/GitHub/groundhog-frontend/` | TypeScript configuration |
| `next.config.ts` | `/Users/yourusername/Documents/GitHub/groundhog-frontend/` | Next.js configuration |
| `tailwind.config.js` | `/Users/yourusername/Documents/GitHub/groundhog-frontend/` | Tailwind CSS configuration |

### Key Configuration Settings

#### TypeScript Configuration (`tsconfig.json`)
- Target: ES2017
- Module: ESNext
- JSX: Preserve
- Path mapping: `@/*` → `./*`

#### Next.js Configuration (`next.config.ts`)
- Basic configuration with room for custom settings
- Turbopack enabled for development

## 🚨 Troubleshooting

### Common Issues

1. **Port Already in Use**:
   ```bash
   # Kill process on port 3000
   lsof -ti:3000 | xargs kill -9
   ```

2. **Environment Variables Not Loading**:
   - Ensure `.env.local` is in the root directory
   - Restart the development server
   - Check variable names match exactly

3. **Database Connection Issues**:
   - Verify Supabase URL and keys
   - Check network connectivity
   - Verify table permissions

4. **Map Not Loading**:
   - Verify Mapbox API key
   - Check browser console for errors
   - Ensure key has correct permissions

### Verification Commands

```bash
# Check Node.js version
node --version

# Check npm version
npm --version

# Check installed packages
npm list --depth=0

# Check environment variables
echo $NEXT_PUBLIC_MAPBOX_KEY

# Check database connection
# Test in browser console or component
```

## 📱 Testing the Setup

### Manual Testing Checklist

- [ ] Landing page loads without errors
- [ ] Navigation between pages works
- [ ] Map displays correctly
- [ ] Database connections work
- [ ] Environment variables are accessible
- [ ] Build process completes successfully
- [ ] Production server starts without errors

### Automated Testing
```bash
# Run linting
npm run lint

# Run type checking
npx tsc --noEmit

# Run build process
npm run build
```

## 🔄 Next Steps

After successful setup:

1. **Read the [Architecture Documentation](./ARCHITECTURE.md)** to understand system design
2. **Review [Component Library](./COMPONENTS.md)** for UI development
3. **Check [API Documentation](./API.md)** for external integrations
4. **Follow [Deployment Guide](./DEPLOYMENT.md)** for production setup

## 📞 Support

If you encounter issues during setup:

1. **Check this documentation** for common solutions
2. **Review the [Troubleshooting Guide](./TROUBLESHOOTING.md)**
3. **Contact**: ntiglao@umd.edu
4. **Create an issue** in the repository

---

**Setup completed successfully?** Great! You're ready to start developing with GroundHog Frontend. 🎉


