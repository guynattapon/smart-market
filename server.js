const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
const bodyParser = require('body-parser');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(bodyParser.json());

// เชื่อมต่อ Database
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// ------------------------------------------------------------------
// 1. 📊 ส่วน Dashboard (ที่หายไป)
// ------------------------------------------------------------------
app.get('/admin/stats', async (req, res) => {
  try {
    const stallRes = await pool.query(`
      SELECT status, COUNT(*) as count FROM stalls GROUP BY status
    `);
    
    // ดึงรายได้รวม (ใช้ COALESCE กันค่า NULL)
    const incomeRes = await pool.query(`
      SELECT 
        COALESCE(SUM(total_amount), 0) as total_income,
        COALESCE(SUM(rent_price), 0) as rent,
        COALESCE(SUM(water_total), 0) as water,
        COALESCE(SUM(electric_total), 0) as electric
      FROM bills WHERE status = 'PAID'
    `);

    const incomeData = incomeRes.rows[0] || { total_income: 0, rent: 0, water: 0, electric: 0 };

    res.json({
      stallStats: stallRes.rows,
      totalIncome: incomeData.total_income,
      incomeTypes: {
        rent: incomeData.rent,
        water: incomeData.water,
        electric: incomeData.electric
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server Error: ' + err.message });
  }
});

// ------------------------------------------------------------------
// 2. 📝 ส่วนสมัครสมาชิก (Register)
// ------------------------------------------------------------------
app.post('/register', async (req, res) => {
  const { username, password, full_name, phone_number } = req.body;
  if (!username || !password || !full_name) {
    return res.status(400).json({ message: 'กรุณากรอกข้อมูลให้ครบถ้วน' });
  }
  try {
    await pool.query(
      "INSERT INTO users (username, password, full_name, role, phone_number) VALUES ($1, $2, $3, 'TENANT', $4)",
      [username, password, full_name, phone_number]
    );
    res.json({ message: 'สมัครสมาชิกสำเร็จ!' });
  } catch (err) {
    if (err.code === '23505') res.status(400).json({ message: 'ชื่อผู้ใช้นี้มีคนใช้แล้ว' });
    else res.status(500).json({ message: err.message });
  }
});

// ------------------------------------------------------------------
// 3. 🔐 ส่วนเข้าสู่ระบบ (Login)
// ------------------------------------------------------------------
app.post('/login', async (req, res) => {
  const { username, password } = req.body;
  try {
    const result = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
    if (result.rows.length > 0) {
      const user = result.rows[0];
      if (password === user.password) {
        res.json({ 
          token: 'mock-token-123', 
          user: { 
            id: user.id, username: user.username, 
            full_name: user.full_name, role: user.role, phone_number: user.phone_number
          } 
        });
      } else {
        res.status(401).json({ message: 'รหัสผ่านไม่ถูกต้อง' });
      }
    } else {
      res.status(404).json({ message: 'ไม่พบชื่อผู้ใช้นี้' });
    }
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ------------------------------------------------------------------
// 4. 🛒 ส่วนจัดการแผง & บิล (อื่นๆ)
// ------------------------------------------------------------------
app.get('/stalls', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM stalls ORDER BY id ASC');
    res.json(result.rows);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

app.get('/my-bills/:userId', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT b.*, s.code as stall_code FROM bills b
      JOIN stalls s ON b.stall_id = s.id
      WHERE s.tenant_id = $1 ORDER BY b.created_at DESC
    `, [req.params.userId]);
    res.json(result.rows);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

app.post('/book', async (req, res) => {
  const { stall_id, user_id } = req.body;
  try {
    await pool.query('UPDATE stalls SET status = $1, tenant_id = $2 WHERE id = $3', ['OCCUPIED', user_id, stall_id]);
    res.json({ message: 'จองสำเร็จ' });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

app.post('/create-bill', async (req, res) => {
  const { stall_id, water_current, electric_current } = req.body;
  try {
    const stallRes = await pool.query('SELECT monthly_price FROM stalls WHERE id = $1', [stall_id]);
    const rentPrice = stallRes.rows[0].monthly_price;
    const waterTotal = water_current * 20; 
    const electricTotal = electric_current * 20;
    const total = parseFloat(rentPrice) + waterTotal + electricTotal;

    await pool.query(`
      INSERT INTO bills (stall_id, rent_price, water_unit, water_total, electric_unit, electric_total, total_amount, status)
      VALUES ($1, $2, $3, $4, $5, $6, $7, 'PENDING')
    `, [stall_id, rentPrice, water_current, waterTotal, electric_current, electricTotal, total]);
    res.json({ message: 'ออกบิลสำเร็จ' });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

app.post('/pay-bill', async (req, res) => {
  const { bill_id } = req.body;
  try {
    await pool.query("UPDATE bills SET status = 'PAID' WHERE id = $1", [bill_id]);
    res.json({ message: 'ชำระเงินเรียบร้อย' });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// รัน Server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});