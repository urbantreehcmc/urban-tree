# Nhật ký Cập nhật Giao diện UrbanTree GIS

## Phiên bản 2.3 (03/05/2026) - Chuẩn hóa dữ liệu hành chính & Địa chỉ
- **Tích hợp dữ liệu PA168**:
    - Nhập khẩu thành công 168 đơn vị hành chính từ file "PA168 - Bang thong tin thuoc tinh.xlsx" vào bảng `wards` trong Supabase.
    - Xây dựng mô-đun **"Phường xã"** mới để quản lý thông tin diện tích, dân số và đơn vị hành chính cũ/mới.
- **Tối ưu hóa Popup Bản đồ**:
    - **Tự động hóa địa chỉ**: Sử dụng cơ sở dữ liệu `wards` để tự động xác định loại hình (Phường hay Xã) và Quận/Huyện cũ cho từng cây xanh dựa trên tọa độ/tên phường.
    - **Định dạng chuẩn 📍**: Cấu trúc lại địa chỉ thành `📍 [Số nhà], [Tên đường], [Loại: Tên Phường/Xã] ([Quận/Huyện cũ])`.
    - **Tinh gọn thông tin**: Loại bỏ các trường dữ liệu thừa (`Mã hiệu`, `Phân loại` lặp lại) trong popup để giảm nhiễu thị giác.
- **Vệ sinh dữ liệu**: Loại bỏ tiền tố "Đường" lặp lại trong tên các tuyến phố trên giao diện bản đồ và danh sách.

## Phiên bản 2.2 (03/05/2026) - Nâng cấp toàn diện giao diện Light Mode

- **Thiết kế nền tảng (Foundation)**:
    - Loại bỏ hệ thống giao diện tối "Spatial OS" và Dark Mode/Multi-Theme (xóa bỏ 7 theme gradient, glassmorphism, và các biến CSS phức tạp).
    - Cập nhật phong cách Light Mode chuẩn mực với màu sắc tĩnh (`#f5f7fa` nền sáng, card màu trắng `#ffffff`).
    - Thay thế font chữ toàn cục từ `Inter` sang **`Roboto`**.
    - Sử dụng bộ **Material Icons** chuyên nghiệp thay thế các inline SVG lộn xộn.
- **Bố cục chính (Layout)**:
    - Cấu trúc lại trang từ bản đồ chiếm toàn màn hình (fullscreen map) và thanh công cụ nổi (floating dock) sang **bố cục truyền thống**:
        - **Header** (Thanh điều hướng trên cùng) với viền gradient Xanh - Tím (`#2563eb` sang `#7e3af2`).
        - **Sidebar** (Cột điều hướng trái) với danh sách dạng dọc rõ ràng kèm **Badge** đếm số lượng.
        - **Main Content** (Vùng nội dung chính) nhúng các mô-đun (Bản đồ, Bảng cây, Tổng quan) vào khung.
- **Cập nhật Component Chi tiết**:
    - **TreeTable (Bảng dữ liệu)**: Chuyển đổi thành dạng thẻ (card) sáng màu, phân trang và bộ lọc chuyên nghiệp theo chuẩn Material.
    - **Dashboard (Tổng quan)**: Biến các thẻ dữ liệu trong suốt thành các ô thông tin trắng nổi bật.
    - **TreeDetail (Chi tiết cây)**: Chuyển từ overlay toàn màn hình sang **Modal căn giữa** tiêu chuẩn. Vẫn giữ lại toàn bộ tính năng GPS và chỉnh sửa vị trí.
    - **Bản đồ (MapView)**: Loại bỏ các khung kính mờ (glass-panel), chuyển Control Panel và Popup sang giao diện nền trắng viền mỏng dễ nhìn. Cập nhật icon phân loại cây cho đồng nhất.
- **Vá lỗi Encoding (Tiếng Việt)**:
    - Chạy thuật toán để sửa lại hàng ngàn ký tự lỗi font (Mojibake UTF-8) trên toàn bộ hệ thống file (`.tsx`) do tác động của Windows PowerShell, khôi phục ngôn ngữ hệ thống trở lại tiếng Việt chuẩn xác 100%.

---

## Phiên bản 2.1 (23/04/2026)
- **Cải tiến Popup Chi tiết Cây xanh**:
    - Di chuyển toàn bộ dữ liệu địa lý lên đầu popup.
    - Kết hợp "Địa chỉ" và "Tên đường" thành một dòng: `[Địa chỉ] | [Tên đường]`.
    - Di chuyển trường **"Khu vực"** từ phần quản lý lên phần địa lý.
- **Định dạng hành chính mới**:
    - Tự động định dạng tên Quận/Huyện theo quy chuẩn 2 cấp (ví dụ: `(Quận 1 cũ)`, `(Huyện Bình Chánh cũ)`).
- **Phân nhóm thông tin**:
    - Chia rõ rệt thành hai phân đoạn: **THÔNG TIN SINH TRƯỞNG** (Mã hiệu, Hvn, C1.3...) và **THÔNG TIN QUẢN LÝ** (Gói thầu, Đơn vị, Giám sát...).
- **Nút hành động**:
    - Bổ sung nút **"Quản lý"** với icon bánh răng để mở form quản trị chuyên sâu.
    - Cố định các nút trên một hàng ngang để tránh xuống dòng mất thẩm mỹ.
- **Nâng cấp Sidebar & Bố cục Tổng thể**:
    - Mở rộng không gian Sidebar lên **300px** và tăng **padding bên trái (px-8)**.
    - Sử dụng padding và margin lớn hơn để tạo cảm giác "hiện đại và cao cấp".
- **Hệ thống 7 Theme Màu sắc (Modern Gradient)**:
    - Bổ sung 7 tông màu mới, hiệu ứng Radian và thiết kế lại ThemeSwitcher gọn gàng.
- **Môi trường Phát triển**: Đồng bộ toàn bộ mã nguồn từ Google Drive sang `C:\urban-tree-app`.
