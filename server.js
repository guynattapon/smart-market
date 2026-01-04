const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
const bodyParser = require('body-parser');
const axios = require('axios');
require('dotenv').config();

const app = express();
app.use(cors());
// รองรับการส่งรูปภาพขนาดใหญ่ (10MB)
app.use(bodyParser.json({ limit: '10mb' })); 
app.use(bodyParser.urlencoded({ limit: '10mb', extended: true }));

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// ==========================================
// 🛠️ 0. เตรียม Database (สร้างตารางครบชุด)
// ==========================================
const initDB = async () => {
  try {
    // 1. ตาราง Users
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
    
    // 2. ตาราง Stalls (แผงค้า)
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

    // 3. ✨ ตารางใหม่: ประวัติการชำระเงิน (เก็บข้อมูลย้อนหลัง)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS payment_history (
        id SERIAL PRIMARY KEY,
        stall_code TEXT,
        tenant_name TEXT,
        amount NUMERIC,           
        rent_amount NUMERIC,      
        water_amount NUMERIC,     
        electric_amount NUMERIC,  
        slip_image TEXT,          
        paid_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 4. เพิ่มคอลัมน์ต่างๆ ให้ stalls (เผื่อยังไม่มี)
    const columns = [
        "ALTER TABLE stalls ADD COLUMN IF NOT EXISTS slip_image TEXT",     // สลิปจอง
        "ALTER TABLE stalls ADD COLUMN IF NOT EXISTS doc_image TEXT",      // รูปบัตร ปชช.
        "ALTER TABLE stalls ADD COLUMN IF NOT EXISTS bill_water INT DEFAULT 0",    // ค่าน้ำ
        "ALTER TABLE stalls ADD COLUMN IF NOT EXISTS bill_electric INT DEFAULT 0", // ค่าไฟ
        "ALTER TABLE stalls ADD COLUMN IF NOT EXISTS bill_total INT DEFAULT 0",    // ยอดรวม
        "ALTER TABLE stalls ADD COLUMN IF NOT EXISTS bill_slip_image TEXT", // สลิปจ่ายบิล
        "ALTER TABLE stalls ADD COLUMN IF NOT EXISTS bill_status TEXT DEFAULT 'PAID'" // สถานะบิล
    ];

    for (let col of columns) {
        await pool.query(col).catch(() => {});
    }

    // สร้าง Admin ถ้ายังไม่มี
    await pool.query("INSERT INTO users (username, password, full_name, role) VALUES ('admin', 'admin1234', 'Super Admin', 'ADMIN') ON CONFLICT DO NOTHING");
    
    console.log("Database, History Table & Admin initialized successfully");
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

// ทางลัดสร้าง Admin
app.get('/setup/admin', async (req, res) => {
    try {
        await pool.query("INSERT INTO users (username, password, full_name, role) VALUES ('admin', 'admin1234', 'Super Admin', 'ADMIN') ON CONFLICT DO NOTHING");
        res.send("Admin Created: admin / admin1234");
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
// 🛒 3. จัดการแผงค้า (Stalls Management)
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
    res.json({ message: 'เพิ่มแผงค้าสำเร็จ' });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

app.delete('/stalls/:id', async (req, res) => {
  const { id } = req.params;
  try { await pool.query("DELETE FROM stalls WHERE id = $1", [id]); res.json({ message: 'ลบสำเร็จ' }); } 
  catch (err) { res.status(500).json({ message: err.message }); }
});

// ==========================================
// 📸 4. ระบบจอง (Booking & Approval)
// ==========================================
app.post('/book', async (req, res) => {
  const { stall_id, user_id, stall_code, user_name, image, doc_image } = req.body; 
  const DISCORD_WEBHOOK_URL = 'https://discord.com/api/webhooks/1457016855309979844/CdMR-Iz3X_xDh0PvdSJrfWRK7m2Nwz2hHvbX318nfrLYId2e1UJGx-fT0VW7BLI7FItg'; 

  try {
    // อัปเดต DB: ใส่รูปสลิป + รูปเอกสาร + เปลี่ยนสถานะ PENDING
    await pool.query(
      "UPDATE stalls SET status = 'PENDING', tenant_id = $1, slip_image = $2, doc_image = $3 WHERE id = $4", 
      [user_id, image, doc_image, stall_id]
    );
    
    // แจ้งเตือน Discord
    if (DISCORD_WEBHOOK_URL) {
        axios.post(DISCORD_WEBHOOK_URL, {
            content: "📑 **มีรายการจองใหม่!** @everyone",
            embeds: [{
                title: `🏠 ขอเช่าแผง: ${stall_code}`,
                description: "ลูกค้าแนบสลิปและเอกสารแล้ว",
                color: 16776960, // สีเหลือง
                fields: [{ name: "👤 ลูกค้า", value: user_name, inline: true }]
            }]
        }).catch(e => console.error(e));
    }
    res.json({ message: 'จองสำเร็จ รอตรวจสอบ' });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// อนุมัติการจอง (Occupied)
app.put('/stalls/:id/approve', async (req, res) => {
  const { id } = req.params; 
  try { 
      await pool.query("UPDATE stalls SET status = 'OCCUPIED' WHERE id = $1", [id]); 
      res.json({ message: 'อนุมัติสำเร็จ' }); 
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// ปฏิเสธการจอง (Clear Data)
app.put('/stalls/:id/reject', async (req, res) => {
  const { id } = req.params; 
  try { 
      await pool.query("UPDATE stalls SET status = 'VACANT', tenant_id = NULL, slip_image = NULL, doc_image = NULL WHERE id = $1", [id]); 
      res.json({ message: 'ปฏิเสธสำเร็จ' }); 
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// ยกเลิก/คืนแผง (Clear All Data incl. Bills)
app.put('/stalls/:id/cancel', async (req, res) => {
  const { id } = req.params; 
  try { 
      await pool.query("UPDATE stalls SET status = 'VACANT', tenant_id = NULL, slip_image = NULL, doc_image = NULL, bill_total = 0, bill_status='PAID' WHERE id = $1", [id]); 
      res.json({ message: 'คืนแผงสำเร็จ' }); 
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// ==========================================
// 🧾 5. ระบบบิล & การชำระเงิน (Bill Payment System)
// ==========================================

// 5.1 Admin แจ้งหนี้ -> Status: UNPAID
app.post('/notify/bill', async (req, res) => {
  const { stall_code, tenant_name, rent, water, electric, total } = req.body;
  const DISCORD_WEBHOOK_URL = 'https://discord.com/api/webhooks/1457016855309979844/CdMR-Iz3X_xDh0PvdSJrfWRK7m2Nwz2hHvbX318nfrLYId2e1UJGx-fT0VW7BLI7FItg'; 

  try {
    await pool.query(
        "UPDATE stalls SET bill_water=$1, bill_electric=$2, bill_total=$3, bill_status='UNPAID', bill_slip_image=NULL WHERE code=$4",
        [water, electric, total, stall_code]
    );

    if (DISCORD_WEBHOOK_URL) {
        axios.post(DISCORD_WEBHOOK_URL, {
            content: `📢 **บิลค่าเช่ามาแล้วครับ!** @everyone`,
            embeds: [{
                title: `🧾 ใบแจ้งหนี้: แผง ${stall_code}`,
                description: `ผู้เช่า: **${tenant_name}**`,
                color: 15158332, // สีแดง
                fields: [
                    { name: "ยอดรวม", value: `**${parseInt(total).toLocaleString()} บาท**`, inline: true },
                    { name: "สถานะ", value: "🔴 ยังไม่จ่าย (Unpaid)", inline: true }
                ]
            }]
        }).catch(e => console.error(e));
    }
    res.json({ message: 'ส่งบิลเรียบร้อย' });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// 5.2 User แนบสลิปจ่ายบิล -> Status: PENDING
app.post('/pay/bill', async (req, res) => {
    const { stall_id, stall_code, image } = req.body;
    const DISCORD_WEBHOOK_URL = 'https://discord.com/api/webhooks/1457016855309979844/CdMR-Iz3X_xDh0PvdSJrfWRK7m2Nwz2hHvbX318nfrLYId2e1UJGx-fT0VW7BLI7FItg'; 

    try {
        await pool.query(
            "UPDATE stalls SET bill_status='PENDING', bill_slip_image=$1 WHERE id=$2",
            [image, stall_id]
        );

        if (DISCORD_WEBHOOK_URL) {
            axios.post(DISCORD_WEBHOOK_URL, {
                content: `💸 **มีคนจ่ายบิลแล้วจ้า!**`,
                embeds: [{
                    title: `💰 แจ้งชำระเงิน: แผง ${stall_code}`,
                    description: "ลูกค้าแนบสลิปมาแล้ว รีบไปตรวจด่วน!",
                    color: 16776960, // สีเหลือง
                }]
            }).catch(e => console.error(e));
        }
        res.json({ message: 'ส่งสลิปเรียบร้อย รอตรวจสอบ' });
    } catch (err) { res.status(500).json({ message: err.message }); }
});

// 5.3 ✨ Admin อนุมัติการจ่าย -> เก็บประวัติลง DB -> เคลียร์หนี้เป็น 0
app.put('/bill/:id/approve', async (req, res) => {
    const { id } = req.params;
    try {
        // 1. ดึงข้อมูลบิลปัจจุบัน
        const stallRes = await pool.query(`SELECT stalls.*, users.full_name AS t_name FROM stalls LEFT JOIN users ON stalls.tenant_id = users.id WHERE stalls.id = $1`, [id]);
        const stall = stallRes.rows[0];

        // 2. บันทึกลงตารางประวัติ (History)
        if (stall) {
            await pool.query(
                `INSERT INTO payment_history (stall_code, tenant_name, amount, rent_amount, water_amount, electric_amount, slip_image) VALUES ($1, $2, $3, $4, $5, $6, $7)`,
                [stall.code, stall.t_name || 'Unknown', stall.bill_total, stall.monthly_price, stall.bill_water, stall.bill_electric, stall.bill_slip_image]
            );
        }

        // 3. เคลียร์ยอดหนี้เป็น 0
        await pool.query(
            "UPDATE stalls SET bill_water=0, bill_electric=0, bill_total=0, bill_status='PAID', bill_slip_image=NULL WHERE id=$1", 
            [id]
        );
        res.json({ message: 'ยืนยันการชำระเงินและบันทึกประวัติเรียบร้อย' });
    } catch (err) { res.status(500).json({ message: err.message }); }
});

// 5.4 Admin ปฏิเสธสลิป -> Status: UNPAID
app.put('/bill/:id/reject', async (req, res) => {
    const { id } = req.params;
    try {
        await pool.query("UPDATE stalls SET bill_status='UNPAID', bill_slip_image=NULL WHERE id=$1", [id]);
        res.json({ message: 'ปฏิเสธสลิปเรียบร้อย' });
    } catch (err) { res.status(500).json({ message: err.message }); }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => { console.log(`Server running on port ${PORT}`); });