import type { BabyFeature, Category, Poi, Vehicle, Wheelchair } from './types';

export interface OsmElement {
  type: string;
  id: number;
  lat?: number;
  lon?: number;
  center?: { lat: number; lon: number };
  tags?: Record<string, string>;
}

type Tags = Record<string, string>;

const BOTH: Vehicle[] = ['motorbike', 'car'];

const FALLBACK_NAME: Record<Category, string> = {
  repair: 'Tiệm sửa xe',
  fuel: 'Cây xăng',
  charging: 'Trạm sạc',
  toilets: 'Nhà vệ sinh',
  baby: 'Chỗ chăm em bé',
};

// Hãng xe máy có xưởng dịch vụ uỷ nhiệm (HEAD Honda, 3S Yamaha…) — #15, #16.
const MOTORBIKE_WORKSHOP_BRANDS = /^(honda|yamaha|suzuki|piaggio|vespa|sym|vinfast|kymco)\b/i;

const KNOWN_BRANDS: Record<string, string> = {
  petrolimex: 'Petrolimex',
  'pv oil': 'PV Oil',
  pvoil: 'PV Oil',
  vinfast: 'VinFast',
  mipec: 'Mipec',
  honda: 'Honda',
  yamaha: 'Yamaha',
};

interface Kind {
  category: Category;
  vehicles: Vehicle[];
  dealer?: true;
}

function classify(tags: Tags): Kind | null {
  if (tags.shop === 'motorcycle_repair') return { category: 'repair', vehicles: ['motorbike'] };
  if (tags.shop === 'car_repair') return { category: 'repair', vehicles: ['car'] };
  if (tags.shop === 'tyres') return { category: 'repair', vehicles: BOTH };
  if (tags.shop === 'motorcycle' && isMotorbikeWorkshop(tags)) return { category: 'repair', vehicles: ['motorbike'], dealer: true };
  if (tags.shop === 'car' && (hasRepair(tags) || tags.brand)) return { category: 'repair', vehicles: ['car'], dealer: true };
  if (tags.amenity === 'fuel') return { category: 'fuel', vehicles: BOTH };
  if (tags.amenity === 'toilets') return { category: 'toilets', vehicles: BOTH };
  if (tags.amenity === 'charging_station') return { category: 'charging', vehicles: chargingVehicles(tags) };
  return null;
}

const hasRepair = (tags: Tags) => tags['service:vehicle:repair'] === 'yes';
const isMotorbikeWorkshop = (tags: Tags) => hasRepair(tags) || MOTORBIKE_WORKSHOP_BRANDS.test(tags.brand ?? '');

function chargingVehicles(tags: Tags): Vehicle[] {
  const vehicles: Vehicle[] = [];
  if (tags.motorcycle === 'yes' || tags.scooter === 'yes') vehicles.push('motorbike');
  if (tags.motorcar === 'yes') vehicles.push('car');
  return vehicles.length ? vehicles : BOTH;
}

function address(tags: Tags): string | undefined {
  const street = [tags['addr:housenumber'], tags['addr:street']].filter(Boolean).join(' ');
  const full = [street, tags['addr:city']].filter(Boolean).join(', ');
  return full || undefined;
}

function brand(raw: string | undefined): string | undefined {
  const trimmed = raw?.trim();
  if (!trimmed) return undefined;
  return KNOWN_BRANDS[trimmed.toLowerCase()] ?? trimmed;
}

function fee(raw: string | undefined): boolean | undefined {
  if (!raw) return undefined;
  if (raw === 'no') return false;
  if (raw === 'yes' || /\d/.test(raw)) return true;
  return undefined;
}

function wheelchair(raw: string | undefined): Wheelchair | undefined {
  if (raw === 'yes' || raw === 'designated') return 'yes';
  if (raw === 'limited' || raw === 'no') return raw;
  return undefined;
}

function babyFeatures(tags: Tags): BabyFeature[] {
  const features: BabyFeature[] = [];
  if (/^(yes|limited|room)$/.test(tags.changing_table ?? '')) features.push('changingTable');
  if (/^(yes|room)$/.test(tags.baby_feeding ?? '')) features.push('feeding');
  return features;
}

function coords(el: OsmElement) {
  const lat = el.lat ?? el.center?.lat;
  const lon = el.lon ?? el.center?.lon;
  return lat === undefined || lon === undefined ? null : { lat, lon };
}

function base(el: OsmElement, tags: Tags, id: string, kind: Kind, at: { lat: number; lon: number }): Poi {
  const poi: Poi = { id, category: kind.category, vehicles: kind.vehicles, name: tags.name || FALLBACK_NAME[kind.category], ...at };
  const extras: Partial<Poi> = {
    phone: tags.phone ?? tags['contact:phone'],
    address: address(tags),
    open24h: tags.opening_hours === '24/7' ? true : undefined,
    openingHours: tags.opening_hours,
    brand: brand(tags.brand),
    fee: fee(tags.fee),
    wheelchair: wheelchair(tags.wheelchair),
    dealer: kind.dealer,
    towing: kind.category === 'repair' && tags['service:vehicle:towing'] === 'yes' ? true : undefined,
  };
  for (const [k, v] of Object.entries(extras)) if (v !== undefined && v !== '') (poi as unknown as Record<string, unknown>)[k] = v;
  return poi;
}

/** Điểm chính của một phần tử OSM (Sửa xe, Cây xăng, Trạm sạc, Nhà vệ sinh), hoặc null. */
export function normalizeOsmElement(el: OsmElement): Poi | null {
  const at = coords(el);
  const tags = el.tags;
  if (!at || !tags) return null;
  const kind = classify(tags);
  return kind ? base(el, tags, `${el.type}/${el.id}`, kind, at) : null;
}

/** Mọi Điểm từ một phần tử OSM: Điểm chính, cộng Điểm Chăm em bé nếu có bàn thay tã / chỗ cho bú. */
export function poisFromOsm(el: OsmElement): Poi[] {
  const out: Poi[] = [];
  const primary = normalizeOsmElement(el);
  if (primary) out.push(primary);
  const at = coords(el);
  const tags = el.tags;
  if (!at || !tags) return out;
  const features = babyFeatures(tags);
  if (features.length) {
    const baby = base(el, tags, `${el.type}/${el.id}#baby`, { category: 'baby', vehicles: BOTH }, at);
    delete baby.fee;
    delete baby.wheelchair;
    out.push({ ...baby, babyFeatures: features });
  }
  return out;
}
