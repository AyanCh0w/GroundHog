# GroundHog Frontend - API Documentation

This document provides comprehensive information about all API integrations, external services, and internal communication patterns used in the GroundHog Frontend system.

## 🌐 External API Integrations

### 1. Mapbox API

**Purpose**: Interactive mapping and location services

**Base URL**: `https://api.mapbox.com/`

**Authentication**: API Key via `NEXT_PUBLIC_MAPBOX_KEY`

#### Map Styles
```typescript
// Available map styles
const MAP_STYLES = {
  satellite: 'mapbox://styles/mapbox/satellite-v9',
  street: 'mapbox://styles/mapbox/outdoors-v12',
  standard: 'mapbox://styles/mapbox/streets-v12'
};
```

#### Key Endpoints

**Geocoding API**
```typescript
// Forward geocoding (address to coordinates)
const geocodeAddress = async (address: string) => {
  const response = await fetch(
    `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(address)}.json?access_token=${mapboxKey}&country=US`
  );
  return response.json();
};
```

**Directions API**
```typescript
// Get route between waypoints
const getRoute = async (waypoints: Array<{lat: number, lng: number}>) => {
  const coordinates = waypoints.map(wp => `${wp.lng},${wp.lat}`).join(';');
  const response = await fetch(
    `https://api.mapbox.com/directions/v5/mapbox/driving/${coordinates}?access_token=${mapboxKey}&geometries=geojson`
  );
  return response.json();
};
```

**Usage Limits**:
- **Free Tier**: 50,000 map loads/month
- **Geocoding**: 100,000 requests/month
- **Directions**: 5,000 requests/month

### 2. Supabase API

**Purpose**: Database operations and real-time subscriptions

**Base URL**: Configured via `NEXT_PUBLIC_SUPABASE_URL`

**Authentication**: API Key via `NEXT_PUBLIC_SUPABASE_ANON_KEY`

#### Database Operations

**Farm Location Management**
```typescript
// Create new farm
const createFarm = async (farmData: FarmLocation) => {
  const { data, error } = await supabase
    .from('farm_location')
    .insert([farmData])
    .select();
  
  if (error) throw error;
  return data[0];
};

// Get farm by ID
const getFarm = async (farmId: string) => {
  const { data, error } = await supabase
    .from('farm_location')
    .select('*')
    .eq('farm_id', farmId)
    .single();
  
  if (error) throw error;
  return data;
};
```

**Sensor Data Management**
```typescript
// Insert sensor reading
const insertSensorData = async (sensorData: RoverPoint) => {
  const { data, error } = await supabase
    .from('rover_points')
    .insert([sensorData])
    .select();
  
  if (error) throw error;
  return data[0];
};

// Get latest sensor data for farm
const getLatestSensorData = async (farmId: string, limit: number = 100) => {
  const { data, error } = await supabase
    .from('rover_points')
    .select('*')
    .eq('farm_id', farmId)
    .order('created_at', { ascending: false })
    .limit(limit);
  
  if (error) throw error;
  return data;
};
```

**Chemical Analysis Data**
```typescript
// Get chemical analysis history
const getChemicalAnalysis = async (farmId: string) => {
  const { data, error } = await supabase
    .from('chemical_estimate')
    .select('*')
    .eq('farmID', farmId)
    .order('created_at', { ascending: false });
  
  if (error) throw error;
  return data;
};

// Insert AI analysis results
const insertAIAnalysis = async (analysisData: AIAnalysisRecord) => {
  const { data, error } = await supabase
    .from('ai_analysis_records')
    .insert([analysisData])
    .select();
  
  if (error) throw error;
  return data[0];
};
```

#### Real-time Subscriptions

**Sensor Data Updates**
```typescript
// Subscribe to real-time sensor updates
const subscribeToSensorUpdates = (farmId: string, callback: (data: RoverPoint) => void) => {
  return supabase
    .channel('sensor_updates')
    .on('postgres_changes', 
      { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'rover_points',
        filter: `farm_id=eq.${farmId}`
      },
      (payload) => callback(payload.new as RoverPoint)
    )
    .subscribe();
};
```

**Chemical Analysis Updates**
```typescript
// Subscribe to chemical analysis updates
const subscribeToChemicalUpdates = (farmId: string, callback: (data: ChemicalEstimate) => void) => {
  return supabase
    .channel('chemical_updates')
    .on('postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'chemical_estimate',
        filter: `farmID=eq.${farmId}`
      },
      (payload) => callback(payload.new as ChemicalEstimate)
    )
    .subscribe();
};
```

### 3. OpenAI API

**Purpose**: AI-powered soil analysis and recommendations

**Base URL**: `https://api.openai.com/v1/`

