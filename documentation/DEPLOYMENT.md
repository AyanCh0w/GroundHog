# GroundHog Frontend - Deployment Guide

This document provides comprehensive instructions for deploying the GroundHog Frontend application to production environments, including CI/CD pipelines, environment management, and monitoring.

## 🚀 Deployment Overview

**GroundHog Frontend** is designed for modern cloud deployment with support for multiple environments, automated CI/CD pipelines, and scalable infrastructure. The application can be deployed to various platforms including Vercel, Netlify, AWS, and traditional hosting providers.

### Deployment Architecture

```
Development → Staging → Production
     ↓           ↓         ↓
   Local      Pre-prod   Live
  Testing     Testing   System
```

## 🎯 Prerequisites

### Required Tools

- **Git**: Version control system
- **Node.js**: Version 18+ for build processes
- **Docker**: Container deployment (optional)
- **CI/CD Platform**: GitHub Actions, GitLab CI, or similar
- **Cloud Platform**: Vercel, Netlify, AWS, etc.

### Required Accounts

- **Version Control**: GitHub, GitLab, or Bitbucket
- **Cloud Platform**: Platform-specific account
- **Domain Provider**: For custom domain configuration
- **SSL Certificate**: For HTTPS enforcement

## 🏗️ Environment Configuration

### Environment Variables

**Production Environment Variables**:

```env
# Mapbox Configuration
NEXT_PUBLIC_MAPBOX_KEY=your_production_mapbox_key

# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_production_supabase_anon_key
NEXT_PUBLIC_SUPABASE_KEY=your_production_supabase_service_role_key

# OpenAI Configuration
NEXT_PUBLIC_OPENAI_API_KEY=your_production_openai_api_key

# Application Configuration
NEXT_PUBLIC_APP_ENV=production
NEXT_PUBLIC_APP_URL=https://your-domain.com
NEXT_PUBLIC_API_BASE_URL=https://your-api-domain.com

# Analytics (Optional)
NEXT_PUBLIC_GA_TRACKING_ID=your_google_analytics_id
NEXT_PUBLIC_SENTRY_DSN=your_sentry_dsn
```

**Staging Environment Variables**:

```env
# Mapbox Configuration
NEXT_PUBLIC_MAPBOX_KEY=your_staging_mapbox_key

# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-staging-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_staging_supabase_anon_key
NEXT_PUBLIC_SUPABASE_KEY=your_staging_supabase_service_role_key

# OpenAI Configuration
NEXT_PUBLIC_OPENAI_API_KEY=your_staging_openai_api_key

# Application Configuration
NEXT_PUBLIC_APP_ENV=staging
NEXT_PUBLIC_APP_URL=https://staging.your-domain.com
```

### Environment-Specific Configurations

**Development**:

- Debug logging enabled
- Development API endpoints
- Hot reload and debugging tools

**Staging**:

- Production-like configuration
- Test data and sandbox APIs
- Performance monitoring enabled

**Production**:

- Optimized builds
- Production APIs and databases
- Full monitoring and analytics

## 🔧 Build Configuration

### Next.js Configuration

**Production Build Settings** (`next.config.ts`):

```typescript
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Production optimizations
  compress: true,
  poweredByHeader: false,

  // Image optimization
  images: {
    domains: ["your-domain.com"],
    formats: ["image/webp", "image/avif"],
  },

  // Security headers
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "Referrer-Policy",
            value: "origin-when-cross-origin",
          },
        ],
      },
    ];
  },

  // Environment-specific settings
  env: {
    CUSTOM_KEY: process.env.CUSTOM_KEY,
  },
};

export default nextConfig;
```

### Build Scripts

**Package.json Scripts**:

```json
{
  "scripts": {
    "dev": "next dev --turbopack",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "build:staging": "NODE_ENV=staging next build",
    "build:production": "NODE_ENV=production next build",
    "analyze": "ANALYZE=true next build",
    "export": "next build && next export"
  }
}
```

## 🚀 Deployment Platforms

### 1. Vercel Deployment

**Recommended Platform**: Vercel provides optimal Next.js deployment with zero configuration.

#### Setup Process

1. **Install Vercel CLI**:

```bash
npm install -g vercel
```

2. **Login to Vercel**:

```bash
vercel login
```

3. **Deploy Application**:

