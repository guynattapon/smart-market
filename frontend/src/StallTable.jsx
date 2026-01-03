import { useState, useEffect, useRef } from 'react';
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

  const handlePrint = useReactToPrint({
    content: () => componentRef.current,
    documentTitle: 'SmartMarket-Receipt',
  });

  const clickPrint = (stall) => {
    setPrintData(stall);
    setTimeout(() => {
      handlePrint();
    }, 100);
  };

  const fetchStalls = () => {
    setLoading(true);
    axios.get('https://smart-market-h5xu.onrender.com/stalls')
      .then(res => { setStalls(res.data); setLoading(false); })
      .catch(err => { console.error(err); setLoading(false); });
  };

  useEffect(() => { fetchStalls(); }, []);

  const handleAddStall = () => {
    Swal.fire({
      title: '🛠️ เพิ่มแผงค้าใหม่',
      html: `
        <input id="swal-code" class="swal2-input" placeholder="รหัสแผง (เช่น C01)" style="border-radius:10px;">
        <select id="swal-zone" class="swal2-input" style="border-radius:10px;">
          <option value="1">🍜 Zone A (อาหาร)</option>
          <option value="2">👕 Zone B (เสื้อผ้า)</option>
        </select>
        <input id="swal-price" type="number" class="swal2-input" placeholder="ราคาเช่าต่อเดือน" style="border-radius:10px;">
      `,
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: 'บันทึก',
      cancelButtonText: 'ยกเลิก',
      customClass: { confirmButton: 'btn-primary', cancelButton: 'btn-danger' },
      preConfirm: () => {
        return {
          code: document.getElementById('swal-code').value,
          zone_id: document.getElementById('swal-zone').value,
          monthly_price: document.getElementById('swal-price').value
        }
      }
    }).then((result) => {
      if (result.isConfirmed) {
        const { code, zone_id, monthly_price } = result.value;
        if (!code || !monthly_price) { Swal.fire('ข้อมูลไม่ครบ', 'กรุณากรอกให้ครบ', 'error'); return; }
        axios.post('https://smart-market-h5xu.onrender.com/stalls/add', { code, zone_id, monthly_price })
          .then(() => { Swal.fire('สำเร็จ', 'เพิ่มแผงค้าเรียบร้อย', 'success'); fetchStalls(); })
          .catch(err => Swal.fire('Error', err.message, 'error'));
      }
    });
  };

  const handleCancelBooking = (id, code, tenantName) => {
    Swal.fire({
      title: `ยกเลิกจองแผง ${code}?`,
      text: `ยกเลิกสิทธิ์ของ "${tenantName}" แผงจะกลับมาว่างทันที`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'ใช่ คืนแผง!', cancelButtonText: 'ไม่ทำ',
      confirmButtonColor: 'var(--warning)'
    }).then((result) => {
      if (result.isConfirmed) {
        axios.put(`https://smart-market-h5xu.onrender.com/stalls/${id}/cancel`)
          .then(() => { Swal.fire('เรียบร้อย', 'คืนแผงสำเร็จ', 'success'); fetchStalls(); })
      }
    });
  };

  const handleDeleteStall = (id, code) => {
    Swal.fire({
      title: `ลบแผง ${code} ถาวร?`, text: "กู้คืนไม่ได้นะ!", icon: 'error',
      showCancelButton: true, confirmButtonText: 'ลบเลย!', confirmButtonColor: 'var(--danger)'
    }).then((result) => {
      if (result.isConfirmed) {
        axios.delete(`https://smart-market-h5xu.onrender.com/stalls/${id}`)
          .then(() => { Swal.fire('ลบแล้ว!', 'เรียบร้อย', 'success'); fetchStalls(); })
      }
    });
  };

  if (loading) return <div style={{textAlign: 'center', padding:'50px', color: 'var(--secondary)'}}>⏳ กำลังโหลด...</div>;

  return (
    <div className="card" style={{ marginTop: '30px' }}>
      
      {/* ซ่อนใบเสร็จไว้ตรงนี้ */}
      <Receipt ref={componentRef} data={printData} />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px' }}>
        <h2 style={{margin:0}}>📋 รายชื่อแผงค้า ({stalls.length})</h2>
        <button onClick={handleAddStall} className="btn-success">
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
                    
                    {/* ปุ่มพิมพ์ใบเสร็จ */}
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