**Authentication**: API Key via `NEXT_PUBLIC_OPENAI_API_KEY`

#### Soil Analysis

**Generate Soil Health Analysis**
```typescript
const analyzeSoilHealth = async (sensorData: AIAnalysisInput) => {
  const prompt = `
    Analyze the following soil sensor data and provide recommendations:
    
    pH: ${sensorData.sensor_data.pH}
    Electrical Conductivity: ${sensorData.sensor_data.EC}
    Temperature: ${sensorData.sensor_data.temperature_c}°C
    Moisture: ${sensorData.sensor_data.moisture_pct}%
    
    Predicted Nutrients:
    Nitrogen: ${sensorData.predicted_nutrients.N_ppm} ppm
    Phosphorus: ${sensorData.predicted_nutrients.P_ppm} ppm
    Potassium: ${sensorData.predicted_nutrients.K_ppm} ppm
    
    Provide:
    1. Summary of soil health
    2. Actionable recommendations
    3. Overall status (healthy, needs attention, critical)
  `;

  const completion = await openai.chat.completions.create({
    model: "gpt-4",
    messages: [
      {
        role: "system",
        content: "You are an expert agricultural soil scientist. Provide clear, actionable advice for farmers."
      },
      {
        role: "user",
        content: prompt
      }
    ],
    max_tokens: 500,
    temperature: 0.7
  });

  return completion.choices[0].message.content;
};
```

**Usage Limits**:
- **GPT-4**: Rate limits apply based on subscription tier
- **Token Usage**: Monitor usage in OpenAI dashboard
- **Cost Management**: Set usage alerts and limits

### 4. MQTT API (Template)

**Purpose**: Real-time communication with autonomous rover

**Broker**: `wss://mqtt-dashboard.com:8884/mqtt`

**Note**: Currently implemented as a template for future integration

#### MQTT Topics

**Rover Communication**
```typescript
// Subscribe to rover location updates
const subscribeToRoverLocation = (client: MqttClient) => {
  client.subscribe('jumpstart/ultra', (err) => {
    if (err) {
      console.error('Subscription error:', err);
    } else {
      console.log('Subscribed to rover location updates');
    }
  });
};

// Send navigation commands
const sendNavigationCommand = (client: MqttClient, command: RoverNavigationCommand) => {
  const topic = 'jumpstart/rover/commands';
  const message = JSON.stringify(command);
  client.publish(topic, message);
};
```

## 🔌 Internal API Patterns

### 1. Data Fetching Hooks

**Custom Hooks for API Operations**

**useFarmData Hook**
```typescript
export const useFarmData = (farmId: string) => {
  const [farmData, setFarmData] = useState<FarmLocation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchFarmData = async () => {
      try {
        setLoading(true);
        const data = await getFarm(farmId);
        setFarmData(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch farm data');
      } finally {
        setLoading(false);
      }
    };

    if (farmId) {
      fetchFarmData();
    }
  }, [farmId]);

  return { farmData, loading, error };
};
```

**useSensorData Hook**
```typescript
export const useSensorData = (farmId: string, limit: number = 100) => {
  const [sensorData, setSensorData] = useState<RoverPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSensorData = async () => {
      try {
        setLoading(true);
        const data = await getLatestSensorData(farmId, limit);
        setSensorData(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch sensor data');
      } finally {
        setLoading(false);
      }
    };

    if (farmId) {
      fetchSensorData();
    }
  }, [farmId, limit]);

  return { sensorData, loading, error };
};
```

### 2. Error Handling

**API Error Handler**
```typescript
export class APIError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public code?: string
  ) {
    super(message);
    this.name = 'APIError';
  }
}

export const handleAPIError = (error: any): APIError => {
  if (error instanceof APIError) {
    return error;
  }

  if (error.code === 'PGRST116') {
    return new APIError('Authentication required', 401, 'AUTH_REQUIRED');
  }

  if (error.code === 'PGRST301') {
    return new APIError('Resource not found', 404, 'NOT_FOUND');
  }

  return new APIError(
    error.message || 'An unexpected error occurred',
    500,
    'INTERNAL_ERROR'
  );
};
```