```bash
# Deploy to preview
vercel

# Deploy to production
vercel --prod
```

4. **Configure Environment Variables**:

```bash
vercel env add NEXT_PUBLIC_MAPBOX_KEY
vercel env add NEXT_PUBLIC_SUPABASE_URL
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
vercel env add NEXT_PUBLIC_OPENAI_API_KEY
```

#### Vercel Configuration (`vercel.json`):

```json
{
  "version": 2,
  "builds": [
    {
      "src": "package.json",
      "use": "@vercel/next"
    }
  ],
  "routes": [
    {
      "src": "/api/(.*)",
      "dest": "/api/$1"
    }
  ],
  "env": {
    "NEXT_PUBLIC_APP_ENV": "production"
  }
}
```

### 2. Netlify Deployment

**Alternative Platform**: Netlify provides excellent static site hosting with build automation.

#### Setup Process

1. **Create Netlify Configuration** (`netlify.toml`):

```toml
[build]
  command = "npm run build"
  publish = ".next"

[build.environment]
  NODE_VERSION = "18"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200

[context.production.environment]
  NODE_ENV = "production"
  NEXT_PUBLIC_APP_ENV = "production"

[context.deploy-preview.environment]
  NODE_ENV = "staging"
  NEXT_PUBLIC_APP_ENV = "staging"
```

2. **Deploy via Netlify Dashboard**:
   - Connect GitHub repository
   - Configure build settings
   - Set environment variables
   - Deploy automatically

### 3. Docker Deployment

**Containerized Deployment**: For traditional hosting or cloud platforms.

#### Dockerfile

```dockerfile
# Multi-stage build for production
FROM node:18-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Install dependencies
COPY package.json package-lock.json* ./
RUN npm ci --only=production

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build the application
RUN npm run build

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public

# Set the correct permission for prerender cache
RUN mkdir .next
RUN chown nextjs:nodejs .next

# Automatically leverage output traces to reduce image size
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

CMD ["node", "server.js"]
```

#### Docker Compose

```yaml
version: "3.8"

services:
  groundhog-frontend:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - NEXT_PUBLIC_MAPBOX_KEY=${NEXT_PUBLIC_MAPBOX_KEY}
      - NEXT_PUBLIC_SUPABASE_URL=${NEXT_PUBLIC_SUPABASE_URL}
      - NEXT_PUBLIC_SUPABASE_ANON_KEY=${NEXT_PUBLIC_SUPABASE_ANON_KEY}
      - NEXT_PUBLIC_OPENAI_API_KEY=${NEXT_PUBLIC_OPENAI_API_KEY}
    restart: unless-stopped
    networks:
      - groundhog-network

networks:
  groundhog-network:
    driver: bridge
```

## 🔄 CI/CD Pipeline

### GitHub Actions

**Production Deployment Workflow** (`.github/workflows/deploy.yml`):

```yaml
name: Deploy to Production

on:
  push:
    branches: [main]
  workflow_dispatch:

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: "18"
          cache: "npm"

      - name: Install dependencies
        run: npm ci

      - name: Run tests
        run: npm test

      - name: Run linting
        run: npm run lint

      - name: Type check
        run: npx tsc --noEmit

  build:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: "18"
          cache: "npm"

      - name: Install dependencies
        run: npm ci

      - name: Build application
        run: npm run build:production
        env:
          NEXT_PUBLIC_MAPBOX_KEY: ${{ secrets.NEXT_PUBLIC_MAPBOX_KEY }}
          NEXT_PUBLIC_SUPABASE_URL: ${{ secrets.NEXT_PUBLIC_SUPABASE_URL }}
          NEXT_PUBLIC_SUPABASE_ANON_KEY: ${{ secrets.NEXT_PUBLIC_SUPABASE_ANON_KEY }}
          NEXT_PUBLIC_OPENAI_API_KEY: ${{ secrets.NEXT_PUBLIC_OPENAI_API_KEY }}

      - name: Upload build artifacts
        uses: actions/upload-artifact@v3
        with:
          name: build-files
          path: .next

  deploy:
    needs: build
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Download build artifacts
        uses: actions/download-artifact@v3
        with:
          name: build-files
          path: .next

      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: "--prod"
```

**Staging Deployment Workflow** (`.github/workflows/deploy-staging.yml`):

