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

// -------------------- API เดิมๆ --------------------

// 1. ดึงข้อมูลแผง
app.get('/stalls', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM stalls ORDER BY id ASC');
    res.json(result.rows);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// 2. จองแผง (แบบง่าย: รับแค่ id คนจอง กับ id แผง)
app.post('/book', async (req, res) => {
  const { stall_id, user_id } = req.body;
  try {
    await pool.query(
      "UPDATE stalls SET status = 'OCCUPIED', tenant_id = $1 WHERE id = $2",
      [user_id, stall_id]
    );
    res.json({ message: 'จองสำเร็จ!' });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// 3. ระบบสมาชิก (Login/Register) คงไว้เหมือนเดิม
app.post('/register', async (req, res) => {
  const { username, password, full_name, phone_number } = req.body;
  try {
    await pool.query(
      "INSERT INTO users (username, password, full_name, role, phone_number) VALUES ($1, $2, $3, 'TENANT', $4)",
      [username, password, full_name, phone_number]
    );
    res.json({ message: 'สมัครสมาชิกสำเร็จ!' });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

app.post('/login', async (req, res) => {
  const { username, password } = req.body;
  try {
    const result = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
    if (result.rows.length > 0 && result.rows[0].password === password) {
      res.json({ user: result.rows[0], token: 'mock-token' });
    } else {
      res.status(401).json({ message: 'ชื่อหรือรหัสผ่านไม่ถูกต้อง' });
    }
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// 4. Dashboard Admin (คงไว้)
app.get('/admin/stats', async (req, res) => {
  try {
    const stallRes = await pool.query("SELECT status, COUNT(*) as count FROM stalls GROUP BY status");
    res.json({ stallStats: stallRes.rows });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});