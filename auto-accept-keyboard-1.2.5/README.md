# Auto Accept (Keyboard)

Tự động chấp nhận các thay đổi từ AI Agent trong Antigravity IDE bằng cách mô phỏng phím tắt.

## Tính năng

- ✅ Tự động kích hoạt lệnh "Accept all" 
- ✅ Cấu hình khoảng thời gian polling
- ✅ Bật/tắt dễ dàng qua Status Bar
- ✅ Log chi tiết trong Output panel

## Cài đặt

1. Copy thư mục `auto-accept-keyboard` vào thư mục extensions của Antigravity
2. Reload Window (`Ctrl+Shift+P` > "Reload Window")
3. Click vào biểu tượng trên Status Bar để bật/tắt

## Cấu hình

Mở Settings (`Ctrl+,`) và tìm "Auto Accept Keyboard":

- **Enabled**: Bật/tắt tự động accept
- **Interval**: Khoảng thời gian giữa các lần thử (mặc định: 500ms)
- **Shortcut**: Phím tắt cần mô phỏng (mặc định: `ctrl+shift+enter`)

## Cách hoạt động

Extension này sử dụng nhiều phương pháp song song:
1. Thực thi các lệnh accept phổ biến
2. Tìm và thực thi các lệnh có keybinding tương ứng
3. Polling liên tục để đảm bảo không bỏ sót

## Troubleshooting

Nếu không hoạt động:
1. Mở Output panel (`Ctrl+Shift+U`)
2. Chọn "Auto Accept Keyboard" từ dropdown
3. Kiểm tra log để xem extension có đang chạy không
4. Thử điều chỉnh interval trong settings

## License

MIT

