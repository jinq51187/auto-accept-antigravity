# Antigravity Auto-Accept

[Tiếng Việt bên dưới](#tiếng-viet)

Automatically accepts AI suggestions, executions, and confirmations in the Antigravity IDE.

## Features
- **Auto-Accept**: Automatically clicks/executes common IDE actions (Accept All, Apply, Terminal Run).
- **Status Bar Integration**: Visual indicator showing if the tool is ON (Zap icon) or OFF (Circle-slash icon).
- **Persistent State**: Remembers your setting between sessions.

## Installation
Currently, this extension is provided as a `.vsix` file.
1. Open Antigravity (or Cursor/VS Code).
2. Go to the Extensions view (`Ctrl+Shift+X`).
3. Click the "..." (Views and More Actions) menu in the top right.
4. Select **Install from VSIX...**.
5. Choose the `antigravity-auto-accept-0.0.2.vsix` file.

## Configuration
You can customize the extension in Settings (`Ctrl+,`):
- `antigravity-auto-accept.enabled`: Enable or disable the auto-accept agent (Default: `true`).
- `antigravity-auto-accept.pollingInterval`: How often (in ms) to check for actions (Default: `300`).

## Usage
- Click the **Auto-Accept** item in the Status Bar (bottom right) to toggle.
- Use the Command Palette (`Ctrl+Shift+P`) and search for **Antigravity: Toggle Auto-Accept**.

---

<a name="tiếng-viet"></a>
# Antigravity Auto-Accept (Tiếng Việt)

Tự động chấp nhận các gợi ý AI, lệnh thực thi và xác nhận trong Antigravity IDE.

## Tính năng
- **Tự động Chấp nhận (Auto-Accept)**: Tự động nhấn/thực thi các hành động phổ biến trong IDE (Chấp nhận tất cả, Áp dụng, Chạy Terminal).
- **Tích hợp Thanh Trạng thái**: Hiển thị trạng thái BẬT (biểu tượng tia sét) hoặc TẮT (biểu tượng gạch chéo).
- **Ghi nhớ trạng thái**: Tự động lưu lại cài đặt của bạn cho các phiên làm việc sau.

## Cài đặt
Hiện tại, tiện ích này được cung cấp dưới dạng tệp `.vsix`.
1. Mở Antigravity (hoặc Cursor/VS Code).
2. Mở trình quản lý Tiện ích (Extensions) (`Ctrl+Shift+X`).
3. Nhấn vào menu "..." (Views and More Actions) ở góc trên bên phải.
4. Chọn **Install from VSIX...**.
5. Chọn tệp `antigravity-auto-accept-0.0.2.vsix`.

## Cấu hình
Bạn có thể tùy chỉnh tiện ích trong Cài đặt (`Ctrl+,`):
- `antigravity-auto-accept.enabled`: Bật hoặc tắt trình tự động chấp nhận (Mặc định: `true`).
- `antigravity-auto-accept.pollingInterval`: Khoảng thời gian (mili giây) để kiểm tra hành động (Mặc định: `300`).

## Cách sử dụng
- Nhấn vào mục **Auto-Accept** trên Thanh Trạng thái (góc dưới bên phải) để bật/tắt.
- Sử dụng Command Palette (`Ctrl+Shift+P`) và tìm kiếm **Antigravity: Toggle Auto-Accept**.

## License
MIT © qPos
