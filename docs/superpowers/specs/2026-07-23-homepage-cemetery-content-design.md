# Thiết kế cập nhật trang chủ và nội dung Nghĩa trang Liệt sĩ Thiên Bút

## Mục tiêu

Cập nhật website theo phản hồi khách hàng, bảo đảm tên địa điểm thống nhất, hình ảnh đúng tư liệu được cung cấp và nội dung chính trên trang chủ dễ đọc ở cả desktop lẫn thiết bị di động.

## Phạm vi thay đổi

1. Thay toàn bộ cụm từ hiển thị và cấu hình mặc định `Nghĩa trang Liệt sĩ Núi Thiên Bút` thành `Nghĩa trang Liệt sĩ Thiên Bút`.
2. Không đổi các đường dẫn kỹ thuật, tọa độ hoặc dữ liệu phần mộ.
3. Dùng ảnh tòa tháp do khách hàng cung cấp làm thumbnail cho địa điểm Nghĩa trang Liệt sĩ Thiên Bút trên trang chủ.
4. Dùng ảnh hoàng hôn kết hợp ba địa điểm do khách hàng cung cấp làm ảnh hero chính của trang chủ.
5. Đổi tiêu đề hero thành `KHÁM PHÁ DI SẢN LỊCH SỬ & VĂN HOÁ PHƯỜNG CẨM THÀNH`.
6. Loại bỏ nút `Tra cứu mộ liệt sĩ` khỏi hero; giữ nút khám phá bản đồ di sản.
7. Giữ nguyên ảnh hero hiện tại của trang tra cứu nghĩa trang vì phản hồi chỉ yêu cầu thay thumbnail nhỏ trên trang chủ.

## Xử lý hình ảnh hero

Ảnh hoàng hôn được lưu trong thư mục tài nguyên công khai với tên ổn định. Hero phủ một lớp màu tối pha nâu ấm/đỏ đô, kết hợp gradient đậm dần về vùng nội dung. Lớp phủ phải đủ tương phản để tiêu đề, mô tả và nút màu trắng dễ đọc, đồng thời không làm mất sắc vàng cam đặc trưng của ảnh.

Trên desktop, ảnh dùng `object-fit: cover` và giữ trọng tâm ở khu vực trung tâm. Trên mobile, vị trí ảnh được tinh chỉnh để tháp và các công trình chính không bị cắt bất hợp lý. Tiêu đề sử dụng cỡ chữ responsive và ngắt dòng cân đối.

## Nội dung và nguồn dữ liệu

Tên nghĩa trang được cập nhật tại dữ liệu cấu hình, giá trị mặc định phía máy chủ, nội dung React, mô tả/alt text, nội dung QR được tạo và các bài giới thiệu di sản liên quan. Tài liệu nguồn lịch sử hoặc tên tệp dữ liệu gốc không được đổi tên vì không phải nội dung hiển thị của website.

## Kiểm thử và nghiệm thu

- Kiểm tra tự động để bảo đảm không còn cụm từ cũ trong các nguồn nội dung chạy thực tế.
- Kiểm tra hero dùng đúng ảnh mới, đúng tiêu đề và không còn nút tra cứu.
- Kiểm tra thumbnail nghĩa trang dùng đúng ảnh tòa tháp.
- Chạy build sản phẩm.
- Chụp và kiểm tra trực quan trang chủ ở kích thước desktop và mobile, tập trung vào độ tương phản chữ, điểm cắt ảnh và bố cục nút còn lại.
