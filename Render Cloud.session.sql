-- 1. ลบตารางเก่าทิ้งไปเลย (จะได้ไม่ error เรื่องคอลัมน์หาย)
DROP TABLE IF EXISTS stalls CASCADE;

-- 2. สร้างตารางใหม่ (เอาแบบเบสิค ที่มีแค่ tenant_id ไว้เก็บชื่อคนจอง)
CREATE TABLE stalls (
    id SERIAL PRIMARY KEY,
    code VARCHAR(10),           -- ชื่อแผง เช่น A01
    status VARCHAR(20) DEFAULT 'AVAILABLE', -- สถานะ
    tenant_id INTEGER,          -- เก็บ ID ของคนจอง (ที่ error เมื่อกี้ เพราะขาดอันนี้)
    monthly_price DECIMAL(10,2) DEFAULT 3000, -- ราคา (เผื่อไว้)
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. สร้างข้อมูลแผงค้าตัวอย่าง (3 แผง)
INSERT INTO stalls (code, status) VALUES ('A01', 'AVAILABLE');
INSERT INTO stalls (code, status) VALUES ('A02', 'AVAILABLE');
INSERT INTO stalls (code, status) VALUES ('B01', 'AVAILABLE');

-- 4. เช็คผลลัพธ์ (ต้องเห็นตารางสวยงาม พร้อมช่อง tenant_id)
SELECT * FROM stalls ORDER BY id;