import { useEffect, useState } from 'react';
import axios from 'axios';
import Swal from 'sweetalert2';

function MarketMap({ user }) {
  const [stalls, setStalls] = useState([]);

  // ... (ฟังก์ชัน fetchStalls, getZoneDisplayName เหมือนเดิม) ...
  const fetchStalls = () => {
    axios.get('https://smart-market-h5xu.onrender.com/stalls')
      .then(res => setStalls(res.data))
      .catch(err => console.error(err));
  };
  useEffect(() => { fetchStalls(); }, []);
  const getZoneDisplayName = (id) => { /*...โค้ดเดิม...*/ return '📍 โซนทั่วไป'; };

  // ... (ฟังก์ชัน handleBooking เหมือนเดิมเป๊ะ) ...
  const handleBooking = (stall) => { /*...โค้ดเดิม...*/ };


  // 🔥 ฟังก์ชันใหม่: แสดงบิลของฉัน
  const handleShowBill = (myStall) => {
    Swal.fire({
      title: '🧾 บิลค่าเช่าประจำเดือน',
      html: `
        <div style="text-align:left; font-size:1rem; line-height:1.8;">
           <p><strong>แผงค้า:</strong> ${myStall.code} (${getZoneDisplayName(myStall.zone_id)})</p>
           <hr>
           <div style="display:flex; justify-content:space-between;"><span>🏠 ค่าเช่า:</span> <span>${parseInt(myStall.monthly_price).toLocaleString()} ฿</span></div>
           <div style="display:flex; justify-content:space-between;"><span>💧 ค่าน้ำ:</span> <span>${myStall.bill_water.toLocaleString()} ฿</span></div>
           <div style="display:flex; justify-content:space-between;"><span>⚡ ค่าไฟ:</span> <span>${myStall.bill_electric.toLocaleString()} ฿</span></div>
           <hr>
           <div style="display:flex; justify-content:space-between; font-size:1.2rem; color:#ef4444; font-weight:bold;">
              <span>ยอดรวมทั้งสิ้น:</span> <span>${myStall.bill_total.toLocaleString()} ฿</span>
           </div>
           <p style="font-size:0.8rem; color:#666; margin-top:10px;">*กรุณาโอนเงินเข้าบัญชีตลาด แล้วแจ้งสลิปใน Discord</p>
        </div>
      `,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'รับทราบ / จ่ายแล้ว',
      confirmButtonColor: '#10b981',
      cancelButtonText: 'ปิดหน้าต่าง'
    }).then((result) => {
       /* ถ้าจะทำระบบแนบสลิปจ่ายบิลเพิ่ม สามารถทำตรงนี้ได้ในอนาคต */
       /* ตอนนี้ให้กดรับทราบเพื่อปิดไปก่อน หรือจะเคลียร์บิลก็ได้ถ้าต้องการ */
    });
  };

  // 👇 เช็คว่า User คนนี้มีแผงของตัวเองไหม และมีหนี้ไหม?
  const myStall = user ? stalls.find(s => s.tenant_id === user.id) : null;
  const hasBill = myStall && myStall.bill_total > 0;

  return (
    <div className="card">
      
      {/* 🔥 ส่วนแจ้งเตือนบิล (จะโชว์เฉพาะคนที่มีหนี้) */}
      {hasBill && (
        <div style={{ 
            backgroundColor: '#fee2e2', border: '2px solid #ef4444', color: '#b91c1c', 
            padding: '15px', borderRadius: '10px', marginBottom: '20px', 
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            animation: 'pulse 2s infinite' // เพิ่มลูกเล่นกระพริบเบาๆ
        }}>
            <div>
                <h3 style={{margin:0}}>📢 คุณมียอดค้างชำระ: {myStall.bill_total.toLocaleString()} บาท</h3>
                <p style={{margin:0, fontSize:'0.9rem'}}>แผง {myStall.code} - ค่าเช่า+น้ำ+ไฟ</p>
            </div>
            <button onClick={() => handleShowBill(myStall)} style={{backgroundColor:'#ef4444', color:'white', border:'none', padding:'10px 20px', borderRadius:'5px', cursor:'pointer', fontWeight:'bold'}}>
                ดูรายละเอียด 🧾
            </button>
        </div>
      )}

      <h2 style={{ marginBottom: '20px', borderBottom: '2px solid #eee', paddingBottom: '10px' }}>
        🗺️ แผนที่ตลาด (Market Map)
      </h2>
      
      {/* ... (ส่วนแสดง Grid แผงค้า เหมือนเดิม) ... */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '15px' }}>
        {stalls.map((stall) => {
            // ... (Logic แสดงสีแผง เหมือนเดิม) ...
            let bgColor = '#10b981'; let cursor = 'pointer'; let statusText = `฿${parseInt(stall.monthly_price).toLocaleString()}`;
            if (stall.status === 'OCCUPIED') { bgColor = '#ef4444'; cursor = 'not-allowed'; statusText = '🔒 จองแล้ว'; } 
            else if (stall.status === 'PENDING') { bgColor = '#f59e0b'; cursor = 'not-allowed'; statusText = '⏳ รอตรวจสอบ'; }
            
            // เพิ่ม: ถ้าเป็นแผงของฉัน ให้ใส่กรอบทอง
            const isMyStall = user && stall.tenant_id === user.id;
            const borderStyle = isMyStall ? '4px solid #f59e0b' : '2px solid rgba(255,255,255,0.2)';

            return (
              <div key={stall.id} onClick={() => stall.status === 'VACANT' && handleBooking(stall)}
                style={{
                  backgroundColor: bgColor, color: 'white', padding: '15px', borderRadius: '12px',
                  textAlign: 'center', cursor: cursor, boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                  transition: 'transform 0.2s', border: borderStyle,
                  position: 'relative'
                }}
              >
                {/* ถ้าเป็นแผงฉัน ใส่ดาว ⭐ */}
                {isMyStall && <div style={{position:'absolute', top:'-10px', right:'-10px', background:'white', borderRadius:'50%', width:'25px', height:'25px', boxShadow:'0 2px 4px rgba(0,0,0,0.2)', display:'flex', alignItems:'center', justifyContent:'center'}}>👑</div>}

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