```yaml
name: Deploy to Staging

on:
  push:
    branches: [develop]
  pull_request:
    branches: [main]

jobs:
  deploy-staging:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: "18"
          cache: "npm"

      - name: Install dependencies
        run: npm ci

      - name: Build application
        run: npm run build:staging
        env:
          NEXT_PUBLIC_APP_ENV: staging
          NEXT_PUBLIC_MAPBOX_KEY: ${{ secrets.STAGING_MAPBOX_KEY }}
          NEXT_PUBLIC_SUPABASE_URL: ${{ secrets.STAGING_SUPABASE_URL }}
          NEXT_PUBLIC_SUPABASE_ANON_KEY: ${{ secrets.STAGING_SUPABASE_ANON_KEY }}
          NEXT_PUBLIC_OPENAI_API_KEY: ${{ secrets.STAGING_OPENAI_API_KEY }}

      - name: Deploy to Staging
        uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: "--target staging"
```

### GitLab CI

**GitLab CI Configuration** (`.gitlab-ci.yml`):

```yaml
stages:
  - test
  - build
  - deploy

variables:
  NODE_VERSION: "18"

cache:
  paths:
    - node_modules/

test:
  stage: test
  image: node:${NODE_VERSION}-alpine
  script:
    - npm ci
    - npm test
    - npm run lint
    - npx tsc --noEmit
  only:
    - main
    - develop
    - merge_requests

build:production:
  stage: build
  image: node:${NODE_VERSION}-alpine
  script:
    - npm ci
    - npm run build:production
  artifacts:
    paths:
      - .next/
    expire_in: 1 hour
  only:
    - main

build:staging:
  stage: build
  image: node:${NODE_VERSION}-alpine
  script:
    - npm ci
    - npm run build:staging
  artifacts:
    paths:
      - .next/
    expire_in: 1 hour
  only:
    - develop

deploy:production:
  stage: deploy
  image: alpine:latest
  before_script:
    - apk add --no-cache curl
  script:
    - curl -X POST $VERCEL_DEPLOY_HOOK
  environment:
    name: production
    url: https://your-domain.com
  only:
    - main

deploy:staging:
  stage: deploy
  image: alpine:latest
  before_script:
    - apk add --no-cache curl
  script:
    - curl -X POST $VERCEL_STAGING_DEPLOY_HOOK
  environment:
    name: staging
    url: https://staging.your-domain.com
  only:
    - develop
```

## 🔒 Security Configuration

### Security Headers

**Next.js Security Headers**:

```typescript
// next.config.ts
async headers() {
  return [
    {
      source: '/(.*)',
      headers: [
        {
          key: 'X-Frame-Options',
          value: 'DENY',
        },
        {
          key: 'X-Content-Type-Options',
          value: 'nosniff',
        },
        {
          key: 'Referrer-Policy',
          value: 'origin-when-cross-origin',
        },
        {
          key: 'Permissions-Policy',
          value: 'camera=(), microphone=(), geolocation=()',
        },
        {
          key: 'Strict-Transport-Security',
          value: 'max-age=31536000; includeSubDomains',
        },
      ],
    },
  ];
},
```

### Environment Variable Security

**Secrets Management**:

```bash
# Never commit secrets to version control
echo ".env.local" >> .gitignore
echo ".env.production" >> .gitignore
echo ".env.staging" >> .gitignore

# Use platform-specific secret management
# Vercel
vercel env add NEXT_PUBLIC_MAPBOX_KEY

# Netlify
# Set via dashboard or CLI

# Docker
# Use .env files or Docker secrets
```

## 📊 Monitoring & Analytics

### Performance Monitoring

**Vercel Analytics**:

```typescript
// app/layout.tsx
import { Analytics } from "@vercel/analytics/react";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
```

**Custom Performance Monitoring**:

```typescript
// lib/analytics.ts
export const trackPageView = (url: string) => {
  if (typeof window !== "undefined" && window.gtag) {
    window.gtag("config", process.env.NEXT_PUBLIC_GA_TRACKING_ID, {
      page_path: url,
    });
  }
};

export const trackEvent = (
  action: string,
  category: string,
  label?: string
) => {
  if (typeof window !== "undefined" && window.gtag) {
    window.gtag("event", action, {
      event_category: category,
      event_label: label,
    });
  }
};
```

### Error Tracking

