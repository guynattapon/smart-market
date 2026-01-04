import { useEffect, useState } from 'react';
import axios from 'axios';
import Swal from 'sweetalert2';

function MarketMap({ user }) {
  const [stalls, setStalls] = useState([]);

  // ดึงข้อมูลแผงค้าทั้งหมด
  const fetchStalls = () => {
    axios.get('https://smart-market-h5xu.onrender.com/stalls')
      .then(res => setStalls(res.data))
      .catch(err => console.error(err));
  };

  useEffect(() => { fetchStalls(); }, []);

  // แปลงรหัสโซนเป็นชื่อสวยๆ
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

  // =========================================
  // 1. ฟังก์ชันจองแผง (3 Steps: กฎ -> เอกสาร -> สลิป)
  // =========================================
  const handleBooking = (stall) => {
    if (!user) { Swal.fire('กรุณา Login', 'ต้องเข้าสู่ระบบก่อนจองนะครับ', 'warning'); return; }

    const price = parseInt(stall.monthly_price);
    const deposit = price; // เงินประกัน 1 เดือน
    const totalPrepare = price + deposit; // ยอดรวมที่ต้องเตรียม

    // Step 1: อ่านกฎระเบียบ
    Swal.fire({
      title: '📜 สิ่งที่ต้องเตรียมและขั้นตอน',
      width: '700px',
      html: `
        <div style="text-align: left; font-size: 0.95rem; line-height: 1.6;">
          <h4 style="color: #d97706; margin-bottom:5px;">1. 📄 เอกสารสำคัญ (Documents)</h4>
          <ul style="margin-bottom: 15px; padding-left: 20px;">
            <li><b>สำเนาบัตรประชาชน & ทะเบียนบ้าน</b> (เซ็นรับรองสำเนาถูกต้อง)</li>
            <li><b>รูปถ่าย</b> สำหรับติดบัตรผู้ค้า (ถ้ามี)</li>
          </ul>
          <h4 style="color: #10b981; margin-bottom:5px;">2. 💰 เงินทุนที่ต้องเตรียม (วันทำสัญญา)</h4>
          <ul style="margin-bottom: 15px; padding-left: 20px;">
            <li><b>เงินประกันสัญญา:</b> ${deposit.toLocaleString()} บาท (1 เดือน)</li>
            <li><b>ค่าเช่าล่วงหน้า:</b> ${price.toLocaleString()} บาท (1 เดือน)</li>
            <li style="color: red; font-weight: bold;">รวมเตรียมมาประมาณ: ${totalPrepare.toLocaleString()} บาท + ค่าธรรมเนียม</li>
          </ul>
          <h4 style="color: #3b82f6; margin-bottom:5px;">3. 🚶 ขั้นตอนการดำเนินการ</h4>
          <ul style="margin-bottom: 0; padding-left: 20px;">
            <li>จองในเว็บ (แนบเอกสาร+สลิป) -> รออนุมัติ -> เข้าไปทำสัญญาที่ สนง.</li>
          </ul>
        </div>
      `,
      icon: 'info',
      showCancelButton: true,
      confirmButtonText: 'รับทราบและดำเนินการต่อ >',
      confirmButtonColor: '#3b82f6',
    }).then((result) => {
      if (result.isConfirmed) {
        
        // Step 2: ขอรูปเอกสาร (บัตร ปชช.)
        Swal.fire({
          title: 'ขั้นตอนที่ 1/2: ส่งเอกสาร',
          text: 'กรุณาแนบภาพ "สำเนาบัตรประชาชน" หรือ "เอกสารยืนยันตัวตน"',
          input: 'file',
          inputAttributes: { 'accept': 'image/*' },
          confirmButtonText: 'ถัดไป >',
          confirmButtonColor: '#10b981',
          showCancelButton: true,
          preConfirm: (file) => file || Swal.showValidationMessage('กรุณาแนบเอกสาร')
        }).then((docResult) => {
          if (docResult.isConfirmed) {
            const docFile = docResult.value;

            // Step 3: ขอรูปสลิปเงินจอง
            Swal.fire({
              title: 'ขั้นตอนที่ 2/2: ชำระเงินจอง',
              text: `กรุณาแนบ "สลิปโอนเงิน" จำนวน ${price.toLocaleString()} บาท`,
              input: 'file',
              inputAttributes: { 'accept': 'image/*' },
              confirmButtonText: 'ยืนยันการจอง ✅',
              confirmButtonColor: '#ef4444',
              showCancelButton: true,
              preConfirm: (file) => file || Swal.showValidationMessage('กรุณาแนบสลิป')
            }).then((slipResult) => {
              if (slipResult.isConfirmed) {
                const slipFile = slipResult.value;

                // แปลงไฟล์เป็น Base64 และส่งข้อมูล
                const reader1 = new FileReader();
                reader1.readAsDataURL(docFile);
                reader1.onload = (e1) => {
                    const docBase64 = e1.target.result;
                    const reader2 = new FileReader();
                    reader2.readAsDataURL(slipFile);
                    reader2.onload = (e2) => {
                        const slipBase64 = e2.target.result;

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

  // =========================================
  // 2. ฟังก์ชันจัดการบิล (ดูบิล & แนบสลิปจ่าย)
  // =========================================
  const handleShowBill = (myStall) => {
    const isPending = myStall.bill_status === 'PENDING';

    Swal.fire({
      title: isPending ? '⏳ รอตรวจสอบการชำระเงิน' : '🧾 บิลค่าเช่าประจำเดือน',
      html: `
        <div style="text-align:left; font-size:1rem; line-height:1.8;">
           <p><strong>แผงค้า:</strong> ${myStall.code}</p>
           <hr>
           <div style="display:flex; justify-content:space-between;"><span>🏠 ค่าเช่า:</span> <span>${parseInt(myStall.monthly_price).toLocaleString()} ฿</span></div>
           <div style="display:flex; justify-content:space-between;"><span>💧 ค่าน้ำ:</span> <span>${myStall.bill_water.toLocaleString()} ฿</span></div>
           <div style="display:flex; justify-content:space-between;"><span>⚡ ค่าไฟ:</span> <span>${myStall.bill_electric.toLocaleString()} ฿</span></div>
           <hr>
           <div style="display:flex; justify-content:space-between; font-size:1.2rem; color:#ef4444; font-weight:bold;">
              <span>ยอดรวมทั้งสิ้น:</span> <span>${myStall.bill_total.toLocaleString()} ฿</span>
           </div>
           ${isPending ? '<p style="color:#d97706; margin-top:10px; text-align:center;"><b>กำลังตรวจสอบสลิป... โปรดรอสักครู่</b></p>' : ''}
        </div>
      `,
      icon: isPending ? 'info' : 'warning',
      showCancelButton: true,
      showConfirmButton: !isPending, // ถ้าส่งสลิปแล้ว ซ่อนปุ่มจ่าย
      confirmButtonText: '💸 แนบสลิปจ่ายเงิน',
      confirmButtonColor: '#10b981',
      cancelButtonText: 'ปิดหน้าต่าง'
    }).then((result) => {
       
       // ถ้ากดจ่ายเงิน -> เปิดช่องอัปโหลด
       if (result.isConfirmed && !isPending) {
         Swal.fire({
            title: 'แนบสลิปโอนเงิน',
            text: `ยอดโอน: ${myStall.bill_total.toLocaleString()} บาท`,
            input: 'file',
            inputAttributes: { 'accept': 'image/*' },
            confirmButtonText: 'ยืนยันการจ่าย',
            showCancelButton: true,
            preConfirm: (file) => file || Swal.showValidationMessage('กรุณาเลือกรูปสลิป')
         }).then((fileResult) => {
            if (fileResult.isConfirmed) {
                const file = fileResult.value;
                const reader = new FileReader();
                reader.readAsDataURL(file);
                reader.onload = (e) => {
                    Swal.fire({title: 'กำลังส่งข้อมูล...', didOpen: () => Swal.showLoading()});
                    axios.post('https://smart-market-h5xu.onrender.com/pay/bill', {
                        stall_id: myStall.id,
                        stall_code: myStall.code,
                        image: e.target.result // รูปสลิป
                    }).then(() => {
                        Swal.fire('สำเร็จ', 'ส่งสลิปแล้ว รอแอดมินตรวจสอบ', 'success');
                        fetchStalls();
                    });
                };
            }
         });
       }
    });
  };

  // =========================================
  // 3. ส่วนแสดงผล (Render)
  // =========================================
  
  // เช็คว่า User คนนี้มีแผงของตัวเองไหม และมีหนี้ไหม
  const myStall = user ? stalls.find(s => s.tenant_id === user.id) : null;
  // มีหนี้ ถ้า: ยอด > 0 และ สถานะไม่ใช่ PAID
  const hasBill = myStall && myStall.bill_total > 0 && myStall.bill_status !== 'PAID';

  return (
    <div className="card">
      
      {/* 🔥 ส่วนแจ้งเตือนบิล (กระพริบเตือนเมื่อมีหนี้) */}
      {hasBill && (
        <div style={{ 
            backgroundColor: myStall.bill_status === 'PENDING' ? '#fffbeb' : '#fee2e2', 
            border: `2px solid ${myStall.bill_status === 'PENDING' ? '#f59e0b' : '#ef4444'}`, 
            color: myStall.bill_status === 'PENDING' ? '#b45309' : '#b91c1c', 
            padding: '15px', borderRadius: '10px', marginBottom: '20px', 
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            animation: myStall.bill_status === 'PENDING' ? 'none' : 'pulse 2s infinite'
        }}>
            <div>
                <h3 style={{margin:0}}>
                    {myStall.bill_status === 'PENDING' ? '⏳ กำลังตรวจสอบการชำระเงิน' : `📢 คุณมียอดค้างชำระ: ${myStall.bill_total.toLocaleString()} บาท`}
                </h3>
                <p style={{margin:0, fontSize:'0.9rem'}}>แผง {myStall.code} - ค่าเช่า+น้ำ+ไฟ</p>
            </div>
            <button onClick={() => handleShowBill(myStall)} style={{
                backgroundColor: myStall.bill_status === 'PENDING' ? '#f59e0b' : '#ef4444', 
                color:'white', border:'none', padding:'10px 20px', borderRadius:'5px', cursor:'pointer', fontWeight:'bold'
            }}>
                {myStall.bill_status === 'PENDING' ? 'ดูสถานะ' : 'ดูรายละเอียด / จ่ายเงิน'}
            </button>
        </div>
      )}

      <h2 style={{ marginBottom: '20px', borderBottom: '2px solid #eee', paddingBottom: '10px' }}>
        🗺️ แผนที่ตลาด (Market Map)
      </h2>
      
      {/* Grid แสดงแผงค้า */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '15px' }}>
        {stalls.map((stall) => {
            // Logic เลือกสีและข้อความ
            let bgColor = '#10b981'; // ว่าง (เขียว)
            let cursor = 'pointer'; 
            let statusText = `฿${parseInt(stall.monthly_price).toLocaleString()}`;

            if (stall.status === 'OCCUPIED') { 
                bgColor = '#ef4444'; // ไม่ว่าง (แดง)
                cursor = 'not-allowed'; 
                statusText = '🔒 จองแล้ว'; 
            } 
            else if (stall.status === 'PENDING') { 
                bgColor = '#f59e0b'; // รอตรวจ (เหลือง)
                cursor = 'not-allowed'; 
                statusText = '⏳ รอตรวจสอบ'; 
            }
            
            // ถ้าเป็นแผงของฉัน ให้ใส่กรอบทอง
            const isMyStall = user && stall.tenant_id === user.id;
            const borderStyle = isMyStall ? '4px solid #f59e0b' : '2px solid rgba(255,255,255,0.2)';

            return (
              <div key={stall.id} 
                onClick={() => stall.status === 'VACANT' && handleBooking(stall)}
                style={{
                  backgroundColor: bgColor, color: 'white', padding: '15px', borderRadius: '12px',
                  textAlign: 'center', cursor: cursor, boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                  transition: 'transform 0.2s', border: borderStyle,
                  position: 'relative'
                }}
                onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
              >
                {/* ไอคอนมงกุฎสำหรับแผงตัวเอง */}
                {isMyStall && <div style={{position:'absolute', top:'-10px', right:'-10px', background:'white', borderRadius:'50%', width:'25px', height:'25px', boxShadow:'0 2px 4px rgba(0,0,0,0.2)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'14px'}}>👑</div>}

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
      
      {/* คำอธิบายสถานะ */}
      <div style={{ marginTop: '30px', display: 'flex', gap: '20px', justifyContent: 'center', fontSize: '0.9rem', flexWrap: 'wrap', color:'#666' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}><div style={{ width: '12px', height: '12px', background: '#10b981', borderRadius: '50%' }}></div> ว่าง</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}><div style={{ width: '12px', height: '12px', background: '#f59e0b', borderRadius: '50%' }}></div> รอตรวจสอบ</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}><div style={{ width: '12px', height: '12px', background: '#ef4444', borderRadius: '50%' }}></div> ไม่ว่าง</div>
      </div>
    </div>
  );
}

export default MarketMap;