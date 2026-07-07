# Quy trình deploy Hong Yu Frontend lên Vercel

Frontend **Astro (hybrid SSR)** kết nối Headless WordPress (WPGraphQL) qua biến môi
trường. Deploy bằng cách **kết nối repo Git với Vercel** — Vercel tự build mỗi khi
`git push`. Không cần Docker, không cần cấu hình server.

---

## 0. Kiến trúc & vì sao chọn cách này

- `output: 'hybrid'` + `@astrojs/vercel/serverless`: trang tĩnh render sẵn, các route
  động (products, blog, contact, /api/*) chạy serverless function trên Vercel.
- **ISR** (`isr.expiration = 60`): mỗi trang SSR được cache tại edge 60s rồi mới query
  lại WordPress → nhanh, giảm tải cho CMS. Sửa nội dung trong WP hiện ra sau ~60s.
- Không có IP tĩnh trên Vercel. Trỏ domain bằng **DNS record**, không phải IP (xem §5).

---

## 1. Chuẩn bị trước khi deploy (đã xong trong repo)

- [x] `.env` **không** được commit (đã nằm trong `.gitignore`) — chứa secret Resend.
- [x] `.env.example` được commit làm mẫu.
- [x] `package.json` → `"engines": { "node": "20.x" }` — **giữ nguyên 20.x** (adapter
      `@astrojs/vercel@7.8.2` hỗ trợ Node 18/20; đặt 22.x sẽ khiến adapter fallback về
      Node 18 đã EOL và deploy lỗi).
- [x] `npm run build` chạy xanh.

> ⚠️ Nếu build **trên máy local bằng Node ≠ 18/20**, function config sinh ra sẽ ghi
> `nodejs18.x`. Điều này **không ảnh hưởng** khi deploy qua Git vì Vercel build bằng
> Node 20 (theo `engines`). Chỉ đừng upload thủ công thư mục `.vercel` build từ Node 24.

---

## 2. Push code lên GitLab

```bash
git add -A
git commit -m "Chore: chuẩn bị deploy Vercel"
git push gitlab main
```

Remote `gitlab` đã trỏ tới `https://gitlab.com/varenodev-group/hongyu.git`.

---

## 3. Tạo project trên Vercel (Git Integration — cách chuẩn)

1. Đăng nhập https://vercel.com → **Add New… → Project**.
2. **Import Git Repository** → chọn provider **GitLab** → authorize → chọn repo `hongyu`.
   (Lần đầu phải cài **Vercel for GitLab** app và cấp quyền cho group `varenodev-group`.)
3. Màn hình config:
   - **Framework Preset**: `Astro` (Vercel tự nhận diện).
   - **Build Command**: `astro build` (mặc định — để trống).
   - **Output Directory**: để trống (adapter tự lo).
   - **Install Command**: `npm install` (mặc định).
   - **Node.js Version**: chọn **20.x** (Settings → General, khớp `engines`).
4. **KHÔNG bấm Deploy vội** — mở mục **Environment Variables** và nhập biến ở §4 trước.
5. Bấm **Deploy**.

---

## 4. Environment Variables (Settings → Environment Variables)

Đặt cho cả 3 scope: **Production, Preview, Development** (trừ khi ghi chú khác).

| Biến | Bắt buộc | Giá trị ví dụ | Ghi chú |
|------|:---:|---|---|
| `WORDPRESS_API_URL` | ✅ | `https://cms.hongyu.com/graphql` | Endpoint WPGraphQL production. **Bắt buộc** — nếu còn `localhost` thì site render nội dung fallback. |
| `PUBLIC_SITE_URL` | ✅ (khuyến nghị) | `https://hongyu.com` | URL frontend — dùng cho canonical/OG/sitemap. |
| `RESEND_API_KEY` | ✅ (nếu dùng form) | `re_xxx` | Gửi email form Contact/Newsletter. Lấy tại resend.com. |
| `RESEND_FROM` | ⬜ | `Hong Yu <no-reply@hongyu.com>` | Sender đã verify domain. Chưa verify thì để `Hong Yu <onboarding@resend.dev>`. |
| `FORM_RECIPIENT` | ✅ (nếu dùng form) | `sales@hongyu.com` | Người nhận email khi WP chưa cấu hình. |
| `PUBLIC_WP_URL` | ⬜ | `https://cms.hongyu.com` | Chỉ set khi ảnh nằm ở host khác `WORDPRESS_API_URL`. Mặc định tự suy ra. |
| `PUBLIC_MEDIA_PROXY` | ⬜ | `1` | Mặc định bật (ảnh qua `/media/*`, ẩn domain CMS). Đặt `0` để dùng URL WP tuyệt đối. |

> Đổi env sau khi đã deploy → phải **Redeploy** (Deployments → ⋯ → Redeploy) để có hiệu lực.

---

## 5. Trỏ domain của khách về Vercel

Vercel **không dùng IP tĩnh** — trỏ bằng DNS record:

1. Vercel: **Settings → Domains → Add** → nhập `hongyu.com` và `www.hongyu.com`.
2. Tại nhà cung cấp DNS của domain, tạo record theo hướng dẫn Vercel:
   - **Apex/root** `hongyu.com` → **A record** → `76.76.21.21`
   - **www** → **CNAME** → `cname.vercel-dns.com`
   - (Nếu DNS hỗ trợ, dùng **CNAME/ALIAS** cho apex thay A record — tốt hơn.)
3. Đợi DNS propagate (vài phút–vài giờ). Vercel tự cấp **SSL (Let's Encrypt)**.
4. Chọn 1 domain chính, domain còn lại set **Redirect** (thường www → apex hoặc ngược lại).

---

## 6. Kiểm tra sau deploy

- [ ] Trang chủ load, hiển thị **dữ liệu thật từ WordPress** (không phải fallback).
- [ ] `/products`, `/blog`, `/portfolio` ra danh sách từ CMS.
- [ ] Ảnh load qua `/media/...` (không lộ domain CMS).
- [ ] Gửi thử form Contact → nhận được email (kiểm tra `RESEND_API_KEY`).
- [ ] `https://<domain>/sitemap.xml` và `/robots.txt` trả URL đúng theo `PUBLIC_SITE_URL`.
- [ ] Sửa 1 bài trong WP → sau ~60s (ISR) thấy thay đổi trên frontend.

---

## 7. Cập nhật về sau

Mỗi lần `git push gitlab main` → Vercel tự build & deploy Production.
Mỗi branch/merge request khác → Vercel tạo **Preview Deployment** riêng để review.
