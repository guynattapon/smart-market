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
// 📊 2. ระบบ Dashboard (กราฟสถิติ)
// ==========================================
app.get('/admin/stats', async (req, res) => {
  try {
    const statusResult = await pool.query("SELECT status, COUNT(*) FROM stalls GROUP BY status");
    const incomeResult = await pool.query("SELECT SUM(monthly_price) FROM stalls WHERE status = 'OCCUPIED'");
    const totalIncome = incomeResult.rows[0].sum || 0;

    res.json({
      totalIncome: totalIncome,
      stallStats: statusResult.rows,
      incomeTypes: { 
        rent: totalIncome,
        water: totalIncome * 0.1, 
        electric: totalIncome * 0.2
      }
    });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// ==========================================
// 🛒 3. ระบบจัดการแผงค้า (Stalls Management)
// ==========================================

// 🟢 ดึงข้อมูลแผงค้า (พร้อมชื่อคนเช่า)
app.get('/stalls', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT stalls.*, users.full_name AS tenant_name 
      FROM stalls 
      LEFT JOIN users ON stalls.tenant_id = users.id 
      ORDER BY stalls.id ASC
    `);
    res.json(result.rows);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// ➕ เพิ่มแผงค้าใหม่
app.post('/stalls/add', async (req, res) => {
  const { code, zone_id, monthly_price } = req.body;
  try {
    await pool.query(
      "INSERT INTO stalls (code, zone_id, status, monthly_price) VALUES ($1, $2, 'VACANT', $3)",
      [code, zone_id, monthly_price]
    );
    res.json({ message: 'เพิ่มแผงค้าสำเร็จ' });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// 📝 จองแผง (สำหรับลูกค้า)
app.post('/book', async (req, res) => {
  const { stall_id, user_id } = req.body;
  try {
    await pool.query("UPDATE stalls SET status = 'OCCUPIED', tenant_id = $1 WHERE id = $2", [user_id, stall_id]);
    res.json({ message: 'จองสำเร็จ' });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// 🚫 ยกเลิกการจอง (Reset แผงให้ว่าง)
app.put('/stalls/:id/cancel', async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query("UPDATE stalls SET status = 'VACANT', tenant_id = NULL WHERE id = $1", [id]);
    res.json({ message: 'ยกเลิกการจองสำเร็จ' });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// 🗑️ ลบแผงค้าทิ้ง
app.delete('/stalls/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query("DELETE FROM stalls WHERE id = $1", [id]);
    res.json({ message: 'ลบแผงค้าสำเร็จ' });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => { console.log(`Server running on port ${PORT}`); });