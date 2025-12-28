-- 1. เพิ่ม User (สมมติว่าเป็น Admin และ ผู้เช่า)
INSERT INTO users (username, password_hash, role, full_name, phone_number) VALUES 
('admin', '1234', 'ADMIN', 'เจ้าของตลาด ใจดี', '081-111-1111'),
('somchai', '1234', 'TENANT', 'สมชาย ขายไก่ทอด', '089-999-9999'),
('wanida', '1234', 'TENANT', 'วนิดา เสื้อผ้ามือสอง', '086-666-6666');

-- 2. เพิ่มโซนตลาด
INSERT INTO zones (name, description) VALUES 
('Zone A', 'โซนอาหารและเครื่องดื่ม'),
('Zone B', 'โซนเสื้อผ้าและแฟชั่น');

-- 3. เพิ่มแผงค้า (Stalls)
INSERT INTO stalls (zone_id, code, status, monthly_price, map_coordinates) VALUES 
(1, 'A01', 'OCCUPIED', 3500.00, '{"x": 10, "y": 10}'),
(1, 'A02', 'VACANT', 3500.00, '{"x": 60, "y": 10}'),
(2, 'B01', 'VACANT', 2500.00, '{"x": 10, "y": 100}');

-- 4. เพิ่มสัญญาเช่า (ให้สมชายเช่าแผง A01)
INSERT INTO rentals (tenant_id, stall_id, start_date, deposit_amount) VALUES 
(2, 1, '2024-01-01', 5000.00);