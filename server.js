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

// 👇 API สมัครสมาชิก (สำคัญมาก! ต้องมีอันนี้ข้อมูลถึงจะลง DB)
// 👇 API สำหรับสมัครสมาชิก (Register) - วางส่วนนี้เพิ่มเข้าไปครับ
app.post('/register', async (req, res) => {
  const { username, password, full_name, phone_number } = req.body;
  
  // 1. เช็คว่ากรอกครบไหม
  if (!username || !password || !full_name) {
    return res.status(400).json({ message: 'กรุณากรอกข้อมูลให้ครบถ้วน' });
  }

  try {
    // 2. บันทึกลง Database ทันที! (Fix ให้เป็น Tenant)
    await pool.query(
      "INSERT INTO users (username, password, full_name, role, phone_number) VALUES ($1, $2, $3, 'TENANT', $4)",
      [username, password, full_name, phone_number]
    );
    res.json({ message: 'สมัครสมาชิกสำเร็จ! กรุณาเข้าสู่ระบบ' });
  } catch (err) {
    // 3. ดัก Error กรณีชื่อซ้ำ
    if (err.code === '23505') {
      res.status(400).json({ message: 'ชื่อผู้ใช้นี้มีคนใช้แล้ว เปลี่ยนชื่อใหม่นะ' });
    } else {
      console.error(err);
      res.status(500).json({ message: 'Server Error: ' + err.message });
    }
  }
});
// 👆 จบส่วน API สมัครสมาชิก
// 👇 API เข้าสู่ระบบ (Login)
app.post('/login', async (req, res) => {
  const { username, password } = req.body;
  try {
    const result = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
    if (result.rows.length > 0) {
      const user = result.rows[0];
      // เช็คว่ารหัสตรงกันไหม (แบบตรงไปตรงมา)
      if (password === user.password) { 
        res.json({ 
          token: 'mock-token-123', 
          user: { 
            id: user.id, 
            username: user.username, 
            full_name: user.full_name, 
            role: user.role,
            phone_number: user.phone_number
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

// ... (API อื่นๆ เช่น /stalls, /bills, /book คงเดิมไว้ด้านล่าง) ...
// (ถ้าไฟล์เดิมมีโค้ดพวกนั้นอยู่แล้ว ให้วางทับแค่ส่วนบน หรือเช็คว่า API อื่นๆ ไม่หายไปนะครับ)

// (ส่วนล่างสุดของไฟล์ server.js ต้องมีพวกนี้เสมอ)
app.get('/stalls', async (req, res) => { /* ...โค้ดเดิม... */ });
// ...
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});