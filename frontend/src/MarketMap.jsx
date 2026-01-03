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

  // Helper ชื่อโซน
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
    const deposit = price; // สมมติเงินประกัน 1 เดือน
    const totalPrepare = price + deposit; // ยอดรวมที่ต้องเตรียม

    // 🔥 STEP 1: แสดงกฎระเบียบและสิ่งที่ต้องเตรียม
    Swal.fire({
      title: '📜 สิ่งที่ต้องเตรียมและขั้นตอน',
      width: '650px', // ขยายกว้างหน่อยให้อ่านง่าย
      html: `
        <div style="text-align: left; font-size: 0.9rem; line-height: 1.6;">
          
          <h4 style="color: #d97706; margin-bottom:5px;">1. 📄 เอกสารสำคัญที่ต้องพกไป (Documents)</h4>
          <ul style="margin-bottom: 15px; padding-left: 20px;">
            <li><b>สำเนาบัตรประชาชน & ทะเบียนบ้าน</b> (เซ็นรับรองสำเนาถูกต้อง)</li>
            <li><b>รูปถ่าย</b> สำหรับติดบัตรผู้ค้า (ตามระเบียบตลาด)</li>
            <li>เอกสารอื่นๆ เช่น ใบเปลี่ยนชื่อ หรือใบรับรองมาตรฐานสินค้า (ถ้ามี)</li>
          </ul>

          <h4 style="color: #10b981; margin-bottom:5px;">2. 💰 เงินทุนที่ต้องเตรียม (วันทำสัญญา)</h4>
          <ul style="margin-bottom: 15px; padding-left: 20px;">
            <li><b>เงินประกันสัญญา:</b> ${deposit.toLocaleString()} บาท (1 เดือน)</li>
            <li><b>ค่าเช่าล่วงหน้า:</b> ${price.toLocaleString()} บาท (1 เดือน)</li>
            <li>ค่าธรรมเนียมอื่นๆ (ขยะ/ภาษี) ตามตกลงในสัญญา</li>
            <li style="color: red; font-weight: bold;">รวมเตรียมมาประมาณ: ${totalPrepare.toLocaleString()} บาท + ค่าธรรมเนียม</li>
          </ul>

          <h4 style="color: #3b82f6; margin-bottom:5px;">3. 🚶 ขั้นตอนการดำเนินการ (Procedure)</h4>
          <ul style="margin-bottom: 0; padding-left: 20px;">
            <li><b>1. จองในเว็บนี้:</b> แนบสลิปจองเพื่อล็อกแผง (รอแอดมินอนุมัติ)</li>
            <li><b>2. ติดต่อสนง.ตลาด:</b> เมื่ออนุมัติแล้ว ให้ไปที่สำนักงานเพื่อยื่นเอกสาร</li>
            <li><b>3. ทำสัญญาเช่า:</b> ตรวจสอบสัญญาและชำระเงินส่วนที่เหลือ</li>
          </ul>

        </div>
      `,
      icon: 'info',
      showCancelButton: true,
      confirmButtonText: 'รับทราบและดำเนินการต่อ',
      confirmButtonColor: '#3b82f6',
      cancelButtonText: 'ยกเลิก',
    }).then((result) => {
      
      // 🔥 STEP 2: ถ้ากดรับทราบ ค่อยให้แนบสลิป
      if (result.isConfirmed) {
        Swal.fire({
          title: `ยืนยันจองแผง ${stall.code}`,
          text: `ค่าจอง/มัดจำเบื้องต้น: ${price.toLocaleString()} บาท\n(กรุณาแนบสลิปโอนเงิน)`,
          input: 'file',
          inputAttributes: { 'accept': 'image/*', 'aria-label': 'Upload payment slip' },
          showCancelButton: true,
          confirmButtonText: 'ส่งหลักฐานการโอน',
          confirmButtonColor: '#10b981',
          preConfirm: (file) => {
            if (!file) { Swal.showValidationMessage('กรุณาเลือกรูปสลิปก่อนครับ'); }
            return file;
          }
        }).then((fileResult) => {
          if (fileResult.isConfirmed) {
            const file = fileResult.value;
            const reader = new FileReader();
            reader.onload = (e) => {
              // ส่งข้อมูลไป Backend
              axios.post('https://smart-market-h5xu.onrender.com/book', {
                stall_id: stall.id,
                user_id: user.id,
                stall_code: stall.code,
                user_name: user.full_name,
                image: e.target.result
              })
              .then(() => {
                Swal.fire('ส่งหลักฐานเรียบร้อย!', 'เจ้าหน้าที่จะตรวจสอบและแจ้งผลผ่าน Discord/Web', 'success');
                fetchStalls();
              })
              .catch(err => Swal.fire('Error', err.message, 'error'));
            };
            reader.readAsDataURL(file);
          }
        });
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