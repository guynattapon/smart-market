const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
const bodyParser = require('body-parser');
const axios = require('axios');
require('dotenv').config();

const app = express();
app.use(cors());

// ✅ รองรับรูปภาพขนาดใหญ่ (10MB)
app.use(bodyParser.json({ limit: '10mb' })); 
app.use(bodyParser.urlencoded({ limit: '10mb', extended: true }));

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// 🛠️ อัปเกรด Database: เพิ่มช่องเก็บ "รูปเอกสาร" (doc_image)
const initDB = async () => {
  await pool.query("ALTER TABLE stalls ADD COLUMN IF NOT EXISTS slip_image TEXT").catch(e=>console.log(e));
  await pool.query("ALTER TABLE stalls ADD COLUMN IF NOT EXISTS doc_image TEXT").catch(e=>console.log(e)); // 👈 เพิ่มช่องนี้
};
initDB();

// ==========================================
// 🔐 1. Login & Register
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
// 🛒 3. Stalls Management (แก้ให้รองรับเอกสาร)
// ==========================================

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

app.post('/stalls/add', async (req, res) => {
  const { code, zone_id, monthly_price } = req.body;
  try { await pool.query("INSERT INTO stalls (code, zone_id, status, monthly_price) VALUES ($1, $2, 'VACANT', $3)", [code, zone_id, monthly_price]); res.json({ message: 'สำเร็จ' }); } catch (err) { res.status(500).json({ message: err.message }); }
});

// 📸 จองแผง (รับทั้งสลิป และ เอกสาร)
app.post('/book', async (req, res) => {
  // รับ doc_image เพิ่ม
  const { stall_id, user_id, stall_code, user_name, image, doc_image } = req.body; 
  const DISCORD_WEBHOOK_URL = 'https://discord.com/api/webhooks/1457016855309979844/CdMR-Iz3X_xDh0PvdSJrfWRK7m2Nwz2hHvbX318nfrLYId2e1UJGx-fT0VW7BLI7FItg'; 

  try {
    // บันทึกทั้ง 2 รูป
    await pool.query(
      "UPDATE stalls SET status = 'PENDING', tenant_id = $1, slip_image = $2, doc_image = $3 WHERE id = $4", 
      [user_id, image, doc_image, stall_id]
    );
    
    // แจ้งเตือน Discord
    if (DISCORD_WEBHOOK_URL) {
        const discordMessage = {
            content: "📑 **มีรายการจองพร้อมเอกสาร!** @everyone",
            embeds: [{
                title: `🏠 ขอเช่าแผง: ${stall_code}`,
                description: "ลูกค้าแนบสลิปและเอกสารมาแล้ว โปรดตรวจสอบ",
                color: 16776960, 
                fields: [
                    { name: "👤 ลูกค้า", value: user_name, inline: true },
                    { name: "💰 สถานะ", value: "รอตรวจสอบ (Pending)", inline: true }
                ]
            }]
        };
        axios.post(DISCORD_WEBHOOK_URL, discordMessage).catch(err => console.error("Discord Error:", err.message));
    }
    res.json({ message: 'ส่งข้อมูลครบถ้วน รออนุมัติ' });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// อนุมัติ/ปฏิเสธ/คืนแผง (ต้องล้าง doc_image ด้วยเวลาคืน)
app.put('/stalls/:id/approve', async (req, res) => {
    const { id } = req.params; try { await pool.query("UPDATE stalls SET status = 'OCCUPIED' WHERE id = $1", [id]); res.json({ message: 'อนุมัติสำเร็จ' }); } catch (err) { res.status(500).json({ message: err.message }); }
});
app.put('/stalls/:id/reject', async (req, res) => {
    const { id } = req.params; try { await pool.query("UPDATE stalls SET status = 'VACANT', tenant_id = NULL, slip_image = NULL, doc_image = NULL WHERE id = $1", [id]); res.json({ message: 'ปฏิเสธสำเร็จ' }); } catch (err) { res.status(500).json({ message: err.message }); }
});
app.put('/stalls/:id/cancel', async (req, res) => {
    const { id } = req.params; try { await pool.query("UPDATE stalls SET status = 'VACANT', tenant_id = NULL, slip_image = NULL, doc_image = NULL WHERE id = $1", [id]); res.json({ message: 'คืนแผงสำเร็จ' }); } catch (err) { res.status(500).json({ message: err.message }); }
});
app.delete('/stalls/:id', async (req, res) => {
    const { id } = req.params; try { await pool.query("DELETE FROM stalls WHERE id = $1", [id]); res.json({ message: 'ลบสำเร็จ' }); } catch (err) { res.status(500).json({ message: err.message }); }
});

// Dashboard
app.get('/admin/stats', async (req, res) => {
  try {
    const statusResult = await pool.query("SELECT status, COUNT(*) FROM stalls GROUP BY status");
    const incomeResult = await pool.query("SELECT SUM(monthly_price) FROM stalls WHERE status = 'OCCUPIED'");
    const totalIncome = parseInt(incomeResult.rows[0].sum || 0);
    res.json({ totalIncome: totalIncome, stallStats: statusResult.rows, incomeTypes: { rent: totalIncome, water: totalIncome * 0.1, electric: totalIncome * 0.2 } });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => { console.log(`Server running on port ${PORT}`); });