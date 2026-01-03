import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import Swal from 'sweetalert2';
import { useReactToPrint } from 'react-to-print';
import { Receipt } from './Receipt';

function StallTable() {
  const [stalls, setStalls] = useState([]);
  const [loading, setLoading] = useState(true);

  // Print Logic
  const componentRef = useRef();
  const [printData, setPrintData] = useState(null);
  const [printTrigger, setPrintTrigger] = useState(0);

  const handlePrint = useReactToPrint({
    contentRef: componentRef,
    documentTitle: 'SmartMarket-Receipt',
  });

  useEffect(() => {
    if (printTrigger > 0 && printData) handlePrint();
  }, [printTrigger, printData]);

  const clickPrint = (stall) => {
    setPrintData(stall);
    setPrintTrigger(Date.now());
  };

  const fetchStalls = () => {
    setLoading(true);
    axios.get('https://smart-market-h5xu.onrender.com/stalls')
      .then(res => { setStalls(res.data); setLoading(false); })
      .catch(err => { console.error(err); setLoading(false); });
  };

  useEffect(() => { fetchStalls(); }, []);

  // 👇 ฟังก์ชันแปลงรหัสโซนเป็นชื่อ (ใช้บ่อย)
  const getZoneName = (id) => {
    switch(parseInt(id)) {
      case 1: return '🥩 ของสด (Fresh)';
      case 2: return '🍛 อาหาร (Food)';
      case 3: return '🥫 ของแห้ง (Dry)';
      case 4: return '👕 เบ็ดเตล็ด (Gen)';
      case 5: return '☕ คาเฟ่ (Cafe)';
      default: return '❓ ไม่ระบุ';
    }
  };

  const handleAddStall = () => {
    Swal.fire({
      title: '🛠️ เพิ่มแผงค้าใหม่',
      // 👇 เพิ่มตัวเลือกโซนใหม่ตรงนี้
      html: `
        <input id="swal-code" class="swal2-input" placeholder="รหัสแผง (เช่น A01)">
        <select id="swal-zone" class="swal2-input">
          <option value="1">🥩 โซนของสด (Fresh Market)</option>
          <option value="2">🍛 โซนอาหารปรุงสำเร็จ (Street Food)</option>
          <option value="3">🥫 โซนของแห้ง (Dry Goods)</option>
          <option value="4">👕 โซนเบ็ดเตล็ด/เสื้อผ้า (General)</option>
          <option value="5">☕ โซนคาเฟ่/พิเศษ (Modern)</option>
        </select>
        <input id="swal-price" type="number" class="swal2-input" placeholder="ราคาเช่าต่อเดือน">
      `,
      showCancelButton: true,
      confirmButtonText: 'บันทึก',
      preConfirm: () => {
        return {
          code: document.getElementById('swal-code').value,
          zone_id: document.getElementById('swal-zone').value,
          monthly_price: document.getElementById('swal-price').value
        }
      }
    }).then((result) => {
      if (result.isConfirmed) {
        axios.post('https://smart-market-h5xu.onrender.com/stalls/add', result.value)
          .then(() => { Swal.fire('สำเร็จ', 'เพิ่มแผงค้าเรียบร้อย', 'success'); fetchStalls(); });
      }
    });
  };

  // ... (ฟังก์ชัน handleCheckSlip, handleDelete, handleCancel เหมือนเดิมเป๊ะ ไม่ต้องแก้)
  const handleCheckSlip = (stall) => {
    Swal.fire({
      title: 'ตรวจสอบสลิป 💰', imageUrl: stall.slip_image, imageWidth: 400,
      showDenyButton: true, showCancelButton: true, confirmButtonText: '✅ อนุมัติ', denyButtonText: '❌ ปฏิเสธ'
    }).then((result) => {
      if (result.isConfirmed) axios.put(`https://smart-market-h5xu.onrender.com/stalls/${stall.id}/approve`).then(() => fetchStalls());
      else if (result.isDenied) axios.put(`https://smart-market-h5xu.onrender.com/stalls/${stall.id}/reject`).then(() => fetchStalls());
    });
  };
  const handleDeleteStall = (id) => { Swal.fire({ title: 'ลบแผง?', showCancelButton: true, confirmButtonText: 'ลบ' }).then((r) => r.isConfirmed && axios.delete(`https://smart-market-h5xu.onrender.com/stalls/${id}`).then(fetchStalls)); };
  const handleCancelBooking = (id) => { Swal.fire({ title: 'คืนแผง?', showCancelButton: true, confirmButtonText: 'คืน' }).then((r) => r.isConfirmed && axios.put(`https://smart-market-h5xu.onrender.com/stalls/${id}/cancel`).then(fetchStalls)); };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="card" style={{ marginTop: '30px' }}>
      <div style={{ display: 'none' }}><Receipt ref={componentRef} data={printData} /></div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
        <h2>📋 จัดการแผงค้า</h2>
        <button onClick={handleAddStall} className="btn-success">+ เพิ่มแผงค้า</button>
      </div>
      <div style={{ overflowX: 'auto' }}>
        <table className="custom-table">
          <thead>
            <tr><th>รหัส</th><th>โซน</th><th>สถานะ</th><th>ผู้เช่า</th><th>ราคา</th><th>จัดการ</th></tr>
          </thead>
          <tbody>
            {stalls.map((stall) => {
              const isOccupied = stall.status === 'OCCUPIED';
              const isPending = stall.status === 'PENDING';
              return (
              <tr key={stall.id}>
                <td><strong>{stall.code}</strong></td>
                {/* 👇 เรียกใช้ฟังก์ชันแปลงชื่อโซน */}
                <td>{getZoneName(stall.zone_id)}</td>
                <td>
                  <span style={{
                    padding: '5px 10px', borderRadius: '20px', fontWeight: 'bold', fontSize: '0.85rem',
                    backgroundColor: isOccupied ? '#fee2e2' : (isPending ? '#fef3c7' : '#d1fae5'),
                    color: isOccupied ? '#ef4444' : (isPending ? '#d97706' : '#10b981')
                  }}>
                    {isOccupied ? '🔴 ไม่ว่าง' : (isPending ? '🟡 รอตรวจ' : '🟢 ว่าง')}
                  </span>
                </td>
                <td>{stall.tenant_name || '-'}</td>
                <td>{parseInt(stall.monthly_price).toLocaleString()}</td>
                <td>
                  <div style={{ display: 'flex', gap: '5px' }}>
                    {isPending && <button onClick={() => handleCheckSlip(stall)} className="btn-warning btn-sm">🔍</button>}
                    {isOccupied && <button onClick={() => clickPrint(stall)} className="btn-primary btn-sm">🖨️</button>}
                    {(isOccupied || isPending) && <button onClick={() => handleCancelBooking(stall.id)} className="btn-danger btn-sm">🔄</button>}
                    <button onClick={() => handleDeleteStall(stall.id)} className="btn-danger btn-sm">🗑️</button>
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