export interface FarmLocation {
  id: number;
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
