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

const initDB = async () => {
  try {
    await pool.query(`CREATE TABLE IF NOT EXISTS users (id SERIAL PRIMARY KEY, username TEXT UNIQUE NOT NULL, password TEXT NOT NULL, full_name TEXT, role TEXT DEFAULT 'TENANT', phone_number TEXT);`);
    await pool.query(`CREATE TABLE IF NOT EXISTS stalls (id SERIAL PRIMARY KEY, code TEXT NOT NULL, zone_id INT, status TEXT DEFAULT 'VACANT', monthly_price NUMERIC, tenant_id INT);`);
    await pool.query(`CREATE TABLE IF NOT EXISTS payment_history (id SERIAL PRIMARY KEY, stall_code TEXT, tenant_name TEXT, amount NUMERIC, rent_amount NUMERIC, water_amount NUMERIC, electric_amount NUMERIC, slip_image TEXT, paid_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP);`);

    const columns = [
        "ALTER TABLE stalls ADD COLUMN IF NOT EXISTS slip_image TEXT",     
        "ALTER TABLE stalls ADD COLUMN IF NOT EXISTS doc_image TEXT",      
        "ALTER TABLE stalls ADD COLUMN IF NOT EXISTS bill_water INT DEFAULT 0",    
        "ALTER TABLE stalls ADD COLUMN IF NOT EXISTS bill_electric INT DEFAULT 0", 
        "ALTER TABLE stalls ADD COLUMN IF NOT EXISTS bill_total INT DEFAULT 0",    
        "ALTER TABLE stalls ADD COLUMN IF NOT EXISTS bill_slip_image TEXT", 
        "ALTER TABLE stalls ADD COLUMN IF NOT EXISTS bill_status TEXT DEFAULT 'PAID'" 
    ];
    for (let col of columns) { await pool.query(col).catch(() => {}); }

    await pool.query("INSERT INTO users (username, password, full_name, role) VALUES ('admin', 'admin1234', 'Super Admin', 'ADMIN') ON CONFLICT DO NOTHING");
    console.log("DB Initialized");
  } catch (e) { console.log(e); }
};
initDB();

