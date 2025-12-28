-- สร้างตารางเก็บข้อมูลบิล (Bills)
CREATE TABLE IF NOT EXISTS bills (
    id SERIAL PRIMARY KEY,
    stall_id INTEGER REFERENCES stalls(id),
    rent_price DECIMAL(10,2),
    water_unit INTEGER,
    water_total DECIMAL(10,2),
    electric_unit INTEGER,
    electric_total DECIMAL(10,2),
    total_amount DECIMAL(10,2),
    status VARCHAR(20) DEFAULT 'PENDING', -- สถานะ: PENDING (รอจ่าย) / PAID (จ่ายแล้ว)
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- (แถม) ลองสร้างข้อมูลบิลหลอกๆ ขึ้นมาสัก 1 ใบ (จะได้เห็นกราฟขยับ)
INSERT INTO bills (stall_id, rent_price, water_unit, water_total, electric_unit, electric_total, total_amount, status)
VALUES (1, 3000, 10, 200, 20, 400, 3600, 'PAID');