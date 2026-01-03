const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
const bodyParser = require('body-parser');
const axios = require('axios');
require('dotenv').config();

const app = express();
app.use(cors());

// ⚠️ สำคัญ: เพิ่มขนาดให้รับรูปภาพใหญ่ๆ ได้ (ป้องกัน Error Payload too large)
app.use(bodyParser.json({ limit: '10mb' })); 
app.use(bodyParser.urlencoded({ limit: '10mb', extended: true }));

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// 🛠️ อัปเกรด Database อัตโนมัติ (เพิ่มช่องเก็บรูป ถ้ายังไม่มี)
pool.query("ALTER TABLE stalls ADD COLUMN IF NOT EXISTS slip_image TEXT")
  .catch(err => console.log("DB update info:", err.message));

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
      res.json({ message: 'Login สำเร็จ', user: { id: user.id, full_name: user.full_name, role: user.role } });
    } else { res.status(401).json({ message: 'รหัสผ่านผิด' }); }
  } catch (err) { res.status(500).json({ message: err.message }); }
});

app.post('/register', async (req, res) => {
  const { username, password, full_name, phone_number } = req.body;
  try {
    await pool.query("INSERT INTO users (username, password, full_name, role, phone_number) VALUES ($1, $2, $3, 'TENANT', $4)", [username, password, full_name, phone_number]);
    res.json({ message: 'สมัครสำเร็จ' });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// ==========================================
// 🛒 2. ระบบจัดการแผงค้า (Stalls)
// ==========================================

// ดึงข้อมูลแผงค้า
app.get('/stalls', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT stalls.*, users.full_name AS tenant_name 
      FROM stalls LEFT JOIN users ON stalls.tenant_id = users.id 
      ORDER BY stalls.id ASC
    `);
    res.json(result.rows);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// เพิ่มแผงค้า
app.post('/stalls/add', async (req, res) => {
  const { code, zone_id, monthly_price } = req.body;
  try {
    await pool.query("INSERT INTO stalls (code, zone_id, status, monthly_price) VALUES ($1, $2, 'VACANT', $3)", [code, zone_id, monthly_price]);
    res.json({ message: 'เพิ่มแผงค้าสำเร็จ' });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// 📸 จองแผง + แนบสลิป (Status -> PENDING)
app.post('/book', async (req, res) => {
  const { stall_id, user_id, stall_code, user_name, image } = req.body; 
  const DISCORD_WEBHOOK_URL = 'https://discord.com/api/webhooks/1457016855309979844/CdMR-Iz3X_xDh0PvdSJrfWRK7m2Nwz2hHvbX318nfrLYId2e1UJGx-fT0VW7BLI7FItg'; 

  try {
    // บันทึกรูปและเปลี่ยนสถานะเป็น PENDING (รอตรวจสอบ)
    await pool.query(
      "UPDATE stalls SET status = 'PENDING', tenant_id = $1, slip_image = $2 WHERE id = $3", 
      [user_id, image, stall_id]
    );
    
    // แจ้งเตือน Discord
    if (DISCORD_WEBHOOK_URL) {
        const discordMessage = {
            content: "📸 **มีสลิปโอนเงินเข้ามาใหม่!** @everyone",
            embeds: [{
                title: `🏠 ขอเช่าแผง: ${stall_code}`,
                description: "โปรดตรวจสอบสลิปและกดอนุมัติ",
                color: 16776960, // สีเหลือง
                fields: [
                    { name: "👤 ลูกค้า", value: user_name, inline: true },
                    { name: "💰 สถานะ", value: "รอตรวจสอบ (Pending)", inline: true }
                ]
            }]
        };
        axios.post(DISCORD_WEBHOOK_URL, discordMessage).catch(err => console.error("Discord Error:", err.message));
    }
    res.json({ message: 'ส่งหลักฐานเรียบร้อย รออนุมัติ' });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// ✅ อนุมัติการจอง (Approve)
app.put('/stalls/:id/approve', async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query("UPDATE stalls SET status = 'OCCUPIED' WHERE id = $1", [id]);
    res.json({ message: 'อนุมัติสำเร็จ' });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// ❌ ปฏิเสธการจอง (Reject)
app.put('/stalls/:id/reject', async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query("UPDATE stalls SET status = 'VACANT', tenant_id = NULL, slip_image = NULL WHERE id = $1", [id]);
    res.json({ message: 'ปฏิเสธคำขอเรียบร้อย' });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// ลบแผงค้า
app.delete('/stalls/:id', async (req, res) => {
  const { id } = req.params;
  try { await pool.query("DELETE FROM stalls WHERE id = $1", [id]); res.json({ message: 'ลบสำเร็จ' }); } catch (err) { res.status(500).json({ message: err.message }); }
});

// ยกเลิกจอง (Admin สั่งคืนแผง)
app.put('/stalls/:id/cancel', async (req, res) => {
  const { id } = req.params;
  try { await pool.query("UPDATE stalls SET status = 'VACANT', tenant_id = NULL, slip_image = NULL WHERE id = $1", [id]); res.json({ message: 'คืนแผงสำเร็จ' }); } catch (err) { res.status(500).json({ message: err.message }); }
});

// Dashboard Stats
app.get('/admin/stats', async (req, res) => {
  try {
    const statusResult = await pool.query("SELECT status, COUNT(*) FROM stalls GROUP BY status");
    const incomeResult = await pool.query("SELECT SUM(monthly_price) FROM stalls WHERE status = 'OCCUPIED'");
    res.json({ totalIncome: incomeResult.rows[0].sum || 0, stallStats: statusResult.rows });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => { console.log(`Server running on port ${PORT}`); });