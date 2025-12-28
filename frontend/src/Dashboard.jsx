import { useEffect, useState } from 'react';
import axios from 'axios';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { Wallet, Store } from 'lucide-react';

function Dashboard() {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    axios.get('https://smart-market-h5xu.onrender.com/admin/stats')
      .then(res => setStats(res.data))
      .catch(err => console.error(err));
  }, []);

  if (!stats) return <p>กำลังประมวลผลข้อมูล...</p>;

  // เตรียมสีสำหรับกราฟ
  const COLORS = ['#ef4444', '#10b981', '#ccc']; // แดง (ไม่ว่าง), เขียว (ว่าง), เทา
  
  // แปลงข้อมูลสำหรับกราฟวงกลม
  const pieData = stats.stallStats.map(s => ({
    name: s.status === 'OCCUPIED' ? 'มีคนเช่า' : (s.status === 'VACANT' ? 'ว่าง' : 'ปิดปรับปรุง'),
    value: parseInt(s.count)
  }));

  // แปลงข้อมูลสำหรับกราฟแท่ง
  const barData = [
    { name: 'ค่าเช่า', amount: parseInt(stats.incomeTypes.rent) },
    { name: 'ค่าน้ำ', amount: parseInt(stats.incomeTypes.water) },
    { name: 'ค่าไฟ', amount: parseInt(stats.incomeTypes.electric) },
  ];

  return (
    <div style={{ marginBottom: '40px' }}>
      <h2 style={{ borderBottom: 'none', marginBottom: '20px' }}>📊 แดชบอร์ดผู้บริหาร</h2>
      
      {/* 1. การ์ดสรุปตัวเลข (Top Cards) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px', marginBottom: '30px' }}>
        
        {/* การ์ดรายได้ */}
        <div style={{ background: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderLeft: '5px solid #2563eb' }}>
          <div>
            <p style={{ margin: 0, color: '#6b7280', fontSize: '0.9rem' }}>รายได้รวมทั้งหมด</p>
            <h2 style={{ margin: '5px 0', fontSize: '1.8rem', color: '#1f2937', border: 'none' }}>
              ฿{parseInt(stats.totalIncome).toLocaleString()}
            </h2>
          </div>
          <div style={{ background: '#eff6ff', padding: '10px', borderRadius: '50%' }}>
            <Wallet size={32} color="#2563eb" />
          </div>
        </div>

        {/* การ์ดจำนวนแผง */}
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

      {/* 2. กราฟแสดงผล (Charts) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
        
        {/* กราฟแท่ง: แหล่งที่มาของรายได้ */}
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

        {/* กราฟวงกลม: สถานะแผง */}
        <div style={{ background: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
          <h3 style={{ marginTop: 0, color: '#4b5563' }}>🥧 สถานะพื้นที่เช่า</h3>
          <div style={{ width: '100%', height: 250 }}>
            <ResponsiveContainer>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
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
    </div>
  );
}

export default Dashboard;