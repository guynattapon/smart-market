-- 1. ล้างข้อมูลแผงค้าเก่าทิ้งก่อน (จะได้ไม่ซ้ำ)
DELETE FROM stalls;

-- 2. สร้างแผงโซน A (อาหาร) -> กำหนดให้ zone_id = 1
INSERT INTO stalls (code, zone_id, status, monthly_price) VALUES 
('A01', 1, 'VACANT', 3000),
('A02', 1, 'OCCUPIED', 3000), -- แกล้งมีคนจองแล้ว
('A03', 1, 'VACANT', 3000),
('A04', 1, 'VACANT', 3500),
('A05', 1, 'OCCUPIED', 3500),
('A06', 1, 'VACANT', 3000),
('A07', 1, 'VACANT', 3000),
('A08', 1, 'MAINTENANCE', 0); -- ปิดปรับปรุง

-- 3. สร้างแผงโซน B (เสื้อผ้า/ของใช้) -> กำหนดให้ zone_id = 2
INSERT INTO stalls (code, zone_id, status, monthly_price) VALUES 
('B01', 2, 'VACANT', 2500),
('B02', 2, 'VACANT', 2500),
('B03', 2, 'OCCUPIED', 2500),
('B04', 2, 'VACANT', 2800),
('B05', 2, 'VACANT', 2800),
('B06', 2, 'VACANT', 2500),
('B07', 2, 'OCCUPIED', 2500),
('B08', 2, 'VACANT', 2500);