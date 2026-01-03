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

  // ฟังก์ชันเพิ่มแผง
  const handleAddStall = () => {
    Swal.fire({
      title: '🛠️ เพิ่มแผงค้าใหม่',
      html: `
        <input id="swal-code" class="swal2-input" placeholder="รหัสแผง (เช่น C01)">
        <select id="swal-zone" class="swal2-input">
          <option value="1">🍜 Zone A (อาหาร)</option>
          <option value="2">👕 Zone B (เสื้อผ้า)</option>
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

  // 👇 ฟังก์ชันตรวจสลิป (ตัวเอกของงานนี้)
  const handleCheckSlip = (stall) => {
    Swal.fire({
      title: 'ตรวจสอบการชำระเงิน 💰',
      text: `ผู้โอน: ${stall.tenant_name}`,
      imageUrl: stall.slip_image, // แสดงรูปสลิป
      imageWidth: 400,
      imageAlt: 'Payment Slip',
      showDenyButton: true,
      showCancelButton: true,
      confirmButtonText: '✅ อนุมัติ (Approve)',
      denyButtonText: '❌ ปฏิเสธ (Reject)',
      confirmButtonColor: '#10b981',
      denyButtonColor: '#ef4444',
    }).then((result) => {
      if (result.isConfirmed) {
        axios.put(`https://smart-market-h5xu.onrender.com/stalls/${stall.id}/approve`)
          .then(() => { Swal.fire('อนุมัติแล้ว!', '', 'success'); fetchStalls(); });
      } else if (result.isDenied) {
        axios.put(`https://smart-market-h5xu.onrender.com/stalls/${stall.id}/reject`)
          .then(() => { Swal.fire('ปฏิเสธแล้ว', 'แผงกลับมาว่าง', 'info'); fetchStalls(); });
      }
    });
  };

  // ลบแผง
  const handleDeleteStall = (id, code) => {
    Swal.fire({
      title: `ลบแผง ${code}?`, icon: 'error', showCancelButton: true, confirmButtonText: 'ลบเลย!'
    }).then((result) => {
      if (result.isConfirmed) {
        axios.delete(`https://smart-market-h5xu.onrender.com/stalls/${id}`)
          .then(() => { Swal.fire('ลบแล้ว!', '', 'success'); fetchStalls(); });
      }
    });
  };

  // คืนแผง
  const handleCancelBooking = (id, code) => {
    Swal.fire({
      title: `คืนแผง ${code}?`, icon: 'warning', showCancelButton: true, confirmButtonText: 'คืนแผง'
    }).then((result) => {
      if (result.isConfirmed) {
        axios.put(`https://smart-market-h5xu.onrender.com/stalls/${id}/cancel`)
          .then(() => { Swal.fire('เรียบร้อย', '', 'success'); fetchStalls(); });
      }
    });
  };

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
                <td>{stall.zone_id === 1 ? 'Zone A' : 'Zone B'}</td>
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
                    
                    {/* ปุ่มตรวจสลิป (เฉพาะตอนรอตรวจ) */}
                    {isPending && (
                       <button onClick={() => handleCheckSlip(stall)} className="btn-warning btn-sm">🔍 ตรวจ</button>
                    )}

                    {/* ปุ่มพิมพ์ใบเสร็จ (เฉพาะตอนอนุมัติแล้ว) */}
                    {isOccupied && (
                       <button onClick={() => clickPrint(stall)} className="btn-primary btn-sm">🖨️</button>
                    )}

                    {(isOccupied || isPending) && (
                       <button onClick={() => handleCancelBooking(stall.id, stall.code)} className="btn-danger btn-sm">🔄</button>
                    )}
                    
                    <button onClick={() => handleDeleteStall(stall.id, stall.code)} className="btn-danger btn-sm">🗑️</button>
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