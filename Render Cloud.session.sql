-- 1. สั่งปลดล็อคช่อง password_hash ให้เป็นค่าว่างได้ (จะได้ไม่ Error)
ALTER TABLE users ALTER COLUMN password_hash DROP NOT NULL;

-- 2. สร้าง Admin ขึ้นมาใหม่ (หรือถ้ามีอยู่แล้ว ก็แก้อันเดิม)
-- รอบนี้ผ่านแน่นอนเพราะเราปลดล็อคข้อ 1 แล้ว
INSERT INTO users (username, password, full_name, role, phone_number)
VALUES ('admin', '1234', 'เจ้าของตลาด (Admin)', 'ADMIN', '081-111-1111')
ON CONFLICT (username) 
DO UPDATE SET password = '1234';

-- 3. เพื่อความชัวร์ อัปเดต User ที่เป็น ADMIN ทุกคนให้รหัสเป็น 1234
UPDATE users 
SET password = '1234' 
WHERE role = 'ADMIN';

-- 1. เพิ่มข้อมูลส่วนตัวให้ User (เลขบัตรประชาชน)
ALTER TABLE users ADD COLUMN IF NOT EXISTS id_card_number VARCHAR(20);

-- 2. เพิ่มข้อมูลให้แผงค้า (Stalls)
-- zone_name: ชื่อโซน (เช่น ของสด, เสื้อผ้า)
-- price_daily: ราคาเช่ารายวัน
-- price_monthly: ราคาเช่ารายเดือน
-- current_shop_name: ชื่อร้านที่มาเช่า (เก็บไว้โชว์)
-- current_product_type: ประเภทสินค้าที่ขาย
ALTER TABLE stalls ADD COLUMN IF NOT EXISTS zone_name VARCHAR(50) DEFAULT 'ทั่วไป';
ALTER TABLE stalls ADD COLUMN IF NOT EXISTS price_daily DECIMAL(10,2) DEFAULT 100;
ALTER TABLE stalls ADD COLUMN IF NOT EXISTS price_monthly DECIMAL(10,2) DEFAULT 3000;
ALTER TABLE stalls ADD COLUMN IF NOT EXISTS current_shop_name VARCHAR(100);
ALTER TABLE stalls ADD COLUMN IF NOT EXISTS current_product_type VARCHAR(100);
ALTER TABLE stalls ADD COLUMN IF NOT EXISTS booking_type VARCHAR(10); -- 'DAILY' หรือ 'MONTHLY'

-- 3. (แถม) อัปเดตข้อมูลสมมติ ให้มีหลายๆ โซน (จะได้เห็นภาพชัดๆ)
UPDATE stalls SET zone_name = 'โซนของสด', price_daily = 150, price_monthly = 4000 WHERE id IN (1, 2);
UPDATE stalls SET zone_name = 'โซนเสื้อผ้า', price_daily = 120, price_monthly = 3500 WHERE id IN (3, 4);
UPDATE stalls SET zone_name = 'โซนอาหาร', price_daily = 200, price_monthly = 5000 WHERE id IN (5, 6);