const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
const bodyParser = require('body-parser');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(bodyParser.json());

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// ==========================================
// 🔐 1. ระบบ Login & Register
// ==========================================
app.post('/login', async (req, res) => {
  const { username, password } = req.body;
  try {
    const result = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
    if (result.rows.length === 0) return res.status(404).json({ message: 'ไม่พบชื่อผู้ใช้' });

    const user = result.rows[0];
    if (password === user.password) {
      res.json({ 
        message: 'Login สำเร็จ',
        token: 'mock-token-123',
        user: { id: user.id, username: user.username, full_name: user.full_name, role: user.role } 
      });
    } else {
      res.status(401).json({ message: 'รหัสผ่านผิด' });
    }
  } catch (err) { res.status(500).json({ message: err.message }); }
});

app.post('/register', async (req, res) => {
  const { username, password, full_name, phone_number } = req.body;
  try {
    await pool.query(
      "INSERT INTO users (username, password, full_name, role, phone_number) VALUES ($1, $2, $3, 'TENANT', $4)",
      [username, password, full_name, phone_number]
    );
    res.json({ message: 'สมัครสำเร็จ' });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// ==========================================
// 📊 2. ระบบ Dashboard (กราฟสถิติ) **ตัวที่ขาดไป**
// ==========================================
app.get('/admin/stats', async (req, res) => {
  try {
    // ดึงจำนวนแผงว่าง/ไม่ว่าง
    const statusResult = await pool.query("SELECT status, COUNT(*) FROM stalls GROUP BY status");
    
    // ดึงรายได้รวม (สมมติคำนวณจากแผงที่ไม่ว่าง)
    const incomeResult = await pool.query("SELECT SUM(monthly_price) FROM stalls WHERE status = 'OCCUPIED'");
    const totalIncome = incomeResult.rows[0].sum || 0;

    res.json({
      totalIncome: totalIncome,
      stallStats: statusResult.rows,
      incomeTypes: { 
        rent: totalIncome,       // ค่าเช่า (ของจริง)
        water: totalIncome * 0.1, // ค่าน้ำ (สมมติ 10%)
        electric: totalIncome * 0.2 // ค่าไฟ (สมมติ 20%)
      }
    });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// ==========================================
// 🛒 3. ระบบแผงค้า (Stalls)
// ==========================================
app.get('/stalls', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM stalls ORDER BY id ASC');
    res.json(result.rows);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

app.post('/book', async (req, res) => {
  const { stall_id, user_id } = req.body;
  try {
    await pool.query("UPDATE stalls SET status = 'OCCUPIED', tenant_id = $1 WHERE id = $2", [user_id, stall_id]);
    res.json({ message: 'จองสำเร็จ' });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => { console.log(`Server running on port ${PORT}`); });