export interface FarmLocation {
  id: number;
  farm_id: string;
  farm_name: string;
  farmer_name: string;
  created_at: string; // or `Date` if you'll parse it
  lat: number;
  long: number;
}

export interface ChemicalEstimate {
  id: number;
  farmID: string;
  created_at: string;
  nitrogen: number;
  phosphorus: number;
  potassium: number;
  ec: number;
  sulphur: number;
  ph: number;
  zinc: number;
  iron: number;
  boron: number;
  copper: number;
}

export interface Waypoint {
  id: string;
  farm_id: string;
  name: string;
  lat: number;
  long: number;
  order_index: number;
  created_at: string;
}

export interface WaypointPath {
  id: string;
  farm_id: string;
  name: string;
  description?: string;
  waypoints: Waypoint[];
  created_at: string;
  is_active: boolean;
}

export interface RoverNavigationCommand {
  command: "start_navigation" | "stop_navigation" | "load_waypoints";
  path_id?: string;
  waypoints?: Array<{ lat: number; long: number; order_index: number }>;
}
