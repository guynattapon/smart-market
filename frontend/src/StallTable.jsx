import { useState, useEffect } from 'react';
import axios from 'axios';
import Swal from 'sweetalert2';

function StallTable() {
  const [stalls, setStalls] = useState([]);
  const [loading, setLoading] = useState(true);

  // ฟังก์ชันโหลดข้อมูล
  const fetchStalls = () => {
    setLoading(true);
    axios.get('https://smart-market-h5xu.onrender.com/stalls')
      .then(res => {
        setStalls(res.data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchStalls();
  }, []);

  // ➕ ฟังก์ชันเพิ่มแผงค้า
  const handleAddStall = () => {
    Swal.fire({
      title: '🛠️ เพิ่มแผงค้าใหม่',
      html: `
        <input id="swal-code" class="swal2-input" placeholder="รหัสแผง (เช่น C01)">
        <select id="swal-zone" class="swal2-input">
          <option value="1">Zone A (อาหาร)</option>
          <option value="2">Zone B (เสื้อผ้า)</option>
        </select>
        <input id="swal-price" type="number" class="swal2-input" placeholder="ราคาเช่าต่อเดือน">
      `,
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: 'บันทึก',
      cancelButtonText: 'ยกเลิก',
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
        if (!code || !monthly_price) {
            Swal.fire('ข้อมูลไม่ครบ', 'กรุณากรอกให้ครบทุกช่อง', 'error');
            return;
        }
        axios.post('https://smart-market-h5xu.onrender.com/stalls/add', { code, zone_id, monthly_price })
          .then(() => {
            Swal.fire('สำเร็จ', 'เพิ่มแผงค้าเรียบร้อย', 'success');
            fetchStalls();
          })
          .catch(err => Swal.fire('Error', err.message, 'error'));
      }
    });
  };

  // 🔄 ฟังก์ชันยกเลิกจอง (เตะคนเช่าออก)
  const handleCancelBooking = (id, code, tenantName) => {
    Swal.fire({
      title: `ยกเลิกจองแผง ${code}?`,
      text: `คุณต้องการยกเลิกสิทธิ์ของ "${tenantName}" ใช่ไหม? แผงจะกลับมาว่างทันที`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#f59e0b',
      confirmButtonText: 'ใช่ ยกเลิกจอง!',
      cancelButtonText: 'ไม่ทำ'
    }).then((result) => {
      if (result.isConfirmed) {
        axios.put(`https://smart-market-h5xu.onrender.com/stalls/${id}/cancel`)
          .then(() => {
            Swal.fire('เรียบร้อย', 'แผงกลับมาว่างแล้ว', 'success');
            fetchStalls();
          })
          .catch(err => Swal.fire('Error', 'ทำรายการไม่สำเร็จ', 'error'));
      }
    });
  };

  // 🗑️ ฟังก์ชันลบแผงทิ้ง
  const handleDeleteStall = (id, code) => {
    Swal.fire({
      title: `ลบแผง ${code} ถาวร?`,
      text: "ข้อมูลจะหายไปเลย กู้คืนไม่ได้นะ!",
      icon: 'error',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      confirmButtonText: 'ลบเลย!',
      cancelButtonText: 'เก็บไว้'
    }).then((result) => {
      if (result.isConfirmed) {
        axios.delete(`https://smart-market-h5xu.onrender.com/stalls/${id}`)
          .then(() => {
            Swal.fire('ลบแล้ว!', 'แผงค้าถูกลบออกจากระบบ', 'success');
            fetchStalls();
          })
          .catch(err => Swal.fire('Error', 'ลบไม่สำเร็จ', 'error'));
      }
    });
  };

  if (loading) return <p>⏳ กำลังโหลดรายการแผงค้า...</p>;

  return (
    <div className="card" style={{ marginTop: '20px', padding: '20px' }}>
      
      {/* ส่วนหัวตาราง */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
        <h3>📋 รายชื่อแผงค้า ({stalls.length})</h3>
        <button onClick={handleAddStall} style={{ backgroundColor: '#10b981', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '5px', cursor: 'pointer' }}>
          + เพิ่มแผงค้า
        </button>
      </div>
      
      {/* ตารางข้อมูล */}
      <div style={{ overflowX: 'auto' }}>
        <table className="custom-table">
          <thead>
            <tr>
              <th>รหัส</th>
              <th>โซน</th>
              <th>สถานะ</th>
              <th>ผู้เช่า</th> {/* 👤 คอลัมน์ใหม่ */}
              <th>ราคา</th>
              <th>จัดการ</th>
            </tr>
          </thead>
          <tbody>
            {stalls.map((stall) => (
              <tr key={stall.id}>
                <td><strong>{stall.code}</strong></td>
                <td>{stall.zone_id === 1 ? 'Zone A' : 'Zone B'}</td>
                <td>
                  <span style={{
                    padding: '5px 10px', borderRadius: '15px', fontSize: '12px', fontWeight: 'bold',
                    backgroundColor: stall.status === 'VACANT' ? '#d4edda' : '#f8d7da',
                    color: stall.status === 'VACANT' ? '#155724' : '#721c24'
                  }}>
                    {stall.status === 'VACANT' ? 'ว่าง' : 'ไม่ว่าง'}
                  </span>
                </td>
                
                {/* 👤 แสดงชื่อคนเช่า (ถ้าไม่มีขีด -) */}
                <td style={{ color: '#2563eb', fontWeight: '500' }}>
                   {stall.tenant_name ? `👤 ${stall.tenant_name}` : '-'}
                </td>
                
                <td>฿{parseInt(stall.monthly_price).toLocaleString()}</td>
                
                <td>
                  <div style={{ display: 'flex', gap: '5px' }}>
                    {/* ปุ่มยกเลิกจอง (โชว์เฉพาะตอนไม่ว่าง) */}
                    {stall.status === 'OCCUPIED' && (
                        <button 
                            onClick={() => handleCancelBooking(stall.id, stall.code, stall.tenant_name)}
                            style={{ backgroundColor: '#f59e0b', color: 'white', padding: '5px 10px', fontSize: '0.8rem', border: 'none', borderRadius: '5px', cursor: 'pointer' }}
                            title="ยกเลิกการจอง (คืนสถานะว่าง)"
                        >
                            🔄 คืนแผง
                        </button>
                    )}
                    
                    {/* ปุ่มลบแผง */}
                    <button 
                        onClick={() => handleDeleteStall(stall.id, stall.code)}
                        style={{ backgroundColor: '#ef4444', color: 'white', padding: '5px 10px', fontSize: '0.8rem', border: 'none', borderRadius: '5px', cursor: 'pointer' }}
                        title="ลบแผงทิ้ง"
                    >
                        🗑️ ลบ
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default StallTable;