import { useState, useEffect, useRef } from 'react'; // 👈 อย่าลืม useEffect, useRef
import axios from 'axios';
import Swal from 'sweetalert2';
import { useReactToPrint } from 'react-to-print';
import { Receipt } from './Receipt';

function StallTable() {
  const [stalls, setStalls] = useState([]);
  const [loading, setLoading] = useState(true);

  // 🖨️ เตรียมตัวแปรสำหรับพิมพ์
  const componentRef = useRef();
  const [printData, setPrintData] = useState(null);
  const [printTrigger, setPrintTrigger] = useState(0); // 👈 ตัวช่วยตัวใหม่: ตัวกระตุ้นการพิมพ์

  // คำสั่งพิมพ์ (เชื่อมกับ Ref)
  const handlePrint = useReactToPrint({
    contentRef: componentRef, // ใช้ contentRef แทน content (สำหรับ v3 ขึ้นไป) หรือ content: () => componentRef.current ก็ได้
    documentTitle: 'SmartMarket-Receipt',
  });

  // 👀 เฝ้าดู: เมื่อ "ตัวกระตุ้น" เปลี่ยนค่า -> ให้สั่งพิมพ์ทันที
  useEffect(() => {
    if (printTrigger > 0 && printData) {
      handlePrint();
    }
  }, [printTrigger, printData]); // ทำงานเมื่อ trigger เปลี่ยน

  // ฟังก์ชันเมื่อกดปุ่ม (แค่ส่งข้อมูล + เขย่าตัวกระตุ้น)
  const clickPrint = (stall) => {
    setPrintData(stall);       // 1. ใส่ข้อมูล
    setPrintTrigger(Date.now()); // 2. เขย่าตัวกระตุ้น (เปลี่ยนค่าเพื่อให้ useEffect ทำงาน)
  };

  const fetchStalls = () => {
    setLoading(true);
    axios.get('https://smart-market-h5xu.onrender.com/stalls')
      .then(res => { setStalls(res.data); setLoading(false); })
      .catch(err => { console.error(err); setLoading(false); });
  };

  useEffect(() => { fetchStalls(); }, []);

  // ... (ฟังก์ชัน Add/Cancel/Delete เหมือนเดิม ไม่ต้องแก้) ...
  const handleAddStall = () => { /* ...โค้ดเดิม... */ };
  const handleCancelBooking = (id, code, tenantName) => { /* ...โค้ดเดิม... */ };
  const handleDeleteStall = (id, code) => { /* ...โค้ดเดิม... */ };

  if (loading) return <div style={{textAlign: 'center', padding:'50px', color: 'var(--secondary)'}}>⏳ กำลังโหลด...</div>;

  return (
    <div className="card" style={{ marginTop: '30px' }}>
      
      {/* 🧾 แอบวางใบเสร็จไว้ตรงนี้ (สำคัญ!) */}
      <div style={{ display: 'none' }}>
         <Receipt ref={componentRef} data={printData} />
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px' }}>
        <h2 style={{margin:0}}>📋 รายชื่อแผงค้า ({stalls.length})</h2>
        {/* ... ปุ่มเพิ่มแผง ... */}
        {/* (ถ้าเพื่อนไม่ได้แก้ส่วนนี้ ก็ใช้โค้ดเดิมได้เลย แต่ผมละไว้ให้สั้นลง) */}
        <button onClick={() => Swal.fire('ฟังก์ชันนี้เพื่อนมีอยู่แล้ว')} className="btn-success">
          <span style={{fontSize:'1.2rem'}}>+</span> เพิ่มแผงค้า
        </button>
      </div>
      
      <div style={{ overflowX: 'auto' }}>
        <table className="custom-table">
          <thead>
            <tr><th>รหัส</th><th>โซน</th><th>สถานะ</th><th>ผู้เช่า</th><th>ราคา/เดือน</th><th style={{textAlign:'center'}}>จัดการ</th></tr>
          </thead>
          <tbody>
            {stalls.map((stall) => {
              const isOccupied = stall.status === 'OCCUPIED';
              return (
              <tr key={stall.id}>
                <td><strong style={{fontSize:'1.1rem', color: 'var(--primary)'}}>{stall.code}</strong></td>
                <td>
                    <span style={{display:'flex', alignItems:'center', gap:'5px'}}>
                        {stall.zone_id === 1 ? '🍜 Zone A' : '👕 Zone B'}
                    </span>
                </td>
                <td>
                  <span style={{
                    padding: '6px 12px', borderRadius: '30px', fontSize: '0.85rem', fontWeight: '700',
                    backgroundColor: isOccupied ? '#fef2f2' : '#ecfdf5',
                    color: isOccupied ? 'var(--danger)' : 'var(--success)',
                    border: `1px solid ${isOccupied ? 'var(--danger)' : 'var(--success)'}`
                  }}>
                    {isOccupied ? '🔴 ไม่ว่าง' : '🟢 ว่าง'}
                  </span>
                </td>
                <td style={{ fontWeight: '500', color: isOccupied ? '#1f2937' : 'var(--secondary)' }}>
                   {stall.tenant_name ? `👤 ${stall.tenant_name}` : '-'}
                </td>
                <td style={{fontWeight:'bold', color: '#1f2937'}}>฿{parseInt(stall.monthly_price).toLocaleString()}</td>
                <td>
                  <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                    
                    {/* 👇 ปุ่มพิมพ์ใบเสร็จ (พระเอกของเรา) */}
                    {isOccupied && (
                       <button onClick={() => clickPrint(stall)}
                          className="btn-primary btn-sm" title="พิมพ์ใบเสร็จ" style={{padding:'8px', backgroundColor:'#3b82f6'}}>
                          🖨️
                       </button>
                    )}

                    {isOccupied && (
                        <button onClick={() => handleCancelBooking(stall.id, stall.code, stall.tenant_name)}
                            className="btn-warning btn-sm" title="คืนแผง" style={{padding:'8px'}}>
                            🔄
                        </button>
                    )}
                    <button onClick={() => handleDeleteStall(stall.id, stall.code)}
                        className="btn-danger btn-sm" title="ลบแผง" style={{padding:'8px'}}>
                        🗑️
                    </button>
                  </div>
                </td>
              </tr>
            )})}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default StallTable;