### 3. Request Interceptors

**API Request Wrapper**
```typescript
export const apiRequest = async <T>(
  requestFn: () => Promise<T>,
  retries: number = 3
): Promise<T> => {
  try {
    return await requestFn();
  } catch (error) {
    if (retries > 0 && isRetryableError(error)) {
      await delay(1000 * (4 - retries)); // Exponential backoff
      return apiRequest(requestFn, retries - 1);
    }
    throw error;
  }
};

const isRetryableError = (error: any): boolean => {
  return error.statusCode >= 500 || error.code === 'NETWORK_ERROR';
};

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
```

## 📊 Data Transformation APIs

### 1. Heatmap Data Processing

**Sensor Data to Heatmap Format**
```typescript
export const processSensorDataForHeatmap = (
  sensorData: RoverPoint[],
  sensorType: 'moisture' | 'temperature' | 'pH' | 'EC'
): HeatmapPoint[] => {
  return sensorData
    .filter(point => point[sensorType] !== undefined)
    .map(point => ({
      lat: point.lat,
      lng: point.long,
      value: point[sensorType]!,
      timestamp: new Date(point.created_at).getTime()
    }))
    .sort((a, b) => b.timestamp - a.timestamp); // Most recent first
};
```

**Chemical Data to Chart Format**
```typescript
export const processChemicalDataForCharts = (
  chemicalData: ChemicalEstimate[]
): ChartData => {
  const labels = chemicalData.map(d => 
    new Date(d.created_at).toLocaleDateString()
  );

  return {
    labels,
    datasets: [
      {
        label: 'Nitrogen (Kg/Ha)',
        data: chemicalData.map(d => d.nitrogen),
        borderColor: '#10B981',
        backgroundColor: 'rgba(16, 185, 129, 0.1)'
      },
      {
        label: 'Phosphorus (Kg/Ha)',
        data: chemicalData.map(d => d.phosphorus),
        borderColor: '#3B82F6',
        backgroundColor: 'rgba(59, 130, 246, 0.1)'
      },
      {
        label: 'Potassium (Kg/Ha)',
        data: chemicalData.map(d => d.potassium),
        borderColor: '#F59E0B',
        backgroundColor: 'rgba(245, 158, 11, 0.1)'
      }
    ]
  };
};
```

### 2. GPS Coordinate Processing

**Coordinate Validation**
```typescript
export const validateCoordinates = (lat: number, lng: number): boolean => {
  return lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;
};

export const formatCoordinates = (lat: number, lng: number): string => {
  const latDir = lat >= 0 ? 'N' : 'S';
  const lngDir = lng >= 0 ? 'E' : 'W';
  
  return `${Math.abs(lat).toFixed(6)}°${latDir}, ${Math.abs(lng).toFixed(6)}°${lngDir}`;
};
```

**Distance Calculations**
```typescript
export const calculateDistance = (
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number => {
  const R = 6371; // Earth's radius in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};
```

## 🔒 Security & Authentication

### 1. API Key Management

**Environment Variable Validation**
```typescript
export const validateEnvironmentVariables = (): void => {
  const requiredVars = [
    'NEXT_PUBLIC_MAPBOX_KEY',
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'NEXT_PUBLIC_OPENAI_API_KEY'
  ];

  const missingVars = requiredVars.filter(
    varName => !process.env[varName]
  );

  if (missingVars.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missingVars.join(', ')}`
    );
  }
};
```

### 2. Rate Limiting

**API Rate Limiting**
```typescript
export class RateLimiter {
  private requests: Map<string, number[]> = new Map();
  private maxRequests: number;
  private windowMs: number;

  constructor(maxRequests: number = 100, windowMs: number = 60000) {
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
  }

