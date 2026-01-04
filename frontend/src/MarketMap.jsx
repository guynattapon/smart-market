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

  // 🎨 ตั้งค่าโซน: จับคู่ชื่อไทย (ที่เพื่อนส่งมา) เข้ากับ สีของแผนผัง (A,B,C,D)
  const ZONES = [
    { 
      id: 1, 
      code: 'Zone A',
      name: '🥩 โซนของสด (Fresh Market)', 
      color: '#fef9c3', headerColor: '#facc15', border: '#eab308', icon: '🟡' 
    },
    { 
      id: 2, 
      code: 'Zone B',
      name: '🍛 โซนอาหารปรุงสำเร็จ (Street Food)', 
      color: '#dcfce7', headerColor: '#4ade80', border: '#16a34a', icon: '🟢' 
    },
    { 
      id: 3, 
      code: 'Zone C',
      name: '🥫 โซนของแห้ง (Dry Goods)', 
      color: '#fee2e2', headerColor: '#f87171', border: '#dc2626', icon: '🔴' 
    },
    { 
      id: 4, 
      code: 'Zone D',
      name: '👕 เบ็ดเตล็ด & ☕ คาเฟ่ (General & Cafe)', 
      color: '#cffafe', headerColor: '#22d3ee', border: '#0891b2', icon: '🔵' 
    }
  ];

  const handleBooking = (stall) => {
    if (!user) { Swal.fire('กรุณา Login', 'ต้องเข้าสู่ระบบก่อนจองนะครับ', 'warning'); return; }
    const price = parseInt(stall.monthly_price);

    Swal.fire({
      title: '📜 ขั้นตอนการจอง',
      html: `<div style="text-align:left">1. เตรียมบัตร ปชช.<br>2. เตรียมสลิปมัดจำ (${price.toLocaleString()} บาท)</div>`,
      icon: 'info',
      showCancelButton: true,
      confirmButtonText: 'เริ่มการจอง >'
    }).then((res) => {
      if (res.isConfirmed) {
        Swal.fire({ title: '1. แนบรูปบัตรประชาชน', input: 'file', confirmButtonText: 'ถัดไป' }).then((doc) => {
          if (doc.value) {
            Swal.fire({ title: '2. แนบสลิปโอนเงิน', input: 'file', confirmButtonText: 'ยืนยัน' }).then((slip) => {
              if (slip.value) {
                const r1 = new FileReader(); r1.readAsDataURL(doc.value);
                r1.onload = (e1) => {
                    const r2 = new FileReader(); r2.readAsDataURL(slip.value);
                    r2.onload = (e2) => {
                        Swal.fire({title: 'กำลังส่งข้อมูล...', didOpen: () => Swal.showLoading()});
                        axios.post('https://smart-market-h5xu.onrender.com/book', {
                            stall_id: stall.id, user_id: user.id, stall_code: stall.code, user_name: user.full_name,
                            doc_image: e1.target.result, image: e2.target.result
                        }).then(() => { Swal.fire('สำเร็จ', 'ส่งเรื่องจองแล้ว รอแอดมินตรวจสอบ', 'success'); fetchStalls(); });
                    }
                }
              }
            });
          }
        });
      }
    });
  };

  const handleShowBill = (myStall) => {
    const isPending = myStall.bill_status === 'PENDING';
    Swal.fire({
      title: isPending ? '⏳ รอตรวจสอบ' : '🧾 บิลค่าเช่า',
      html: `
        <p>ค่าเช่า: ${parseInt(myStall.monthly_price).toLocaleString()} ฿</p>
        <p>ค่าน้ำ: ${myStall.bill_water} ฿</p>
        <p>ค่าไฟ: ${myStall.bill_electric} ฿</p>
        <h3 style="color:red">รวม: ${myStall.bill_total.toLocaleString()} ฿</h3>
      `,
      showConfirmButton: !isPending, confirmButtonText: '💸 แนบสลิปจ่าย', showCancelButton: true
    }).then((res) => {
        if (res.isConfirmed && !isPending) {
            Swal.fire({ title: 'แนบสลิปจ่ายบิล', input: 'file' }).then((fileRes) => {
                if(fileRes.value) {
                    const reader = new FileReader(); reader.readAsDataURL(fileRes.value);
                    reader.onload = (e) => {
                        axios.post('https://smart-market-h5xu.onrender.com/pay/bill', {
                            stall_id: myStall.id, stall_code: myStall.code, image: e.target.result
                        }).then(() => { Swal.fire('สำเร็จ', 'ส่งสลิปแล้ว', 'success'); fetchStalls(); });
                    }
                }
            })
        }
    });
  };

  const myStall = user ? stalls.find(s => s.tenant_id === user.id) : null;
  const hasBill = myStall && myStall.bill_total > 0 && myStall.bill_status !== 'PAID';

  return (
    <div className="card">
      
      {hasBill && (
        <div style={{ backgroundColor: '#fee2e2', border: '2px solid red', padding: '15px', borderRadius: '10px', marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{margin:0, color: '#b91c1c'}}>📢 มียอดค้างชำระ: {myStall.bill_total.toLocaleString()} บาท</h3>
            <button onClick={() => handleShowBill(myStall)} className="btn-primary">จ่ายเงิน</button>
        </div>
      )}

      <h2 style={{ marginBottom: '20px', textAlign:'center' }}>🗺️ แผนผังตลาด (Market Map)</h2>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
        
        {ZONES.map((zone) => {
            // กรองแผงตามโซน
            // Zone A = 1, B = 2, C = 3, D = 4 (รวม 4 และ 5 เข้า D ถ้ามี)
            const zoneStalls = stalls.filter(s => {
                const zId = parseInt(s.zone_id);
                if (zone.id === 4) return zId === 4 || zId === 5; // เอาโซน 5 (Cafe) มารวมกับ D
                return zId === zone.id;
            });

            return (
                <div key={zone.id} style={{ 
                    border: `3px solid ${zone.border}`, 
                    borderRadius: '15px', 
                    overflow: 'hidden',
                    backgroundColor: '#fff',
                    boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                }}>
                    {/* Header สีตามแผนที่ */}
                    <div style={{ 
                        backgroundColor: zone.headerColor, 
                        color: '#fff', 
                        padding: '12px 20px', 
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                        textShadow: '1px 1px 2px rgba(0,0,0,0.2)'
                    }}>
                        <div style={{ display:'flex', flexDirection:'column' }}>
                             <span style={{fontSize:'1.4rem', fontWeight:'bold'}}>{zone.icon} {zone.code}</span>
                             <span style={{fontSize:'0.95rem', opacity:0.95}}>{zone.name}</span>
                        </div>
                        <span style={{fontSize:'0.9rem', background:'rgba(255,255,255,0.25)', padding:'5px 12px', borderRadius:'20px', fontWeight:'bold'}}>
                            {zoneStalls.length} แผง
                        </span>
                    </div>

                    {/* พื้นที่แสดงแผงค้า */}
                    <div style={{ 
                        padding: '20px', 
                        backgroundColor: zone.color, 
                        display: 'grid', 
                        gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))', 
                        gap: '15px',
                        minHeight: '120px'
                    }}>
                        {zoneStalls.length === 0 ? (
                            <div style={{gridColumn: '1/-1', textAlign:'center', color:'#888', padding:'30px', fontStyle:'italic'}}>
                                (ยังไม่มีแผงค้าในโซนนี้)
                            </div>
                        ) : (
                            zoneStalls.map((stall) => {
                                let statusColor = '#10b981'; // ว่าง (เขียว)
                                let statusText = 'ว่าง';
                                
                                if (stall.status === 'OCCUPIED') { statusColor = '#ef4444'; statusText = 'จองแล้ว'; }
                                else if (stall.status === 'PENDING') { statusColor = '#f59e0b'; statusText = 'รอตรวจ'; }

                                const isMyStall = user && stall.tenant_id === user.id;

                                return (
                                    <div key={stall.id} 
                                        onClick={() => stall.status === 'VACANT' && handleBooking(stall)}
                                        style={{
                                            backgroundColor: '#fff',
                                            border: isMyStall ? '3px solid #f59e0b' : `2px solid ${statusColor}`,
                                            borderRadius: '10px',
                                            padding: '10px',
                                            textAlign: 'center',
                                            cursor: stall.status === 'VACANT' ? 'pointer' : 'not-allowed',
                                            boxShadow: '0 2px 5px rgba(0,0,0,0.05)',
                                            transition: 'all 0.2s',
                                            position: 'relative'
                                        }}
                                        onMouseOver={(e) => { if(stall.status === 'VACANT') e.currentTarget.style.transform = 'scale(1.05)'; }}
                                        onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
                                    >
                                        {isMyStall && <div style={{position:'absolute', top:'-8px', right:'-8px', fontSize:'22px', filter:'drop-shadow(0 2px 2px rgba(0,0,0,0.2))'}}>👑</div>}
                                        
                                        <div style={{ fontWeight:'bold', fontSize:'1.2rem', color:'#333' }}>{stall.code}</div>
                                        <div style={{ fontSize:'0.85rem', color:'#666', marginTop:'4px' }}>{parseInt(stall.monthly_price).toLocaleString()}</div>
                                        
                                        <div style={{ 
                                            marginTop:'8px', fontSize:'0.75rem', color:'white', fontWeight:'bold',
                                            backgroundColor: statusColor, padding:'3px 8px', borderRadius:'12px', display:'inline-block'
                                        }}>
                                            {statusText}
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>
            );
        })}
      </div>
    </div>
  );
}

export default MarketMap;