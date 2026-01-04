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
    const deposit = price; // ประกัน 1 เดือน
    const totalPrepare = price + deposit; // ยอดรวมที่ต้องเตรียม

    // 🔥 STEP 1: หน้าต่างกฎระเบียบ (เนื้อหาละเอียดเหมือนเดิม)
    Swal.fire({
      title: '📜 สิ่งที่ต้องเตรียมและขั้นตอน',
      width: '700px', // กว้างหน่อยให้อ่านง่าย
      html: `
        <div style="text-align: left; font-size: 0.95rem; line-height: 1.6;">
          
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
            <li><b>1. จองในเว็บนี้:</b> แนบเอกสารและสลิปจองเพื่อล็อกแผง</li>
            <li><b>2. ติดต่อสนง.ตลาด:</b> เมื่ออนุมัติแล้ว ให้ไปที่สำนักงานเพื่อยื่นเอกสารจริง</li>
            <li><b>3. ทำสัญญาเช่า:</b> ตรวจสอบสัญญาและชำระเงินส่วนที่เหลือ</li>
          </ul>

        </div>
      `,
      icon: 'info',
      showCancelButton: true,
      confirmButtonText: 'รับทราบและดำเนินการต่อ >', // ปุ่มไป Step 2
      confirmButtonColor: '#3b82f6',
      cancelButtonText: 'ยกเลิก',
    }).then((result) => {
      
      // ถ้ากด "รับทราบ" -> ไป Step 2
      if (result.isConfirmed) {
        
        // 🔥 STEP 2: ขอรูปเอกสาร (บัตร ปชช.)
        Swal.fire({
          title: 'ขั้นตอนที่ 1/2: ส่งเอกสาร',
          text: 'กรุณาแนบภาพ "สำเนาบัตรประชาชน" หรือ "ทะเบียนบ้าน"',
          input: 'file',
          inputAttributes: { 'accept': 'image/*', 'aria-label': 'Upload ID Card' },
          confirmButtonText: 'ถัดไป >',
          confirmButtonColor: '#10b981',
          showCancelButton: true,
          cancelButtonText: 'ย้อนกลับ',
          preConfirm: (file) => {
            if (!file) { Swal.showValidationMessage('กรุณาแนบเอกสารก่อนไปต่อครับ'); }
            return file;
          }
        }).then((docResult) => {

          // ถ้าได้ไฟล์เอกสารแล้ว -> ไป Step 3
          if (docResult.isConfirmed) {
            const docFile = docResult.value;

            // 🔥 STEP 3: ขอรูปสลิป (Slip)
            Swal.fire({
              title: 'ขั้นตอนที่ 2/2: ชำระเงินจอง',
              text: `กรุณาแนบ "สลิปโอนเงิน" จำนวน ${price.toLocaleString()} บาท`,
              input: 'file',
              inputAttributes: { 'accept': 'image/*', 'aria-label': 'Upload Slip' },
              confirmButtonText: 'ยืนยันการจอง ✅',
              confirmButtonColor: '#ef4444', // สีแดงให้ดูสำคัญ
              showCancelButton: true,
              cancelButtonText: 'ย้อนกลับ',
              preConfirm: (file) => {
                if (!file) { Swal.showValidationMessage('กรุณาแนบสลิปก่อนยืนยันครับ'); }
                return file;
              }
            }).then((slipResult) => {

              // ถ้าได้ครบทั้ง 2 ไฟล์ -> ส่งข้อมูลเข้า Server
              if (slipResult.isConfirmed) {
                const slipFile = slipResult.value;

                // เริ่มกระบวนการแปลงไฟล์และส่งข้อมูล
                const reader1 = new FileReader();
                reader1.readAsDataURL(docFile); // อ่านไฟล์เอกสาร
                
                reader1.onload = (e1) => {
                    const docBase64 = e1.target.result;
                    
                    const reader2 = new FileReader();
                    reader2.readAsDataURL(slipFile); // อ่านไฟล์สลิป
                    
                    reader2.onload = (e2) => {
                        const slipBase64 = e2.target.result;

                        // แสดง Loading
                        Swal.fire({
                            title: 'กำลังส่งข้อมูล...',
                            html: 'ระบบกำลังบันทึกเอกสารและแจ้งเตือนแอดมิน',
                            allowOutsideClick: false,
                            didOpen: () => Swal.showLoading()
                        });
                        
                        // ยิง API
                        axios.post('https://smart-market-h5xu.onrender.com/book', {
                            stall_id: stall.id,
                            user_id: user.id,
                            stall_code: stall.code,
                            user_name: user.full_name,
                            image: slipBase64,     // รูปสลิป
                            doc_image: docBase64   // รูปเอกสาร
                        })
                        .then(() => {
                            Swal.fire('จองสำเร็จ!', 'ส่งเอกสารครบถ้วน รอแอดมินตรวจสอบ', 'success');
                            fetchStalls();
                        })
                        .catch(err => Swal.fire('เกิดข้อผิดพลาด', err.message, 'error'));
                    };
                };
              }
            });
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