const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
const bodyParser = require('body-parser');
const axios = require('axios');
require('dotenv').config();

const app = express();
app.use(cors());
// รองรับรูปภาพขนาดใหญ่
app.use(bodyParser.json({ limit: '10mb' })); 
app.use(bodyParser.urlencoded({ limit: '10mb', extended: true }));

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// 🛠️ อัปเกรด Database อัตโนมัติ (สร้างตารางและช่องที่ขาด)
const initDB = async () => {
  try {
    // สร้างตาราง users ถ้ายังไม่มี
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        full_name TEXT,
        role TEXT DEFAULT 'TENANT',
        phone_number TEXT
      );
    `);
    
    // สร้างตาราง stalls ถ้ายังไม่มี
    await pool.query(`
      CREATE TABLE IF NOT EXISTS stalls (
        id SERIAL PRIMARY KEY,
        code TEXT NOT NULL,
        zone_id INT,
        status TEXT DEFAULT 'VACANT',
        monthly_price NUMERIC,
        tenant_id INT
      );
    `);

    // เพิ่มคอลัมน์ใหม่ๆ (ถ้ายังไม่มี)
    await pool.query("ALTER TABLE stalls ADD COLUMN IF NOT EXISTS slip_image TEXT").catch(()=>{});
    await pool.query("ALTER TABLE stalls ADD COLUMN IF NOT EXISTS doc_image TEXT").catch(()=>{});
    await pool.query("ALTER TABLE stalls ADD COLUMN IF NOT EXISTS bill_water INT DEFAULT 0").catch(()=>{});
    await pool.query("ALTER TABLE stalls ADD COLUMN IF NOT EXISTS bill_electric INT DEFAULT 0").catch(()=>{});
    await pool.query("ALTER TABLE stalls ADD COLUMN IF NOT EXISTS bill_total INT DEFAULT 0").catch(()=>{});
    
    console.log("Database initialized successfully");
  } catch (e) { 
    console.log("DB Init Error:", e.message); 
  }
};
initDB();

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

// 🆘 ทางลัด: สร้าง Admin (ถ้ายูสเซอร์ 'admin' ยังไม่มี)
app.get('/setup/admin', async (req, res) => {
    try {
        await pool.query("INSERT INTO users (username, password, full_name, role) VALUES ('admin', 'admin1234', 'Super Admin', 'ADMIN') ON CONFLICT DO NOTHING");
        res.send("สร้าง Admin สำเร็จ (User: admin / Pass: admin1234)");
    } catch (err) { res.send(err.message); }
});

// ==========================================
// 📊 2. Dashboard Stats
// ==========================================
app.get('/admin/stats', async (req, res) => {
  try {
    const statusResult = await pool.query("SELECT status, COUNT(*) FROM stalls GROUP BY status");
    const incomeResult = await pool.query("SELECT SUM(monthly_price) FROM stalls WHERE status = 'OCCUPIED'");
    const totalIncome = parseInt(incomeResult.rows[0].sum || 0);

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
// 🛒 3. จัดการแผงค้า (Stalls)
// ==========================================
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

app.post('/stalls/add', async (req, res) => {
  const { code, zone_id, monthly_price } = req.body;
  try {
    await pool.query("INSERT INTO stalls (code, zone_id, status, monthly_price) VALUES ($1, $2, 'VACANT', $3)", [code, zone_id, monthly_price]);
    res.json({ message: 'สำเร็จ' });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

app.delete('/stalls/:id', async (req, res) => {
  const { id } = req.params;
  try { await pool.query("DELETE FROM stalls WHERE id = $1", [id]); res.json({ message: 'ลบสำเร็จ' }); } 
  catch (err) { res.status(500).json({ message: err.message }); }
});

// ==========================================
// 📸 4. ระบบจอง (Booking)
// ==========================================
app.post('/book', async (req, res) => {
  const { stall_id, user_id, stall_code, user_name, image, doc_image } = req.body; 
  const DISCORD_WEBHOOK_URL = 'https://discord.com/api/webhooks/1457016855309979844/CdMR-Iz3X_xDh0PvdSJrfWRK7m2Nwz2hHvbX318nfrLYId2e1UJGx-fT0VW7BLI7FItg'; 

  try {
    // อัปเดต DB
    await pool.query(
      "UPDATE stalls SET status = 'PENDING', tenant_id = $1, slip_image = $2, doc_image = $3 WHERE id = $4", 
      [user_id, image, doc_image, stall_id]
    );
    
    // แจ้งเตือน Discord
    if (DISCORD_WEBHOOK_URL) {
        const discordMessage = {
            content: "📑 **มีรายการจองใหม่! (สลิป+เอกสาร)** @everyone",
            embeds: [{
                title: `🏠 ขอเช่าแผง: ${stall_code}`,
                description: "ลูกค้าส่งเอกสารครบแล้ว โปรดตรวจสอบ",
                color: 16776960, 
                fields: [
                    { name: "👤 ลูกค้า", value: user_name, inline: true },
                    { name: "💰 สถานะ", value: "รอตรวจสอบ", inline: true }
                ]
            }]
        };
        axios.post(DISCORD_WEBHOOK_URL, discordMessage).catch(e => console.error(e));
    }
    res.json({ message: 'จองสำเร็จ' });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// อนุมัติ / ปฏิเสธ / คืนแผง
app.put('/stalls/:id/approve', async (req, res) => {
  const { id } = req.params; try { await pool.query("UPDATE stalls SET status = 'OCCUPIED' WHERE id = $1", [id]); res.json({ message: 'อนุมัติสำเร็จ' }); } catch (err) { res.status(500).json({ message: err.message }); }
});
app.put('/stalls/:id/reject', async (req, res) => {
  const { id } = req.params; try { await pool.query("UPDATE stalls SET status = 'VACANT', tenant_id = NULL, slip_image = NULL, doc_image = NULL WHERE id = $1", [id]); res.json({ message: 'ปฏิเสธสำเร็จ' }); } catch (err) { res.status(500).json({ message: err.message }); }
});
app.put('/stalls/:id/cancel', async (req, res) => {
  const { id } = req.params; try { await pool.query("UPDATE stalls SET status = 'VACANT', tenant_id = NULL, slip_image = NULL, doc_image = NULL, bill_total = 0 WHERE id = $1", [id]); res.json({ message: 'คืนแผงสำเร็จ' }); } catch (err) { res.status(500).json({ message: err.message }); }
});

// ==========================================
// 🧾 5. ระบบบิล & แจ้งหนี้ (Billing)
// ==========================================
app.post('/notify/bill', async (req, res) => {
  const { stall_code, tenant_name, rent, water, electric, total } = req.body;
  const DISCORD_WEBHOOK_URL = 'https://discord.com/api/webhooks/1457016855309979844/CdMR-Iz3X_xDh0PvdSJrfWRK7m2Nwz2hHvbX318nfrLYId2e1UJGx-fT0VW7BLI7FItg'; 

  try {
    // 1. บันทึกหนี้ลง DB
    await pool.query(
        "UPDATE stalls SET bill_water=$1, bill_electric=$2, bill_total=$3 WHERE code=$4",
        [water, electric, total, stall_code]
    );

    // 2. ส่ง Discord
    if (DISCORD_WEBHOOK_URL) {
        const discordMessage = {
            content: `📢 **บิลค่าเช่ามาแล้วครับ!** @everyone`,
            embeds: [{
                title: `🧾 ใบแจ้งหนี้: แผง ${stall_code}`,
                description: `ผู้เช่า: **${tenant_name}**`,
                color: 3447003,
                fields: [
                    { name: "🏠 ค่าเช่า", value: `${parseInt(rent).toLocaleString()} B`, inline: true },
                    { name: "💧 ค่าน้ำ", value: `${parseInt(water).toLocaleString()} B`, inline: true },
                    { name: "⚡ ค่าไฟ", value: `${parseInt(electric).toLocaleString()} B`, inline: true },
                    { name: "💰 ยอดรวม", value: `**${parseInt(total).toLocaleString()} บาท**`, inline: false }
                ]
            }]
        };
        axios.post(DISCORD_WEBHOOK_URL, discordMessage).catch(e => console.error(e));
    }
    res.json({ message: 'ส่งบิลเรียบร้อย' });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// User จ่ายบิล (เคลียร์ยอด)
app.post('/pay/bill', async (req, res) => {
    const { stall_id } = req.body;
    try {
        await pool.query("UPDATE stalls SET bill_water=0, bill_electric=0, bill_total=0 WHERE id=$1", [stall_id]);
        res.json({ message: 'ชำระเงินเรียบร้อย' });
    } catch (err) { res.status(500).json({ message: err.message }); }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => { console.log(`Server running on port ${PORT}`); });