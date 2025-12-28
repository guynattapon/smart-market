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

-- 4. เช็คผลลัพธ์ (ดูซิว่า admin มาหรือยัง)
SELECT username, password, role FROM users;