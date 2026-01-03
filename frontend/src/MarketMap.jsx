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

  const handleBooking = (stall) => {
    if (!user) { Swal.fire('กรุณา Login', 'ต้องเข้าสู่ระบบก่อนจองนะครับ', 'warning'); return; }

    // 1. ให้ลูกค้าเลือกรูปสลิป
    Swal.fire({
      title: `จองแผง ${stall.code}`,
      text: `โซน: ${stall.zone_id === 1 ? 'อาหาร (Zone A)' : 'เสื้อผ้า (Zone B)'}\nกรุณาแนบสลิปโอนเงิน`,
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
        
        // 2. แปลงรูปและส่งข้อมูล
        reader.onload = (e) => {
          const base64Image = e.target.result;
          axios.post('https://smart-market-h5xu.onrender.com/book', {
            stall_id: stall.id,
            user_id: user.id,
            stall_code: stall.code,
            user_name: user.full_name,
            image: base64Image
          })
          .then(() => {
            Swal.fire('ส่งหลักฐานแล้ว!', 'รอแอดมินตรวจสอบสักครู่นะครับ', 'success');
            fetchStalls();
          })
          .catch(err => Swal.fire('Error', err.message, 'error'));
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
      
      {/* ส่วนแสดงรายการแผง */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '15px' }}>
        {stalls.map((stall) => {
            // เช็คสถานะเพื่อเลือกสี
            let bgColor = '#10b981'; // ว่าง (เขียว)
            let cursor = 'pointer';
            let statusText = `฿${parseInt(stall.monthly_price).toLocaleString()}`; // ปกติโชว์ราคา

            if (stall.status === 'OCCUPIED') {
                bgColor = '#ef4444'; // ไม่ว่าง (แดง)
                cursor = 'not-allowed';
                statusText = '🔒 จองแล้ว';
            } else if (stall.status === 'PENDING') {
                bgColor = '#f59e0b'; // รอตรวจ (เหลือง)
                cursor = 'not-allowed';
                statusText = '⏳ รอตรวจสอบ';
            }

            return (
              <div 
                key={stall.id}
                onClick={() => stall.status === 'VACANT' && handleBooking(stall)}
                style={{
                  backgroundColor: bgColor,
                  color: 'white',
                  padding: '15px',
                  borderRadius: '12px',
                  textAlign: 'center',
                  cursor: cursor,
                  boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                  transition: 'transform 0.2s',
                  border: '2px solid rgba(255,255,255,0.2)'
                }}
                onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
              >
                {/* 1. รหัสแผง */}
                <div style={{ fontSize: '1.4rem', fontWeight: 'bold' }}>{stall.code}</div>
                
                {/* 2. ✅ เพิ่มชื่อโซนตรงนี้ครับ */}
                <div style={{ fontSize: '0.9rem', margin: '5px 0', opacity: 0.9 }}>
                    {stall.zone_id === 1 ? '🍜 Zone A' : '👕 Zone B'}
                </div>

                {/* 3. ราคา/สถานะ */}
                <div style={{ 
                    fontSize: '0.8rem', 
                    background: 'rgba(0,0,0,0.2)', 
                    padding: '4px', 
                    borderRadius: '4px',
                    marginTop: '5px'
                }}>
                    {statusText}
                </div>
              </div>
            );
        })}
      </div>
      
      {/* คำอธิบายสี */}
      <div style={{ marginTop: '30px', display: 'flex', gap: '20px', justifyContent: 'center', fontSize: '0.9rem', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <div style={{ width: '15px', height: '15px', background: '#10b981', borderRadius: '50%' }}></div> ว่าง (จองได้)
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <div style={{ width: '15px', height: '15px', background: '#f59e0b', borderRadius: '50%' }}></div> รอตรวจสอบ
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <div style={{ width: '15px', height: '15px', background: '#ef4444', borderRadius: '50%' }}></div> ไม่ว่าง
        </div>
      </div>
    </div>
  );
}

export default MarketMap;