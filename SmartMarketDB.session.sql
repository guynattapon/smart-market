-- 1. 💣 ระเบิดตารางเก่าทิ้งให้เกลี้ยง (Clean Slate)
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS stalls CASCADE;
DROP TABLE IF EXISTS bills CASCADE;

-- 2. 🏗️ สร้างตาราง Users ใหม่ (แบบสเปคถูกต้อง 100%)
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,  -- บังคับว่าห้ามชื่อซ้ำ
    password VARCHAR(100) NOT NULL,        -- รหัสผ่าน
    full_name VARCHAR(100) NOT NULL,
    role VARCHAR(20) DEFAULT 'TENANT',
    phone_number VARCHAR(20),
    id_card_number VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. 🏗️ สร้างตาราง Stalls (แผงค้า) ใหม่
CREATE TABLE stalls (
    id SERIAL PRIMARY KEY,
    code VARCHAR(10) NOT NULL,
    status VARCHAR(20) DEFAULT 'AVAILABLE',
    tenant_id INTEGER REFERENCES users(id),
    monthly_price DECIMAL(10,2) DEFAULT 3000,
    zone_name VARCHAR(50) DEFAULT 'ทั่วไป',
    price_daily DECIMAL(10,2) DEFAULT 100,
    current_shop_name VARCHAR(100),
    current_product_type VARCHAR(100),
    booking_type VARCHAR(10)
);

-- 4. 👤 สร้าง User: Admin (รหัส 1234)
INSERT INTO users (username, password, full_name, role, phone_number)
VALUES ('admin', '1234', 'เจ้าของตลาด', 'ADMIN', '081-111-1111');

-- 5. 👤 สร้าง User: ลูกค้า (รหัส 1234)
INSERT INTO users (username, password, full_name, role, phone_number)
VALUES ('user1', '1234', 'ลูกค้าทดสอบ', 'TENANT', '089-999-9999');

-- 6. 🏪 สร้างแผงค้าตัวอย่าง
INSERT INTO stalls (code, status, zone_name) VALUES 
('A01', 'AVAILABLE', 'โซนของสด'),
('A02', 'AVAILABLE', 'โซนเสื้อผ้า');

-- 7. 🔎 (สำคัญ) โชว์ให้ดูหน่อยว่าสร้างเสร็จจริงไหม?
SELECT username, password, role FROM users;