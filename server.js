const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
const jwt = require('jsonwebtoken'); 

const app = express();
const port = 3000;
const SECRET_KEY = 'MySecretKey1234'; // กุญแจลับ

app.use(cors());
app.use(express.json());

// ----------------------------------------------------
// 1. ตั้งค่า Database
// ----------------------------------------------------
const pool = new Pool({
    // ถ้ามีลิงก์จาก Render (ของจริง) ให้ใช้ลิงก์นั้น, ถ้าไม่มีให้ใช้ Localhost (เครื่องเรา)
    connectionString: process.env.DATABASE_URL || 'postgresql://smart_market_db_user:kDui48bPEWBxyKllqj30uokTjHYpriWy@dpg-d58cgbbuibrs73akp7j0-a.singapore-postgres.render.com/smart_market_db',
    ssl: process.env.DATABASE_URL ? { rejectUnauthorized: false } : false
});


// 2. ทดสอบการเชื่อมต่อ
pool.connect((err) => {
  if (err) {
    console.error('❌ เชื่อมต่อ Database ไม่สำเร็จ:', err.message);
  } else {
    console.log('✅ เชื่อมต่อ Database สำเร็จแล้ว!');
  }
});

// ----------------------------------------------------
// 3. API ต่างๆ
// ----------------------------------------------------

// Login API
app.post('/login', async (req, res) => {
  const { username, password } = req.body;
  try {
    const result = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
    if (result.rows.length === 0) return res.status(401).json({ message: 'ไม่พบชื่อผู้ใช้งาน' });

    const user = result.rows[0];
    if (password !== user.password_hash) return res.status(401).json({ message: 'รหัสผ่านผิด' });

    const token = jwt.sign({ id: user.id, role: user.role, name: user.full_name }, SECRET_KEY, { expiresIn: '1h' });
    res.json({ token, user });
  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error');
  }
});

// ดึง Users
app.get('/users', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM users');
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error');
  }
});

// ดึงแผงค้า (Stalls)
app.get('/stalls', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT stalls.*, zones.name as zone_name 
      FROM stalls 
      JOIN zones ON stalls.zone_id = zones.id
      ORDER BY stalls.code ASC
    `);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error');
  }
});

// จองแผง (Booking)
app.post('/book', async (req, res) => {
  const { stall_id, user_id } = req.body;
  try {
    await pool.query(
      `INSERT INTO rentals (tenant_id, stall_id, start_date) VALUES ($1, $2, NOW())`,
      [user_id, stall_id]
    );
    await pool.query(
      `UPDATE stalls SET status = 'OCCUPIED' WHERE id = $1`,
      [stall_id]
    );
    res.json({ message: 'จองสำเร็จเรียบร้อย!' });
  } catch (err) {
    console.error(err);
    res.status(500).send('เกิดข้อผิดพลาดในการจอง');
  }
});

// 🔥 API ออกบิล (แก้ใหม่ให้ค้นหาจาก stall_id) 🔥
app.post('/create-bill', async (req, res) => {
  const { stall_id, water_current, electric_current } = req.body; // รับ stall_id มาแทน
  
  const WATER_UNIT_PRICE = 18;
  const ELEC_UNIT_PRICE = 7;

  try {
    // 1. ค้นหาสัญญาเช่าล่าสุด ของแผงนี้ (stall_id)
    const rentalRes = await pool.query(`
      SELECT r.id, r.stall_id, s.monthly_price 
      FROM rentals r
      JOIN stalls s ON r.stall_id = s.id
      WHERE r.stall_id = $1 
      ORDER BY r.start_date DESC LIMIT 1
    `, [stall_id]);

    if (rentalRes.rows.length === 0) {
      return res.status(404).json({ message: 'ไม่พบสัญญาเช่าในระบบ (คุณได้กดจองหรือยัง?)' });
    }
    const rental = rentalRes.rows[0];

    // 2. คำนวณเงิน
    const water_cost = water_current * WATER_UNIT_PRICE;
    const electric_cost = electric_current * ELEC_UNIT_PRICE;
    const total_amount = parseFloat(rental.monthly_price) + water_cost + electric_cost;

    // 3. บันทึกบิล
    await pool.query(`
      INSERT INTO bills (rental_id, billing_month, rent_fee, water_total, electric_total, total_amount, status)
      VALUES ($1, NOW(), $2, $3, $4, $5, 'PENDING')
    `, [rental.id, rental.monthly_price, water_cost, electric_cost, total_amount]);

    res.json({ message: `ออกบิลสำเร็จ! ยอดรวม ${total_amount} บาท` });

  } catch (err) {
    console.error(err);
    res.status(500).send('เกิดข้อผิดพลาดในการออกบิล');
  }
});
app.get('/my-bills/:user_id', async (req, res) => {
  const { user_id } = req.params;
  try {
    // Join ตารางเพื่อดึงชื่อแผง (stall_code) มาโชว์ด้วย
    const result = await pool.query(`
      SELECT b.*, s.code as stall_code, z.name as zone_name
      FROM bills b
      JOIN rentals r ON b.rental_id = r.id
      JOIN stalls s ON r.stall_id = s.id
      JOIN zones z ON s.zone_id = z.id
      WHERE r.tenant_id = $1
      ORDER BY b.id DESC
    `, [user_id]);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error');
  }
});

// 9. API กดจ่ายเงิน (จำลองการโอน)
app.post('/pay-bill', async (req, res) => {
  const { bill_id } = req.body;
  try {
    // เปลี่ยนสถานะบิลเป็น 'PAID' (จ่ายแล้ว)
    await pool.query('UPDATE bills SET status = $1 WHERE id = $2', ['PAID', bill_id]);
    res.json({ message: 'ชำระเงินเรียบร้อย! ขอบคุณที่ใช้บริการครับ' });
  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error');
  }
});
// 10. API Dashboard (สำหรับผู้บริหารดูภาพรวม)
app.get('/admin/stats', async (req, res) => {
  try {
    // 1. ยอดรายได้รวมทั้งหมด (เฉพาะบิลที่จ่ายแล้ว)
    const incomeRes = await pool.query("SELECT COALESCE(SUM(total_amount), 0) as total FROM bills WHERE status = 'PAID'");
    
    // 2. นับจำนวนแผง (ว่าง vs มีคนเช่า)
    const stallRes = await pool.query("SELECT status, COUNT(*) as count FROM stalls GROUP BY status");
    
    // 3. แยกประเภทรายได้ (ค่าเช่า, ค่าน้ำ, ค่าไฟ)
    const typeRes = await pool.query(`
      SELECT 
        COALESCE(SUM(rent_fee), 0) as rent, 
        COALESCE(SUM(water_total), 0) as water, 
        COALESCE(SUM(electric_total), 0) as electric 
      FROM bills WHERE status = 'PAID'
    `);

    res.json({
      totalIncome: incomeRes.rows[0].total,
      stallStats: stallRes.rows,
      incomeTypes: typeRes.rows[0]
    });
  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error');
  }
});

app.listen(port, () => {
  console.log(`🚀 Server เริ่มทำงานที่ http://localhost:${port}`);
});