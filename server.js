const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
const bodyParser = require('body-parser');
const axios = require('axios');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(bodyParser.json({ limit: '10mb' })); 
app.use(bodyParser.urlencoded({ limit: '10mb', extended: true }));

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// 🛠️ อัปเกรด DB: เพิ่มช่องเก็บ "หนี้" (Bill)
const initDB = async () => {
  try {
    await pool.query("ALTER TABLE stalls ADD COLUMN IF NOT EXISTS slip_image TEXT");
    await pool.query("ALTER TABLE stalls ADD COLUMN IF NOT EXISTS doc_image TEXT");
    // 👇 เพิ่ม 3 ช่องนี้สำหรับเก็บค่าไฟ/ค่าน้ำ
    await pool.query("ALTER TABLE stalls ADD COLUMN IF NOT EXISTS bill_water INT DEFAULT 0");
    await pool.query("ALTER TABLE stalls ADD COLUMN IF NOT EXISTS bill_electric INT DEFAULT 0");
    await pool.query("ALTER TABLE stalls ADD COLUMN IF NOT EXISTS bill_total INT DEFAULT 0");
  } catch (e) { console.log(e); }
};
initDB();

// ... (Login / Register / Stalls / Add Stall / Book / Approve / Reject / Cancel / Delete / Stats ... ใช้โค้ดเดิมได้เลยครับ ไม่ต้องแก้)
// (เพื่อให้ประหยัดบรรทัด ผมขอข้ามส่วนเดิมที่ไม่ได้แก้นะครับ เพื่อนใช้ของเก่าได้เลย)
// ...

// ==========================================
// 🧾 ส่วนที่แก้ใหม่: ระบบส่งบิล (บันทึกลง DB + Discord)
// ==========================================
app.post('/notify/bill', async (req, res) => {
  const { stall_code, tenant_name, rent, water, electric, total } = req.body;
  const DISCORD_WEBHOOK_URL = 'https://discord.com/api/webhooks/1457016855309979844/CdMR-Iz3X_xDh0PvdSJrfWRK7m2Nwz2hHvbX318nfrLYId2e1UJGx-fT0VW7BLI7FItg'; 

  try {
    // 1. บันทึกหนี้ลง Database (เพื่อให้ User เห็นในเว็บ)
    await pool.query(
        "UPDATE stalls SET bill_water=$1, bill_electric=$2, bill_total=$3 WHERE code=$4",
        [water, electric, total, stall_code]
    );

    // 2. ส่งเข้า Discord (แจ้งเตือน)
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
                ],
                footer: { text: "ดูรายละเอียดและชำระเงินได้ที่หน้าเว็บไซต์" }
            }]
        };
        axios.post(DISCORD_WEBHOOK_URL, discordMessage).catch(err => console.error(err));
    }
    res.json({ message: 'บันทึกบิลและส่งแจ้งเตือนเรียบร้อย' });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// 👇 เพิ่ม API สำหรับ User กด "จ่ายบิล" (เคลียร์ยอดเป็น 0)
app.post('/pay/bill', async (req, res) => {
    const { stall_id } = req.body;
    try {
        // เคลียร์ยอดหนี้ออก
        await pool.query("UPDATE stalls SET bill_water=0, bill_electric=0, bill_total=0 WHERE id=$1", [stall_id]);
        res.json({ message: 'ชำระเงินเรียบร้อย' });
    } catch (err) { res.status(500).json({ message: err.message }); }
});

// ... (ส่วนที่เหลือ Login, Register, stalls(get/add/delete/cancel) ใช้ของเดิมได้เลยครับ อย่าลืมใส่ให้ครบน้า)
// *แนะนำให้ก๊อปไฟล์เดิมมา แล้วแก้แค่ส่วน /notify/bill และเพิ่ม /pay/bill ครับ*

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => { console.log(`Server running on port ${PORT}`); });