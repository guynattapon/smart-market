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
      text: "กรุณาแนบสลิปโอนเงิน",
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
            image: base64Image // ส่งรูปไปด้วย
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
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: '15px' }}>
        {stalls.map((stall) => {
            // เช็คสถานะเพื่อเลือกสี
            let bgColor = '#10b981'; // ว่าง (เขียว)
            let cursor = 'pointer';
            let title = `ว่าง - ${parseInt(stall.monthly_price).toLocaleString()} บาท`;

            if (stall.status === 'OCCUPIED') {
                bgColor = '#ef4444'; // ไม่ว่าง (แดง)
                cursor = 'not-allowed';
                title = `ไม่ว่าง (จองโดย ${stall.tenant_name})`;
            } else if (stall.status === 'PENDING') {
                bgColor = '#f59e0b'; // รอตรวจ (เหลือง)
                cursor = 'not-allowed';
                title = 'รอตรวจสอบสลิป';
            }

            return (
              <div 
                key={stall.id}
                onClick={() => stall.status === 'VACANT' && handleBooking(stall)}
                style={{
                  backgroundColor: bgColor,
                  color: 'white',
                  padding: '20px',
                  borderRadius: '12px',
                  textAlign: 'center',
                  cursor: cursor,
                  boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                  transition: 'transform 0.2s',
                  border: '2px solid rgba(255,255,255,0.2)'
                }}
                onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
                title={title}
              >
                <div style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>{stall.code}</div>
                <div style={{ fontSize: '0.8rem', marginTop: '5px' }}>
                    {stall.status === 'VACANT' ? `฿${stall.monthly_price}` : (stall.status === 'PENDING' ? '⏳ รอตรวจ' : '🔒 จองแล้ว')}
                </div>
              </div>
            );
        })}
      </div>
      
      {/* คำอธิบายสี */}
      <div style={{ marginTop: '30px', display: 'flex', gap: '20px', justifyContent: 'center', fontSize: '0.9rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <div style={{ width: '15px', height: '15px', background: '#10b981', borderRadius: '50%' }}></div> ว่าง
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