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

    const price = parseInt(stall.monthly_price);
    const deposit = price; 
    const totalPrepare = price + deposit; 

    // 🔥 STEP 1: แจ้งกฎระเบียบ
    Swal.fire({
      title: '📜 สิ่งที่ต้องเตรียม',
      width: '600px',
      html: `
        <div style="text-align: left; font-size: 0.9rem;">
          <h4 style="color:#d97706">1. 📄 เอกสารที่ต้องใช้ (Documents)</h4>
          <ul><li>สำเนาบัตรประชาชน / ทะเบียนบ้าน</li></ul>
          <h4 style="color:#10b981">2. 💰 ยอดชำระวันนี้</h4>
          <ul><li>ค่าจอง/มัดจำ: <b>${price.toLocaleString()}</b> บาท</li></ul>
        </div>
        <p style="color:red; font-size:0.8rem; margin-top:10px;">*กรุณาเตรียมไฟล์รูปภาพให้พร้อมก่อนกดดำเนินการต่อ</p>
      `,
      icon: 'info',
      showCancelButton: true,
      confirmButtonText: 'รับทราบและดำเนินการต่อ',
      confirmButtonColor: '#3b82f6',
    }).then((result) => {
      
      if (result.isConfirmed) {
        // 🔥 STEP 2: ขอรูปสลิป (Slip)
        Swal.fire({
          title: 'ขั้นตอนที่ 1/2',
          text: `กรุณาแนบ "สลิปโอนเงิน" (${price.toLocaleString()} บ.)`,
          input: 'file',
          inputAttributes: { 'accept': 'image/*' },
          confirmButtonText: 'ถัดไป >',
          confirmButtonColor: '#10b981',
          showCancelButton: true,
          preConfirm: (file) => file || Swal.showValidationMessage('กรุณาแนบสลิป')
        }).then((slipResult) => {
          
          if (slipResult.isConfirmed) {
            const slipFile = slipResult.value;

            // 🔥 STEP 3: ขอรูปเอกสาร (Document)
            Swal.fire({
              title: 'ขั้นตอนที่ 2/2',
              text: 'กรุณาแนบ "สำเนาบัตรประชาชน" หรือเอกสารยืนยันตัวตน',
              input: 'file',
              inputAttributes: { 'accept': 'image/*' },
              confirmButtonText: 'ส่งข้อมูลการจอง',
              confirmButtonColor: '#3b82f6',
              showCancelButton: true,
              preConfirm: (file) => file || Swal.showValidationMessage('กรุณาแนบเอกสาร')
            }).then((docResult) => {

              if (docResult.isConfirmed) {
                const docFile = docResult.value;
                
                // แปลงไฟล์ทั้งคู่เป็น Base64
                const reader1 = new FileReader();
                reader1.readAsDataURL(slipFile);
                reader1.onload = (e1) => {
                    const slipBase64 = e1.target.result;
                    
                    const reader2 = new FileReader();
                    reader2.readAsDataURL(docFile);
                    reader2.onload = (e2) => {
                        const docBase64 = e2.target.result;

                        // ส่งไป Server
                        Swal.fire({title: 'กำลังส่งข้อมูล...', allowOutsideClick: false, didOpen: () => Swal.showLoading()});
                        
                        axios.post('https://smart-market-h5xu.onrender.com/book', {
                            stall_id: stall.id,
                            user_id: user.id,
                            stall_code: stall.code,
                            user_name: user.full_name,
                            image: slipBase64,     // สลิป
                            doc_image: docBase64   // เอกสาร
                        })
                        .then(() => {
                            Swal.fire('จองสำเร็จ!', 'ส่งสลิปและเอกสารเรียบร้อย รอตรวจสอบ', 'success');
                            fetchStalls();
                        })
                        .catch(err => Swal.fire('Error', err.message, 'error'));
                    };
                };
              }
            });
          }
        });
      }
    });
  };

  // ... (ส่วน return เหมือนเดิม ไม่ต้องแก้)
  return (
    <div className="card">
      <h2 style={{ marginBottom: '20px', borderBottom: '2px solid #eee', paddingBottom: '10px' }}>
        🗺️ แผนที่ตลาด (Market Map)
      </h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '15px' }}>
        {stalls.map((stall) => {
            let bgColor = '#10b981'; let cursor = 'pointer'; let statusText = `฿${parseInt(stall.monthly_price).toLocaleString()}`;
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