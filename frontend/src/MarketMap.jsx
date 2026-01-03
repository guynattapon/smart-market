import { useEffect, useState } from 'react';
import axios from 'axios';
import Swal from 'sweetalert2';

function MarketMap({ user }) {
  const [stalls, setStalls] = useState([]);

  const fetchStalls = () => {
    axios.get('https://smart-market-h5xu.onrender.com/stalls')
      .then(res => setStalls(res.data))
      .catch(err => console.error(err));
  };

  useEffect(() => { fetchStalls(); }, []);

  // 👇 Helper สำหรับชื่อโซน (หน้าลูกค้าเอาแบบเต็มยศ)
  const getZoneDisplayName = (id) => {
    switch(parseInt(id)) {
      case 1: return '🥩 โซนของสด (Fresh Market)';
      case 2: return '🍛 อาหารปรุงสำเร็จ (Street Food)';
      case 3: return '🥫 โซนของแห้ง (Dry Goods)';
      case 4: return '👕 เบ็ดเตล็ด/เสื้อผ้า (General)';
      case 5: return '☕ โซนคาเฟ่ (Cafe & Modern)';
      default: return '📍 โซนทั่วไป';
    }
  };

  const handleBooking = (stall) => {
    if (!user) { Swal.fire('กรุณา Login', 'ต้องเข้าสู่ระบบก่อนจองนะครับ', 'warning'); return; }

    Swal.fire({
      title: `จองแผง ${stall.code}`,
      // 👇 ดึงชื่อโซนมาโชว์ใน popup ด้วย
      text: `${getZoneDisplayName(stall.zone_id)}\nกรุณาแนบสลิปโอนเงิน`,
      input: 'file',
      inputAttributes: { 'accept': 'image/*', 'aria-label': 'Upload payment slip' },
      showCancelButton: true,
      confirmButtonText: 'ส่งหลักฐาน',
      confirmButtonColor: '#10b981',
      preConfirm: (file) => {
        if (!file) { Swal.showValidationMessage('กรุณาเลือกรูปสลิปก่อนครับ'); }
        return file;
      }
    }).then((result) => {
      if (result.isConfirmed) {
        const file = result.value;
        const reader = new FileReader();
        reader.onload = (e) => {
          axios.post('https://smart-market-h5xu.onrender.com/book', {
            stall_id: stall.id,
            user_id: user.id,
            stall_code: stall.code,
            user_name: user.full_name,
            image: e.target.result
          }).then(() => { Swal.fire('สำเร็จ', 'รอตรวจสอบ', 'success'); fetchStalls(); });
        };
        reader.readAsDataURL(file);
      }
    });
  };

  return (
    <div className="card">
      <h2 style={{ marginBottom: '20px', borderBottom: '2px solid #eee', paddingBottom: '10px' }}>
        🗺️ แผนที่ตลาด (Market Map)
      </h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '15px' }}>
        {stalls.map((stall) => {
            let bgColor = '#10b981'; 
            let cursor = 'pointer';
            let statusText = `฿${parseInt(stall.monthly_price).toLocaleString()}`;

            if (stall.status === 'OCCUPIED') { bgColor = '#ef4444'; cursor = 'not-allowed'; statusText = '🔒 จองแล้ว'; } 
            else if (stall.status === 'PENDING') { bgColor = '#f59e0b'; cursor = 'not-allowed'; statusText = '⏳ รอตรวจสอบ'; }

            return (
              <div key={stall.id} onClick={() => stall.status === 'VACANT' && handleBooking(stall)}
                style={{
                  backgroundColor: bgColor, color: 'white', padding: '15px', borderRadius: '12px',
                  textAlign: 'center', cursor: cursor, boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                  transition: 'transform 0.2s', border: '2px solid rgba(255,255,255,0.2)'
                }}
                onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
              >
                <div style={{ fontSize: '1.4rem', fontWeight: 'bold' }}>{stall.code}</div>
                
                {/* 👇 แสดงชื่อโซนตรงนี้ */}
                <div style={{ fontSize: '0.85rem', margin: '5px 0', opacity: 0.9, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {getZoneDisplayName(stall.zone_id)}
                </div>

                <div style={{ fontSize: '0.8rem', background: 'rgba(0,0,0,0.2)', padding: '4px', borderRadius: '4px', marginTop: '5px' }}>
                    {statusText}
                </div>
              </div>
            );
        })}
      </div>
    </div>
  );
}

export default MarketMap;