# AGENTS.md — Astro Headless WordPress Auto Builder

> Antigravity (và mọi agentic IDE) đọc file này như "luật dự án". Mọi agent chạy
> trong repo này PHẢI tuân thủ toàn bộ phần HARD RULES trước khi viết code.

## MISSION
Chuyển UI tĩnh (React/Next.js TSX export từ Lovable/v0) thành code Astro
production-ready, kết nối Headless WordPress (WPGraphQL + ACF Pro + Polylang +
Rank Math), theo một quy trình lặp lại được cho nhiều website.

## TECH STACK & CONVENTIONS
- Frontend: Astro + Tailwind CSS (Tailwind v4 qua `@tailwindcss/vite`).
- Backend: Headless WordPress. Data layer: WPGraphQL, ACF Pro,
  WPGraphQL for Polylang, WPGraphQL Rank Math (hoặc Yoast — xem rule SEO).
- Quy ước thư mục (KHÔNG được đặt sai chỗ):
  - `src/lib/wp.ts`        → client GraphQL DUY NHẤT. Mọi fetch đi qua đây.
  - `src/lib/i18n.ts`      → cấu hình locale + helper Polylang.
  - `src/lib/seo.ts`       → map SEO node → props BaseLayout.
  - `src/lib/options.ts`   → fetch các ACF Options Page.
  - `src/layouts/BaseLayout.astro` → wrapper chuẩn (lang + meta SEO).
  - `src/components/*.astro`       → component THUẦN PRESENTATIONAL (nhận props).
  - `src/pages/**`                 → trang: nơi GỌI fetch và truyền props xuống.
  - `src/graphql/queries/*.ts`     → query string, tách khỏi UI.
  - `schema/schema.graphql`        → schema thật của WP (sinh bởi introspect).
  - `design-source/`               → nơi user quăng export Lovable/Next.js.

## HARD RULES (vi phạm = task FAIL)
1. **INTROSPECT-FIRST.** Trước khi viết BẤT KỲ query nào, đọc `schema/schema.graphql`.
   Nếu file chưa có → dừng và yêu cầu user chạy `npm run wp:introspect`.
   CẤM bịa tên field. Mọi field trong query phải tồn tại trong schema.
2. **DRY / single client.** Không viết `fetch(endpoint...)` trong frontmatter component.
   Mọi truy vấn gọi qua `wpQuery()` trong `src/lib/wp.ts`. Endpoint chỉ đọc từ `.env`.
   CẤM hardcode URL WordPress.
3. **Component = presentational.** Component nhận data qua `Props`, KHÔNG tự fetch.
   Trang (`src/pages`) chịu trách nhiệm fetch rồi truyền xuống.
4. **Polylang là TÙY CHỌN theo trang** (xem STEP 2). Không ép `$language` non-null.
5. **Islands có chừng mực.** Tabs/accordion/toggle đơn giản → Vanilla JS trong `<script>`.
   Component tương tác phức tạp (combobox, dialog có focus-trap, carousel…) →
   GIỮ làm React island với `client:visible`, KHÔNG viết lại vanilla JS bằng mọi giá.
6. **Build phải xanh.** Kết thúc mỗi task PHẢI chạy `npm run build` và pass.
   Parse data an toàn bằng optional chaining (`?.`) để build không crash khi data null.
7. **VALIDATE QUERY BẰNG CODEGEN.** Sau khi viết/sửa BẤT KỲ query nào, chạy
   `npm run codegen`. Lệnh này validate query với `schema/schema.graphql`; nếu
   field không tồn tại → FAIL. CẤM báo "done" khi codegen còn đỏ. Ưu tiên dùng
   type sinh ra trong `src/gql/graphql.ts` thay cho interface viết tay.

## THE 3-STEP WORKFLOW
Khi user đưa 1 component TSX + mô tả data, thực hiện tuần tự, không xin phép từng bước:

### STEP 1 — UI CONVERSION (TSX → ASTRO)
- Bỏ `useState`/`useEffect`/handler React. `className` → `class`. Self-closing →
  HTML chuẩn. Giữ 100% class Tailwind.
- `next/image` → `<img>` hoặc `astro:assets`; `next/link` → `<a>`.
- Tương tác: theo RULE 5.
- Kết quả Step 1 là component THUẦN GIAO DIỆN (chưa nối data), đặt props mock tạm.

### STEP 2 — BACKEND SCHEMATIZATION (ACF JSON + QUERY)
1. **ACF JSON** (import vào WP qua Tools → Import Field Groups):
   - Field name `camelCase`. Group có `"show_in_graphql": 1` và
     `"graphql_field_name": "camelCaseName"`.
   - Nếu là Options Page: location rule `param: "options_page"`.
2. **GraphQL Query** — chọn ĐÚNG 1 trong 2 mode:
   - **Mode A — Polylang ON** (trang đa ngôn ngữ): query nhận
     `$language: LanguageCodeEnum` (NULLABLE) và truyền vào `where: { language: $language }`.
   - **Mode B — Polylang OFF** (trang không đa ngữ): query KHÔNG có arg language.
   - **Options Page**: truy vấn root field theo `graphql_field_name` của options page
     (ví dụ `{ siteSettings { ... } }`), KHÔNG đặt trên node post.
   - Mọi field phải đối chiếu `schema/schema.graphql` (RULE 1).

### STEP 3 — DATA MAPPING & INTEGRATION
- Trong `src/pages/...`: import query + `wpQuery`, fetch, parse `?.`, map SEO qua
  `mapSeo()`, bọc `<BaseLayout>`, truyền data xuống component qua props.
- Component: định nghĩa `interface Props` khớp payload, thay text/ảnh tĩnh bằng `{props.x}`.

## VERIFICATION GATE (bắt buộc trước khi báo "done")
0. `npm run codegen` → 0 lỗi (mọi field trong query khớp schema thật).
1. `npm run build` → 0 lỗi.
2. `npm run dev`, mở browser, xác nhận query trả data KHÁC null (không phải fallback rỗng).
3. Chụp screenshot trang render, so với ảnh thiết kế gốc trong `design-source/`.
   Lệch layout → sửa trước khi kết thúc.

## SEO PLUGIN NOTE
Shape SEO khác nhau giữa Rank Math và Yoast:
- Yoast (WPGraphQL Yoast): `seo { title metaDesc opengraphImage { sourceUrl } }`
- Rank Math (WPGraphQL Rank Math): shape khác (vd `seo { title description openGraph {...} }`)
KHÔNG đoán — đọc `schema/schema.graphql` để lấy đúng tên, rồi điều chỉnh `src/lib/seo.ts`.

## ANTI-PATTERNS (tuyệt đối tránh)
- Bịa field GraphQL không có trong schema.
- Fetch trong frontmatter component / hardcode endpoint.
- Ép `$language` non-null lên trang không đa ngữ.
- Viết lại component Radix phức tạp bằng vanilla JS gây bug.
- Báo "done" mà chưa chạy build + chưa thấy data thật.