**Sentry Integration**:

```typescript
// lib/sentry.ts
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NEXT_PUBLIC_APP_ENV,
  tracesSampleRate: 1.0,
});

export { Sentry };
```

## 🌐 Domain & SSL Configuration

### Custom Domain Setup

**Vercel Domain Configuration**:

```bash
# Add custom domain
vercel domains add your-domain.com

# Configure DNS records
# Add CNAME record pointing to cname.vercel-dns.com
```

**Netlify Domain Configuration**:

```bash
# Add custom domain via dashboard
# Configure DNS records
# Add CNAME record pointing to your-site.netlify.app
```

### SSL Certificate

**Automatic SSL**:

- Vercel and Netlify provide automatic SSL certificates
- Let's Encrypt for custom hosting
- Cloudflare for additional SSL options

## 📈 Scaling & Performance

### Performance Optimization

**Build Optimization**:

```typescript
// next.config.ts
const nextConfig = {
  experimental: {
    optimizeCss: true,
    optimizePackageImports: ["@radix-ui/react-icons"],
  },

  // Bundle analyzer
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        fs: false,
        net: false,
        tls: false,
      };
    }
    return config;
  },
};
```

**CDN Configuration**:

```typescript
// next.config.ts
const nextConfig = {
  async headers() {
    return [
      {
        source: "/static/(.*)",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
    ];
  },
};
```

### Load Balancing

**Multiple Instances**:

```yaml
# docker-compose.yml
version: "3.8"

services:
  groundhog-frontend-1:
    build: .
    ports:
      - "3001:3000"
    environment:
      - NODE_ENV=production
    restart: unless-stopped

  groundhog-frontend-2:
    build: .
    ports:
      - "3002:3000"
    environment:
      - NODE_ENV=production
    restart: unless-stopped

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
    depends_on:
      - groundhog-frontend-1
      - groundhog-frontend-2
```

## 🔄 Rollback & Recovery

### Rollback Strategy

**Vercel Rollback**:

```bash
# List deployments
vercel ls

# Rollback to previous deployment
vercel rollback <deployment-id>

# Rollback to specific version
vercel rollback <deployment-url>
```

**Docker Rollback**:

```bash
# Tag current image
docker tag groundhog-frontend:latest groundhog-frontend:backup

# Pull previous image
docker pull groundhog-frontend:previous

# Restart with previous image
docker-compose down
docker-compose up -d
```

### Backup Strategy

**Database Backups**:

```bash
# Supabase automatic backups
# Daily backups with 7-day retention
# Point-in-time recovery available

# Manual backup export
pg_dump -h your-host -U your-user -d your-db > backup.sql
```

**Application Backups**:

```bash
# Build artifacts
tar -czf build-backup-$(date +%Y%m%d).tar.gz .next/

# Environment configuration
cp .env.production .env.production.backup
```

## 🧪 Testing Deployment

### Pre-deployment Testing

**Local Production Build**:

```bash
# Test production build locally
npm run build:production
npm start

# Test with production environment variables
NODE_ENV=production npm run build
```

**Staging Environment Testing**:

```bash
# Deploy to staging first
npm run build:staging
vercel --target staging

# Test all functionality
# Verify API integrations
# Check performance metrics
```

### Post-deployment Verification

**Health Checks**:

```bash
# Check application status
curl -f https://your-domain.com/api/health

# Verify environment variables
curl -f https://your-domain.com/api/config

# Test critical functionality
# Login, dashboard, maps, etc.
```

## 📞 Support & Troubleshooting

### Common Deployment Issues

1. **Build Failures**:

   - Check Node.js version compatibility
   - Verify all dependencies are installed
   - Check for TypeScript errors

2. **Environment Variable Issues**:

   - Verify all required variables are set
   - Check variable naming (NEXT*PUBLIC* prefix)
   - Restart deployment after variable changes

3. **Performance Issues**:
   - Enable build analysis
   - Check bundle size
   - Optimize images and assets

### Getting Help

- **Platform Documentation**: Check Vercel, Netlify, or Docker docs
- **Next.js Documentation**: Official deployment guides
- **Support Contact**: ntiglao@umd.edu
- **Community**: GitHub discussions and Stack Overflow

---

**Deployment guide completed!** This provides comprehensive instructions for deploying GroundHog Frontend to production. 🚀
