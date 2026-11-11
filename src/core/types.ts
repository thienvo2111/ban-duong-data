export type Category = 'repair' | 'fuel' | 'charging' | 'toilets' | 'baby';
export type Vehicle = 'motorbike' | 'car';
export type Wheelchair = 'yes' | 'limited' | 'no';
export type BabyFeature = 'changingTable' | 'feeding';

export interface LatLon {
  lat: number;
  lon: number;
}

export interface Poi extends LatLon {
  id: string;
  category: Category;
  vehicles: Vehicle[];
  name: string;
  phone?: string;
  address?: string;
  open24h?: boolean;
  /** Chuỗi `opening_hours` gốc của OSM; đọc bằng `openStatus`. */
  openingHours?: string;
  brand?: string;
  /** true: có thu phí; false: miễn phí. */
  fee?: boolean;
  wheelchair?: Wheelchair;
  /** Sửa xe có dịch vụ kéo xe (nhãn "Có kéo xe"). */
  towing?: true;
  /** Đại lý hãng có xưởng dịch vụ (nhãn "Đại lý"). */
  dealer?: true;
  /** Với Nhóm nơi Chăm em bé: có bàn thay tã, chỗ cho bú. */
  babyFeatures?: BabyFeature[];
}

export type PoiWithDistance = Poi & { distanceKm: number };
