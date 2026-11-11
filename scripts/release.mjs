// Nén data/vn-poi.json, kiểm tra, ghi dist/ (file .gz + manifest.json) và manifest.json ở gốc repo.
// Dừng (exit 1) nếu dữ liệu quá ít hoặc giảm hơn 20% so với bản phát hành trước: không bao giờ đè bản tốt bằng bản hỏng.
import { createHash } from 'node:crypto';
import { appendFileSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { gzipSync } from 'node:zlib';

const SCHEMA = 1;
const MIN_COUNT = 1000;
const MAX_DROP = 0.2;
const LATEST = 'https://github.com/thienvo2111/ban-duong-data/releases/latest/download/manifest.json';

const json = readFileSync('data/vn-poi.json');
const pois = JSON.parse(json.toString('utf8'));
if (!Array.isArray(pois) || pois.length < MIN_COUNT) fail(`Chỉ có ${pois.length} điểm, dưới ngưỡng ${MIN_COUNT}`);

const prev = await fetch(LATEST).then((r) => (r.ok ? r.json() : null)).catch(() => null);
if (prev?.count && pois.length < prev.count * (1 - MAX_DROP)) {
  fail(`Số điểm giảm từ ${prev.count} xuống ${pois.length} (hơn ${MAX_DROP * 100}%)`);
}

const now = new Date();
const version = now.toISOString().slice(0, 10);
const file = `vn-poi-${version}.json.gz`;
const gz = gzipSync(json, { level: 9 });
const manifest = {
  schema: SCHEMA,
  version,
  createdAt: now.toISOString().replace(/\.\d+Z$/, 'Z'),
  count: pois.length,
  file,
  bytes: gz.length,
  sha256: createHash('sha256').update(gz).digest('hex'),
  license: 'ODbL-1.0',
  attribution: '© OpenStreetMap contributors',
};

mkdirSync('dist', { recursive: true });
writeFileSync(`dist/${file}`, gz);
const text = JSON.stringify(manifest, null, 2) + '\n';
writeFileSync('dist/manifest.json', text);
writeFileSync('manifest.json', text);
if (process.env.GITHUB_OUTPUT) appendFileSync(process.env.GITHUB_OUTPUT, `version=${version}\n`);
console.log(manifest);

function fail(msg) {
  console.error(`Không phát hành: ${msg}`);
  process.exit(1);
}
