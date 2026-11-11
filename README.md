# Dữ liệu Bạn Đường

Dữ liệu Điểm (tiệm sửa xe, cây xăng, trạm sạc, nhà vệ sinh, nơi chăm em bé) ở Việt Nam cho app **Bạn Đường**, trích từ [OpenStreetMap](https://www.openstreetmap.org).

**Dữ liệu © [OpenStreetMap contributors](https://www.openstreetmap.org/copyright)**, phát hành theo giấy phép [Open Database License (ODbL) 1.0](https://opendatacommons.org/licenses/odbl/1-0/) (xem `LICENSE`). Bạn được dùng, chia sẻ, sửa đổi với điều kiện ghi nguồn như trên và phát hành bản phái sinh theo cùng giấy phép.

## Tải về

URL cố định tới bản mới nhất:

- `https://github.com/thienvo2111/ban-duong-data/releases/latest/download/manifest.json`
- File dữ liệu: `https://github.com/thienvo2111/ban-duong-data/releases/download/v<version>/<file>` (lấy `version`, `file` trong manifest)

`manifest.json`:

| Trường | Ý nghĩa |
|---|---|
| `schema` | Dạng dữ liệu Điểm. Tăng khi đổi cấu trúc; app cũ bỏ qua bản có `schema` lạ |
| `version` | Ngày tạo (UTC), `YYYY-MM-DD`; tag phát hành là `v<version>` |
| `count` | Số Điểm |
| `file`, `bytes`, `sha256` | Tên, kích thước và SHA-256 của file `.json.gz` |
| `license`, `attribution` | ODbL-1.0, © OpenStreetMap contributors |

## Cách tạo ra (ODbL mục 4.6)

GitHub Actions (`.github/workflows/data.yml`) chạy mỗi tuần (02:17 sáng thứ Hai giờ Việt Nam) hoặc bấm tay:

1. `npm run data`: **một** truy vấn Overpass (xem `QUERY` trong `scripts/fetch-osm.ts`), có User-Agent, lỗi thì thử lại đúng một lần. Máy chủ chính lỗi lâu thì đặt biến repo `OVERPASS_URL` sang máy chủ khác.
2. `npm run release`: nén gzip -9, dừng nếu ít hơn 1.000 Điểm hoặc giảm hơn 20% so với bản trước, viết `manifest.json`.
3. Đăng `manifest.json` + file `.gz` lên GitHub Releases bằng `GITHUB_TOKEN` sẵn có.

Chạy trên máy: `npm ci && npm run data && npm run release`.

## Nguồn gốc mã

`scripts/fetch-osm.ts`, `src/core/osm.ts`, `src/core/types.ts` là **bản sao** từ repo app Bạn Đường (riêng tư). Bản gốc nằm ở repo app; sửa ở đó trước rồi chép sang đây.