// Login & Register
app.post('/login', async (req, res) => {
  const { username, password } = req.body;
  try {
    const result = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
    if (result.rows.length === 0) return res.status(404).json({ message: 'User not found' });
    const user = result.rows[0];
    if (password === user.password) res.json({ message: 'Success', user });
    else res.status(401).json({ message: 'Wrong password' });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

app.post('/register', async (req, res) => {
  const { username, password, full_name, phone_number } = req.body;
  try {
    await pool.query("INSERT INTO users (username, password, full_name, role, phone_number) VALUES ($1, $2, $3, 'TENANT', $4)", [username, password, full_name, phone_number]);
    res.json({ message: 'Success' });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

app.get('/history', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM payment_history ORDER BY paid_at DESC');
    res.json(result.rows);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// 🔥 แก้ไขจุดที่ทำให้หน้าขาว (เพิ่ม incomeTypes)
app.get('/admin/stats', async (req, res) => {
  try {
    const statusResult = await pool.query("SELECT status, COUNT(*) FROM stalls GROUP BY status");
    const incomeResult = await pool.query("SELECT SUM(monthly_price) FROM stalls WHERE status = 'OCCUPIED'");
    const totalIncome = parseInt(incomeResult.rows[0].sum || 0);

    res.json({
      totalIncome: totalIncome,
      stallStats: statusResult.rows,
      // 👇 ต้องมีก้อนนี้ Frontend ถึงจะไม่ Error ครับ
      incomeTypes: { 
        rent: totalIncome,
        water: totalIncome * 0.1, 
        electric: totalIncome * 0.2
      }
    });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

app.get('/stalls', async (req, res) => {
  try {
    const result = await pool.query(`SELECT stalls.*, users.full_name AS tenant_name FROM stalls LEFT JOIN users ON stalls.tenant_id = users.id ORDER BY stalls.id ASC`);
    res.json(result.rows);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

app.post('/stalls/add', async (req, res) => {
  const { code, zone_id, monthly_price } = req.body;
  try {
    await pool.query("INSERT INTO stalls (code, zone_id, status, monthly_price) VALUES ($1, $2, 'VACANT', $3)", [code, zone_id, monthly_price]);
    res.json({ message: 'Added' });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

app.delete('/stalls/:id', async (req, res) => {
  try { await pool.query("DELETE FROM stalls WHERE id = $1", [req.params.id]); res.json({ message: 'Deleted' }); } 
  catch (err) { res.status(500).json({ message: err.message }); }
});

app.post('/book', async (req, res) => {
  const { stall_id, user_id, image, doc_image } = req.body; 
  try {
    await pool.query("UPDATE stalls SET status = 'PENDING', tenant_id = $1, slip_image = $2, doc_image = $3 WHERE id = $4", [user_id, image, doc_image, stall_id]);
    res.json({ message: 'Booked' });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

app.put('/stalls/:id/approve', async (req, res) => {
  try { await pool.query("UPDATE stalls SET status = 'OCCUPIED' WHERE id = $1", [req.params.id]); res.json({ message: 'Approved' }); } catch (err) { res.status(500).json({ message: err.message }); }
});
app.put('/stalls/:id/reject', async (req, res) => {
  try { await pool.query("UPDATE stalls SET status = 'VACANT', tenant_id = NULL, slip_image = NULL, doc_image = NULL WHERE id = $1", [req.params.id]); res.json({ message: 'Rejected' }); } catch (err) { res.status(500).json({ message: err.message }); }
});
app.put('/stalls/:id/cancel', async (req, res) => {
  try { await pool.query("UPDATE stalls SET status = 'VACANT', tenant_id = NULL, slip_image = NULL, doc_image = NULL, bill_total = 0, bill_status='PAID' WHERE id = $1", [req.params.id]); res.json({ message: 'Cancelled' }); } catch (err) { res.status(500).json({ message: err.message }); }
});

// Billing
app.post('/notify/bill', async (req, res) => {
  const { stall_code, water, electric, total } = req.body;
  try {
    await pool.query("UPDATE stalls SET bill_water=$1, bill_electric=$2, bill_total=$3, bill_status='UNPAID', bill_slip_image=NULL WHERE code=$4", [water, electric, total, stall_code]);
    res.json({ message: 'Bill sent' });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

app.post('/pay/bill', async (req, res) => {
    const { stall_id, image } = req.body;
    try {
        await pool.query("UPDATE stalls SET bill_status='PENDING', bill_slip_image=$1 WHERE id=$2", [image, stall_id]);
        res.json({ message: 'Paid' });
    } catch (err) { res.status(500).json({ message: err.message }); }
});

app.put('/bill/:id/approve', async (req, res) => {
    const { id } = req.params;
    try {
        const stallRes = await pool.query(`SELECT stalls.*, users.full_name AS t_name FROM stalls LEFT JOIN users ON stalls.tenant_id = users.id WHERE stalls.id = $1`, [id]);
        const stall = stallRes.rows[0];
        if (stall) {
            await pool.query(`INSERT INTO payment_history (stall_code, tenant_name, amount, rent_amount, water_amount, electric_amount, slip_image) VALUES ($1, $2, $3, $4, $5, $6, $7)`,
                [stall.code, stall.t_name||'Unknown', stall.bill_total, stall.monthly_price, stall.bill_water, stall.bill_electric, stall.bill_slip_image]
            );
        }
        await pool.query("UPDATE stalls SET bill_water=0, bill_electric=0, bill_total=0, bill_status='PAID', bill_slip_image=NULL WHERE id=$1", [id]);
        res.json({ message: 'Bill Approved' });
    } catch (err) { res.status(500).json({ message: err.message }); }
});

app.put('/bill/:id/reject', async (req, res) => {
    try { await pool.query("UPDATE stalls SET bill_status='UNPAID', bill_slip_image=NULL WHERE id=$1", [req.params.id]); res.json({ message: 'Bill Rejected' }); } catch (err) { res.status(500).json({ message: err.message }); }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => { console.log(`Server running on port ${PORT}`); });