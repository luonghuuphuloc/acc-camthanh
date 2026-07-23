# Thiết kế cập nhật video, hero, marker và chính tả

## Mục tiêu

Cập nhật trang chủ và sa bàn theo phản hồi mới của khách hàng: thống nhất cách viết `liệt sĩ`, bổ sung video giới thiệu ở vị trí nổi bật, thay ảnh hero mới và chuyển marker `Bạn đang ở đây` tới đúng điểm được đánh dấu.

## Chính tả

Toàn bộ nội dung chạy thực tế của website không được dùng cụm `liệt sỹ`, không phân biệt chữ hoa hay chữ thường. Cách viết chuẩn là `liệt sĩ`. Các cụm từ khác trong dữ liệu lịch sử như `chiến sỹ`, `thượng sỹ`, `hạ sỹ` không thuộc phạm vi yêu cầu này và được giữ nguyên.

## Video trang chủ

Video YouTube `https://youtu.be/BlluoKb81bQ` được hiển thị trong một section riêng, toàn chiều rộng nội dung, ngay dưới hero và ngay trước bản đồ di sản. Section sử dụng component `VideoFrame` hiện có để chuẩn hóa URL YouTube, giữ tỷ lệ `16:9`, hỗ trợ toàn màn hình và hiển thị tốt trên desktop lẫn mobile.

Video trang chủ là nội dung cố định độc lập. Cấu hình `youtubeUrl` hiện có của video thuyết minh tại trang nghĩa trang không bị thay đổi.

## Ảnh hero mới

Ảnh `codex-clipboard-383f74c8-a7ec-4e79-af27-86adee312206.png` thay thế tài nguyên hero hiện tại nhưng giữ URL công khai ổn định `/homepage-sunset-heritage.png` để tránh thay đổi không cần thiết trong component và kiểm thử hiện có.

Lớp phủ được điều chỉnh từ sắc hoàng hôn sang gradient tối trung tính pha nâu nhẹ. Mục tiêu là giữ bầu trời xanh và ba công trình dễ nhận biết trong khi tiêu đề trắng, mô tả và nút bản đồ đạt độ tương phản rõ ràng. Desktop ưu tiên hiển thị đủ ba công trình; mobile ưu tiên tháp trung tâm và giữ nội dung không tràn màn hình.

## Marker và tuyến chỉ dẫn nội khu

Tâm của điểm đánh đỏ được quy đổi từ ảnh phản hồi về tọa độ ảnh sa bàn:

- `left: 37.5%`
- `top: 40.2%`

Marker `Bạn đang ở đây` sử dụng đúng tọa độ này. Polyline chỉ dẫn cũng bắt đầu tại `37.5,40.2`, đi thẳng xuống hành lang nội khu tại `37.5,67`, sau đó đi ngang và đi thẳng tới phần mộ được chọn. Cách nối vuông góc tránh đường chéo xuyên qua bố cục sa bàn.

## Kiểm thử và nghiệm thu

- Kiểm thử tự động không còn cụm `liệt sỹ` trong các nguồn nội dung chạy thực tế.
- Kiểm thử trang chủ tham chiếu video `BlluoKb81bQ` và ảnh hero ổn định.
- Kiểm thử marker và điểm đầu polyline cùng dùng tọa độ `37.5 / 40.2`.
- Chạy build production.
- Kiểm tra trực quan desktop và mobile: hero rõ chữ, video nằm giữa hero và bản đồ, video không tràn ngang, marker đúng điểm đánh dấu và tuyến xanh bắt đầu từ marker.
- Sau khi tất cả kiểm tra đạt yêu cầu, deploy lại nhánh hiện tại lên `/home/viis/acc-camthanh`, build trên host và restart PM2 `acc-camthanh-test`.
