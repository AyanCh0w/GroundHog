export interface FarmLocation {
  id: number;
  name: string;
  created_at: string; // or `Date` if you'll parse it
  lat: number;
  long: number;
  lat_bounds_one: number | null;
  lat_bounds_two: number | null;
  long_bounds_one: number | null;
  long_bounds_two: number | null;
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