  isAllowed(key: string): boolean {
    const now = Date.now();
    const windowStart = now - this.windowMs;
    
    if (!this.requests.has(key)) {
      this.requests.set(key, [now]);
      return true;
    }

    const requests = this.requests.get(key)!;
    const validRequests = requests.filter(time => time > windowStart);
    
    if (validRequests.length < this.maxRequests) {
      validRequests.push(now);
      this.requests.set(key, validRequests);
      return true;
    }

    return false;
  }
}
```

## 📱 Mobile API Considerations

### 1. Responsive API Design

**Mobile-Optimized Endpoints**
```typescript
// Optimize data payloads for mobile
export const getMobileOptimizedSensorData = async (
  farmId: string,
  limit: number = 50
) => {
  const { data, error } = await supabase
    .from('rover_points')
    .select('lat,long,moisture,temperature,pH,EC,created_at')
    .eq('farm_id', farmId)
    .order('created_at', { ascending: false })
    .limit(limit);
  
  if (error) throw error;
  
  // Reduce precision for mobile optimization
  return data.map(point => ({
    ...point,
    lat: Math.round(point.lat * 1000000) / 1000000,
    long: Math.round(point.long * 1000000) / 1000000
  }));
};
```

### 2. Offline Support

**Offline Data Storage**
```typescript
export const storeOfflineData = (key: string, data: any): void => {
  if (typeof window !== 'undefined' && 'localStorage' in window) {
    localStorage.setItem(key, JSON.stringify({
      data,
      timestamp: Date.now()
    }));
  }
};

export const getOfflineData = (key: string): any | null => {
  if (typeof window !== 'undefined' && 'localStorage' in window) {
    const stored = localStorage.getItem(key);
    if (stored) {
      const { data, timestamp } = JSON.parse(stored);
      // Data expires after 1 hour
      if (Date.now() - timestamp < 3600000) {
        return data;
      }
    }
  }
  return null;
};
```

## 🧪 Testing APIs

### 1. Mock API Responses

**Mock Data Generators**
```typescript
export const generateMockSensorData = (count: number): RoverPoint[] => {
  return Array.from({ length: count }, (_, i) => ({
    id: `mock-${i}`,
    created_at: new Date(Date.now() - i * 60000).toISOString(),
    farm_id: 'MOCK_FARM',
    moisture: Math.random() * 100,
    temperature: 15 + Math.random() * 30,
    pH: 5 + Math.random() * 4,
    EC: Math.random() * 3,
    lat: 38.9072 + (Math.random() - 0.5) * 0.01,
    long: -77.0369 + (Math.random() - 0.5) * 0.01
  }));
};
```

### 2. API Testing Utilities

**Test Helpers**
```typescript
export const mockSupabaseClient = () => ({
  from: jest.fn().mockReturnThis(),
  select: jest.fn().mockReturnThis(),
  insert: jest.fn().mockReturnThis(),
  eq: jest.fn().mockReturnThis(),
  order: jest.fn().mockReturnThis(),
  limit: jest.fn().mockReturnThis(),
  single: jest.fn().mockReturnThis()
});

export const createMockResponse = <T>(data: T, error: any = null) => ({
  data,
  error
});
```

## 📊 API Monitoring & Analytics

### 1. Performance Tracking

**API Response Time Monitoring**
```typescript
export const trackAPIPerformance = async <T>(
  operation: string,
  apiCall: () => Promise<T>
): Promise<T> => {
  const startTime = performance.now();
  
  try {
    const result = await apiCall();
    const duration = performance.now() - startTime;
    
    // Log performance metrics
    console.log(`API ${operation} completed in ${duration.toFixed(2)}ms`);
    
    return result;
  } catch (error) {
    const duration = performance.now() - startTime;
    console.error(`API ${operation} failed after ${duration.toFixed(2)}ms:`, error);
    throw error;
  }
};
```

### 2. Error Tracking

**API Error Logging**
```typescript
export const logAPIError = (
  operation: string,
  error: any,
  context?: Record<string, any>
) => {
  const errorLog = {
    timestamp: new Date().toISOString(),
    operation,
    error: {
      message: error.message,
      code: error.code,
      statusCode: error.statusCode
    },
    context,
    userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : 'server'
  };

  console.error('API Error:', errorLog);
  
  // Send to error tracking service (e.g., Sentry)
  // captureException(error, { extra: errorLog });
};
```

## 📞 Support & Troubleshooting

### Common API Issues

1. **Authentication Errors**:
   - Verify API keys are correctly set
   - Check environment variable names
   - Ensure keys have proper permissions

2. **Rate Limiting**:
   - Monitor API usage in service dashboards
   - Implement exponential backoff for retries
   - Consider upgrading service tiers

3. **Network Issues**:
   - Check internet connectivity
   - Verify firewall settings
   - Test with different networks

### Getting Help

- **API Documentation**: Check individual service documentation
- **Service Status**: Monitor service health dashboards
- **Support Contact**: ntiglao@umd.edu
- **Error Logs**: Check browser console and server logs

---

**API documentation completed!** This covers all external integrations and internal communication patterns. 🌐


