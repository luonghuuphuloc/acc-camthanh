# Di sản Cẩm Thành - Sa bàn Nghĩa trang Núi Thiên Bút

MVP web-app gồm trang public tra cứu mộ và trang admin kéo-thả vị trí mộ lên sa bàn.

## Chạy local

```bash
npm install
npm run seed
npm run build
npm run server
```

Mở:

- Trang chủ: `http://localhost:5174`
- Sa bàn: `http://localhost:5174/nghia-trang`
- Admin: `http://localhost:5174/admin`

Mật khẩu admin mặc định là `Admin@123`. Khi triển khai thật, đặt biến môi trường:

```bash
ADMIN_PASSWORD=mat-khau-moi npm run server
```

## Cách cấu hình sa bàn

1. Vào `/admin` và đăng nhập.
2. Tìm mộ theo tên, khu, hàng hoặc số mộ.
3. Chọn một dòng mộ rồi bấm lên sa bàn để đặt nhanh, hoặc kéo một dòng mộ từ danh sách bên phải thả lên đúng vị trí.
4. Marker trắng là mộ thường, marker đỏ là mộ đặc biệt.
5. Chọn một mộ để đổi loại hoặc gỡ khỏi sa bàn.

Dữ liệu được lưu trong `data/graves.json`; ảnh nền sa bàn nằm tại `public/cemetery-map.jpg`.

## Vị trí mộ ban đầu

Script `npm run autoplace` tự đặt vị trí mộ theo khu/hàng/mộ dựa trên layout ảnh sa bàn hiện có. Đây là vị trí ước lượng để có marker hiển thị ngay, sau đó admin tinh chỉnh lại bằng kéo-thả.

Sau khi đã chỉnh tay nhiều vị trí, không chạy lại `npm run seed` nếu không muốn reset dữ liệu từ file HTML tham khảo.
