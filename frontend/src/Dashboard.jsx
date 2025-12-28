import { useEffect, useState } from 'react';
import axios from 'axios';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { Wallet, Store } from 'lucide-react';
import StallTable from './StallTable';

function Dashboard() {
  const [stats, setStats] = useState(null);
  const [error, setError] = useState(null); // ตัวแปรเก็บ Error

  useEffect(() => {
    // ดึงข้อมูลสถิติ
    axios.get('https://smart-market-h5xu.onrender.com/admin/stats')
      .then(res => setStats(res.data))
      .catch(err => {
        console.error(err);
        // ถ้าพัง ให้เก็บข้อความ Error ไว้บอกหน้าจอ
        setError(err.response?.data?.message || err.message);
      });
  }, []);

  // 🔴 1. ถ้ามี Error ให้โชว์กรอบแดงๆ ฟ้องเลย
  if (error) return (
    <div style={{ padding: '30px', textAlign: 'center', color: '#721c24', backgroundColor: '#f8d7da', borderRadius: '10px', margin: '20px' }}>
        <h3>⚠️ เกิดข้อผิดพลาดในการโหลดข้อมูล</h3>
        <p>ระบบแจ้งว่า: <strong>{error}</strong></p>
        <hr style={{ borderColor: '#f5c6cb', margin: '15px 0' }}/>
        <p style={{ fontSize: '0.9rem' }}>
          <strong>วิธีแก้เบื้องต้น:</strong><br/>
          ถ้าขึ้นว่า <em>"404 Not Found"</em> แปลว่าลืมอัปเดตไฟล์ server.js (หลังบ้าน)<br/>
          ถ้าขึ้นว่า <em>"Network Error"</em> แปลว่า Server บน Render กำลังหลับอยู่ (รอกด Refresh ใหม่)
        </p>
    </div>
  );

  // 🟡 2. ถ้ากำลังโหลด (เปลี่ยนข้อความให้รู้ว่าเป็นโค้ดใหม่)
  if (!stats) return <p style={{ padding: '40px', textAlign: 'center', fontSize: '1.2rem', color: '#666' }}>⏳ กำลังติดต่อ Server... (รอสักครู่นะครับ)</p>;

  // ... (ส่วนกราฟข้างล่างเหมือนเดิม) ...
  const COLORS = ['#ef4444', '#10b981', '#ccc']; 
  const pieData = stats.stallStats.map(s => ({
    name: s.status === 'OCCUPIED' ? 'มีคนเช่า' : (s.status === 'VACANT' ? 'ว่าง' : 'ปิดปรับปรุง'),
    value: parseInt(s.count)
  }));
  const barData = [
    { name: 'ค่าเช่า', amount: parseInt(stats.incomeTypes.rent || 0) },
    { name: 'ค่าน้ำ', amount: parseInt(stats.incomeTypes.water || 0) },
    { name: 'ค่าไฟ', amount: parseInt(stats.incomeTypes.electric || 0) },
  ];

  return (
    <div style={{ marginBottom: '40px' }}>
      <h2 style={{ borderBottom: 'none', marginBottom: '20px' }}>📊 แดชบอร์ดผู้บริหาร</h2>
      
      {/* การ์ดสรุปตัวเลข */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px', marginBottom: '30px' }}>
        <div style={{ background: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderLeft: '5px solid #2563eb' }}>
          <div>
            <p style={{ margin: 0, color: '#6b7280', fontSize: '0.9rem' }}>รายได้รวมทั้งหมด</p>
            <h2 style={{ margin: '5px 0', fontSize: '1.8rem', color: '#1f2937', border: 'none' }}>
              ฿{parseInt(stats.totalIncome || 0).toLocaleString()}
            </h2>
          </div>
          <div style={{ background: '#eff6ff', padding: '10px', borderRadius: '50%' }}>
            <Wallet size={32} color="#2563eb" />
          </div>
        </div>

        <div style={{ background: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderLeft: '5px solid #f59e0b' }}>
          <div>
            <p style={{ margin: 0, color: '#6b7280', fontSize: '0.9rem' }}>พื้นที่เช่าทั้งหมด</p>
            <h2 style={{ margin: '5px 0', fontSize: '1.8rem', color: '#1f2937', border: 'none' }}>
              {stats.stallStats.reduce((acc, curr) => acc + parseInt(curr.count), 0)} แผง
            </h2>
          </div>
          <div style={{ background: '#fffbeb', padding: '10px', borderRadius: '50%' }}>
            <Store size={32} color="#f59e0b" />
          </div>
        </div>
      </div>

      {/* กราฟ */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px', marginBottom: '40px' }}>
        <div style={{ background: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
          <h3 style={{ marginTop: 0, color: '#4b5563' }}>💰 สัดส่วนรายได้</h3>
          <div style={{ width: '100%', height: 250 }}>
            <ResponsiveContainer>
              <BarChart data={barData}>
                <XAxis dataKey="name" tick={{fontSize: 12}} />
                <YAxis tick={{fontSize: 12}} />
                <Tooltip formatter={(value) => `฿${value.toLocaleString()}`} />
                <Bar dataKey="amount" fill="#3b82f6" radius={[4, 4, 0, 0]}>
                  {barData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={['#3b82f6', '#0ea5e9', '#facc15'][index % 3]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div style={{ background: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
          <h3 style={{ marginTop: 0, color: '#4b5563' }}>🥧 สถานะพื้นที่เช่า</h3>
          <div style={{ width: '100%', height: 250 }}>
            <ResponsiveContainer>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={5} dataKey="value">
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.name === 'มีคนเช่า' ? '#ef4444' : '#10b981'} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend verticalAlign="bottom" height={36}/>
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <StallTable />
    </div>
  );
}

export default Dashboard;