-- 1. 💣 ลบตารางเก่าทิ้ง (เพื่อสร้างใหม่ให้โครงสร้างถูกเป๊ะ)
DROP TABLE IF EXISTS stalls;

-- 2. 🏗️ สร้างตารางใหม่ (เพิ่มช่อง zone_id และ tenant_id เข้ามา)
CREATE TABLE stalls (
    id SERIAL PRIMARY KEY,
    code VARCHAR(10) NOT NULL,
    zone_id INT NOT NULL,     -- 👈 นี่คือพระเอกที่เราขาดไป
    status VARCHAR(20) DEFAULT 'VACANT',
    monthly_price DECIMAL(10, 2) NOT NULL,
    tenant_id INT             -- เอาไว้เก็บ ID คนที่มาจอง
);

-- 3. 🍎 สร้างแผงโซน A (อาหาร) -> zone_id = 1
INSERT INTO stalls (code, zone_id, status, monthly_price) VALUES 
('A01', 1, 'VACANT', 3000),
('A02', 1, 'OCCUPIED', 3000), 
('A03', 1, 'VACANT', 3000),
('A04', 1, 'VACANT', 3500),
('A05', 1, 'OCCUPIED', 3500),
('A06', 1, 'VACANT', 3000),
('A07', 1, 'VACANT', 3000),
('A08', 1, 'MAINTENANCE', 0);

-- 4. 👕 สร้างแผงโซน B (เสื้อผ้า) -> zone_id = 2
INSERT INTO stalls (code, zone_id, status, monthly_price) VALUES 
('B01', 2, 'VACANT', 2500),
('B02', 2, 'VACANT', 2500),
('B03', 2, 'OCCUPIED', 2500),
('B04', 2, 'VACANT', 2800),
('B05', 2, 'VACANT', 2800),
('B06', 2, 'VACANT', 2500),
('B07', 2, 'OCCUPIED', 2500),
('B08', 2, 'VACANT', 2500);