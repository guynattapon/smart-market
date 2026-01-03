import { useState, useEffect } from 'react';
import axios from 'axios';
import Swal from 'sweetalert2';

function MarketMap({ user, onLogout }) {
  const [stalls, setStalls] = useState([]);
  const [loading, setLoading] = useState(true);

  // ดึงข้อมูลแผงค้า
  const fetchStalls = () => {
    axios.get('https://smart-market-h5xu.onrender.com/stalls')
      .then(res => {
        setStalls(res.data);
        setLoading(false);
      })
      .catch(err => console.error(err));
  };

  useEffect(() => {
    fetchStalls();
  }, []);

  // ฟังก์ชันกดจอง
  const handleBooking = (stall) => {
    if (stall.status === 'OCCUPIED') {
      Swal.fire('ไม่ว่างครับ', `แผง ${stall.code} มีคนเช่าไปแล้ว`, 'warning');
      return;
    }

    Swal.fire({
      title: `ยืนยันจองแผง ${stall.code}?`,
      text: `ราคาค่าเช่า ฿${parseInt(stall.monthly_price).toLocaleString()}/เดือน`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#10b981',
      cancelButtonColor: '#d33',
      confirmButtonText: '✅ ยืนยันจองเลย!',
      cancelButtonText: 'ยกเลิก'
    }).then((result) => {
      if (result.isConfirmed) {
        // ยิง API จอง
        axios.post('https://smart-market-h5xu.onrender.com/book', {
          stall_id: stall.id,
          user_id: user.id
        })
        .then(() => {
          Swal.fire('สำเร็จ!', 'จองแผงเรียบร้อย เตรียมขายของได้เลย!', 'success');
          fetchStalls(); // โหลดข้อมูลใหม่ให้เป็นสีแดงทันที
        })
        .catch(err => {
          Swal.fire('ผิดพลาด', err.response?.data?.message || 'จองไม่สำเร็จ', 'error');
        });
      }
    });
  };

  if (loading) return <div style={{textAlign: 'center', padding: '50px'}}>⏳ กำลังโหลดแผนผังตลาด...</div>;

  // แยกโซน (Zone A = id 1, Zone B = id 2)
  const zoneA = stalls.filter(s => s.zone_id === 1);
  const zoneB = stalls.filter(s => s.zone_id === 2);

  return (
    <div className="container" style={{ maxWidth: '1000px', margin: '20px auto', padding: '20px' }}>
      
      {/* 🟢 ส่วนหัว Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
        <div>
          <h2 style={{ margin: 0, color: '#2c3e50', border: 'none' }}>🏪 จองแผงตลาด</h2>
          <p style={{ color: '#666' }}>สวัสดีคุณ <strong>{user.full_name}</strong> (เลือกแผงที่ชอบได้เลยครับ)</p>
        </div>
        <button onClick={onLogout} style={{ backgroundColor: '#ef4444', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '30px' }}>
          ออกจากระบบ
        </button>
      </div>

      {/* 💡 คำอธิบายสี (Legend) */}
      <div style={{ display: 'flex', gap: '20px', justifyContent: 'center', marginBottom: '30px', background: 'white', padding: '15px', borderRadius: '15px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ width: '20px', height: '20px', background: '#10b981', borderRadius: '5px' }}></div>
          <span>ว่าง (จองได้)</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ width: '20px', height: '20px', background: '#ef4444', borderRadius: '5px' }}></div>
          <span>ไม่ว่าง (มีคนจองแล้ว)</span>
        </div>
      </div>

      {/* 🗺️ แผนผังโซน A */}
      <div className="zone-section" style={{ marginBottom: '40px' }}>
        <h3 style={{ background: '#e0f2fe', color: '#0369a1', padding: '10px 20px', borderRadius: '10px', display: 'inline-block' }}>
          🍜 Zone A: โซนอาหาร
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: '15px', marginTop: '15px' }}>
          {zoneA.map(stall => (
            <StallBox key={stall.id} stall={stall} onClick={() => handleBooking(stall)} />
          ))}
        </div>
      </div>

      {/* 🗺️ แผนผังโซน B */}
      <div className="zone-section">
        <h3 style={{ background: '#fce7f3', color: '#be185d', padding: '10px 20px', borderRadius: '10px', display: 'inline-block' }}>
          👕 Zone B: โซนเสื้อผ้า
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: '15px', marginTop: '15px' }}>
          {zoneB.map(stall => (
            <StallBox key={stall.id} stall={stall} onClick={() => handleBooking(stall)} />
          ))}
        </div>
      </div>

    </div>
  );
}

// 📦 คอมโพเนนต์กล่องแผงค้า (Stall Box)
function StallBox({ stall, onClick }) {
  const isOccupied = stall.status === 'OCCUPIED';
  
  return (
    <div 
      onClick={onClick}
      style={{
        height: '100px',
        background: isOccupied ? '#fee2e2' : '#d1fae5', // สีพื้นหลังอ่อนๆ
        border: `2px solid ${isOccupied ? '#ef4444' : '#10b981'}`, // เส้นขอบเข้ม
        borderRadius: '12px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        cursor: 'pointer',
        transition: 'transform 0.2s, box-shadow 0.2s',
        position: 'relative',
        boxShadow: '0 4px 6px rgba(0,0,0,0.05)'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-5px)';
        e.currentTarget.style.boxShadow = '0 10px 15px rgba(0,0,0,0.1)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = '0 4px 6px rgba(0,0,0,0.05)';
      }}
    >
      <span style={{ fontWeight: 'bold', fontSize: '1.2rem', color: '#333' }}>{stall.code}</span>
      <span style={{ fontSize: '0.8rem', color: isOccupied ? '#b91c1c' : '#047857' }}>
        {isOccupied ? '❌ ไม่ว่าง' : '✅ ว่าง'}
      </span>
      <span style={{ fontSize: '0.75rem', color: '#666', marginTop: '5px' }}>
        ฿{parseInt(stall.monthly_price).toLocaleString()}
      </span>
    </div>
  );
}

export default MarketMap;