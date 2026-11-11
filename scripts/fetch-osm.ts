/// <reference types="node" />
// Lấy điểm OSM ở Việt Nam qua Overpass → data/vn-poi.json. Chạy: npm run data
import { writeFileSync } from 'node:fs';
import { poisFromOsm, type OsmElement } from '../src/core/osm';
import type { Poi } from '../src/core/types';

const ENDPOINT = process.env.OVERPASS_URL ?? 'https://overpass-api.de/api/interpreter';
const OUT = new URL('../data/vn-poi.json', import.meta.url);

const QUERY = `[out:json][timeout:300];
area["ISO3166-1"="VN"][admin_level=2]->.vn;
(
  nwr["shop"~"^(motorcycle_repair|car_repair|tyres)$"](area.vn);
  nwr["amenity"~"^(fuel|charging_station|toilets)$"](area.vn);
  nwr["shop"~"^(motorcycle|car)$"]["brand"](area.vn);
  nwr["shop"~"^(motorcycle|car)$"]["service:vehicle:repair"="yes"](area.vn);
  nwr["changing_table"~"^(yes|limited|room)$"](area.vn);
  nwr["baby_feeding"~"^(yes|room)$"](area.vn);
);
out center tags;`;

async function fetchElements(): Promise<OsmElement[]> {
  const res = await fetch(ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'User-Agent': 'app-tim-cho-sua-xe/0.1' },
    body: new URLSearchParams({ data: QUERY }),
  });
  if (!res.ok) throw new Error(`Overpass trả về ${res.status}`);
  return ((await res.json()) as { elements: OsmElement[] }).elements;
}

const round = (n: number) => Math.round(n * 1e5) / 1e5;

async function main() {
  const elements = await fetchElements().catch((err) => {
    console.warn('Lần 1 lỗi, thử lại:', err.message);
    return fetchElements();
  });
  const pois: Poi[] = elements
    .flatMap(poisFromOsm)
    .map((p) => ({ ...p, lat: round(p.lat), lon: round(p.lon) }));

  writeFileSync(OUT, JSON.stringify(pois));
  const counts = pois.reduce<Record<string, number>>((acc, p) => ({ ...acc, [p.category]: (acc[p.category] ?? 0) + 1 }), {});
  const tags = { dealer: pois.filter((p) => p.dealer).length, towing: pois.filter((p) => p.towing).length, openingHours: pois.filter((p) => p.openingHours).length };
  console.log(`Đã ghi ${pois.length} điểm`, counts, tags);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
