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
// 📝 จองแผง (เวอร์ชันแจ้งเตือน Discord 👾)
app.post('/book', async (req, res) => {
  const { stall_id, user_id, stall_code, user_name } = req.body; 
  
  // 👇 ลิงก์ Webhook ของเพื่อน (ใส่ให้แล้วครับ)
  const DISCORD_WEBHOOK_URL = 'https://discord.com/api/webhooks/1457016855309979844/CdMR-Iz3X_xDh0PvdSJrfWRK7m2Nwz2hHvbX318nfrLYId2e1UJGx-fT0VW7BLI7FItg'; 

  try {
    // 1. อัปเดต Database
    await pool.query("UPDATE stalls SET status = 'OCCUPIED', tenant_id = $1 WHERE id = $2", [user_id, stall_id]);
    
    // 2. ส่งเข้า Discord
    if (DISCORD_WEBHOOK_URL) {
        const discordMessage = {
            content: "🚨 **มีรายการจองใหม่จ้า!** @everyone", // @everyone เพื่อแท็กเรียกทุกคน
            embeds: [{
                title: `🏠 มีลูกค้าจองแผง: ${stall_code}`,
                description: "รีบเข้าไปตรวจสอบและอนุมัติด้วยนะครับ!",
                color: 5763719, // สีเขียว
                fields: [
                    { name: "👤 ชื่อลูกค้า", value: user_name || "ไม่ระบุชื่อ", inline: true },
                    { name: "💰 สถานะ", value: "รอตรวจสอบ", inline: true },
                    { name: "⏰ เวลาทำรายการ", value: new Date().toLocaleString('th-TH'), inline: false }
                ],
                footer: { text: "Smart Market Notification System" }
            }]
        };

        await axios.post(DISCORD_WEBHOOK_URL, discordMessage)
             .catch(err => console.error("Discord Error:", err.message));
    }

    res.json({ message: 'จองสำเร็จ' });
  } catch (err) { 
    console.error(err);
    res.status(500).json({ message: err.message }); 
  }
});
app.listen(PORT, () => { console.log(`Server running on port ${PORT}`); });