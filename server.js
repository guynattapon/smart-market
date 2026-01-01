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
// 🔐 ระบบ Login (ฉบับแก้ให้เข้าได้ชัวร์!)
// ==========================================
app.post('/login', async (req, res) => {
  const { username, password } = req.body;
  try {
    // 1. ค้นหา User จากชื่อ
    const result = await pool.query('SELECT * FROM users WHERE username = $1', [username]);

    // 2. ถ้าไม่เจอชื่อนี้
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'ไม่พบชื่อผู้ใช้นี้' });
    }

    const user = result.rows[0];

    // 3. เช็คว่ารหัสผ่านตรงกันไหม? (เช็คแบบตัวต่อตัวเลย)
    if (password === user.password) {
      // รหัสถูก! ส่งข้อมูลกลับไป
      res.json({ 
        message: 'Login สำเร็จ',
        token: 'mock-token-123',
        user: { 
          id: user.id, 
          username: user.username, 
          full_name: user.full_name, 
          role: user.role 
        } 
      });
    } else {
      // รหัสผิด
      res.status(401).json({ message: 'รหัสผ่านไม่ถูกต้อง' });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server Error: ' + err.message });
  }
});

// ==========================================
// 📝 ระบบสมัครสมาชิก (Register)
// ==========================================
app.post('/register', async (req, res) => {
  const { username, password, full_name, phone_number } = req.body;
  try {
    // บันทึกรหัสผ่านแบบตรงๆ (ไม่เข้ารหัส) เพื่อให้ Login ง่าย
    await pool.query(
      "INSERT INTO users (username, password, full_name, role, phone_number) VALUES ($1, $2, $3, 'TENANT', $4)",
      [username, password, full_name, phone_number]
    );
    res.json({ message: 'สมัครสมาชิกสำเร็จ!' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ==========================================
// 🛒 API แผงค้าและจอง (เหมือนเดิม)
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
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});