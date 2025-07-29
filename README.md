# GroundHog Frontend

A modern web application for precision agriculture that provides farmers with real-time soil health monitoring through an autonomous rover system.

## 🌱 About GroundHog

GroundHog is an innovative precision agriculture solution that helps farmers monitor soil health more efficiently by automating the process of checking critical soil conditions. The system reduces inefficient irrigation practices and prevents unnecessary crop deaths through overwatering.

### Key Features

- **Real-time Soil Monitoring**: Track pH, nutrient levels, temperature, and moisture across your farm
- **Interactive Heatmaps**: Visualize soil data with color-coded heatmaps for different parameters
- **Chemical Analysis Dashboard**: View detailed soil nutrient analysis including macronutrients and micronutrients
- **Farm Management**: Multi-farm support with individual dashboards
- **GPS Integration**: Precise location tracking for soil sampling points
- **Responsive Design**: Modern UI that works on desktop and mobile devices

## 🚀 Technology Stack

- **Framework**: Next.js 15.4.2 with React 19.1.0
- **Language**: TypeScript
- **Styling**: Tailwind CSS 4
- **Maps**: Mapbox GL JS
- **Charts**: Recharts
- **Database**: Supabase
- **UI Components**: Radix UI + Custom components
- **Icons**: Lucide React

## 📋 Prerequisites

Before running this application, you'll need:

- Node.js 18+
- npm or yarn
- A Mapbox API key
- A Supabase project with the following tables:
  - `farmData` (farm information)
  - `chemicalEstimate` (soil analysis data)
  - `rover-points` (GPS and sensor data)

## 🛠️ Installation

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd groundhog-frontend
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Environment Setup**
   Create a `.env.local` file in the root directory:

   ```env
   NEXT_PUBLIC_MAPBOX_KEY=your_mapbox_api_key_here
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. **Run the development server**

   ```bash
   npm run dev
   ```

5. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 🏗️ Project Structure

```
groundhog-frontend/
├── app/                    # Next.js app directory
│   ├── dashboard/         # Main dashboard page
│   ├── login/            # Farm login page
│   ├── onboard/          # Farm registration page
│   ├── globals.css       # Global styles
│   ├── layout.tsx        # Root layout
│   └── page.tsx          # Landing page
├── components/           # Reusable UI components
│   ├── ui/              # Base UI components
│   └── heatmapConfig.ts # Heatmap configuration
├── lib/                  # Utility libraries
│   ├── supabaseClient.ts # Supabase client
│   ├── types.ts          # TypeScript definitions
│   └── utils.ts          # Utility functions
└── package.json          # Dependencies and scripts
```

## 🎯 Features Overview

### 1. Landing Page (`/`)

- Animated splash screen with GroundHog branding
- Detailed project description with typewriter effect
- Video background showcasing agricultural themes
- Navigation to login and onboarding

### 2. Farm Onboarding (`/onboard`)

- Multi-step farm registration process
- Interactive map for farm location selection
- GPS integration for automatic location detection
- Farm and farmer information collection

### 3. Farm Login (`/login`)

- Simple farm ID-based authentication
- Cookie-based session management
- Error handling for invalid farm IDs
- Direct link to onboarding for new farms

### 4. Dashboard (`/dashboard`)

- **Interactive Map**: Real-time soil data visualization with heatmaps
- **Sensor Selection**: Toggle between moisture, temperature, pH, and EC views
- **Chemical Analysis**: Detailed soil nutrient breakdown
- **Responsive Layout**: Collapsible sidebar for different screen sizes
- **Map Controls**: Satellite/street view toggle and navigation controls

## 📊 Data Visualization

### Heatmap Layers

The application supports four different sensor types with custom color schemes:

- **Moisture**: Blue to red gradient (dry to wet)
- **Temperature**: Blue to red gradient (cold to hot)
- **pH**: White to red gradient (neutral to acidic/alkaline)
- **Electrical Conductivity**: Blue to purple gradient (low to high)

### Chemical Analysis Charts

- **Macronutrients**: Nitrogen, Phosphorus, Potassium (Kg/Ha)
- **Micronutrients**: Copper, Iron, Zinc, Boron (PPM)
- **Soil Properties**: pH, EC, Sulphur content

## 🔧 Configuration

### Heatmap Configuration

Edit `components/heatmapConfig.ts` to customize:

- Color schemes for different sensor types
- Intensity and radius settings
- Opacity levels

### Map Styles

Available map styles in the dashboard:

- `standard-satellite`: Satellite imagery
- `outdoors-v12`: Street map view

## 🚀 Deployment

### Build for Production

```bash
npm run build
npm start
```

### Environment Variables for Production

Ensure all environment variables are properly set in your production environment:

- `NEXT_PUBLIC_MAPBOX_KEY`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:

- Check the documentation
- Open an issue on GitHub
- Contact the development team

## 🔮 Future Enhancements

- Real-time data streaming via WebSockets
- Mobile app companion
- Advanced analytics and predictions
- Integration with weather APIs
- Export functionality for reports
- Multi-language support

---

**GroundHog**: Know Your Soil, Grow Your Future 🌱
