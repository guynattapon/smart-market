import { useState, useEffect } from 'react';
import axios from 'axios';
import Swal from 'sweetalert2';

function StallTable() {
  const [stalls, setStalls] = useState([]);
  const [loading, setLoading] = useState(true);

  // ฟังก์ชันโหลดข้อมูล (ใช้บ่อย เลยแยกออกมา)
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

  // ➕ ฟังก์ชันเพิ่มแผงค้า (เด้ง Popup ให้กรอก)
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
          Swal.fire('กรอกไม่ครบ!', 'กรุณาระบุรหัสแผงและราคา', 'error');
          return;
        }
        // ส่งข้อมูลไป Server
        axios.post('https://smart-market-h5xu.onrender.com/stalls/add', { code, zone_id, monthly_price })
          .then(() => {
            Swal.fire('สำเร็จ', 'เพิ่มแผงค้าเรียบร้อย', 'success');
            fetchStalls(); // โหลดตารางใหม่
          })
          .catch(err => Swal.fire('Error', err.message, 'error'));
      }
    });
  };

  // 🗑️ ฟังก์ชันลบแผงค้า
  const handleDeleteStall = (id, code) => {
    Swal.fire({
      title: `ลบแผง ${code} ไหม?`,
      text: "ลบแล้วกู้คืนไม่ได้นะ!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      confirmButtonText: 'ลบเลย!',
      cancelButtonText: 'เก็บไว้ก่อน'
    }).then((result) => {
      if (result.isConfirmed) {
        axios.delete(`https://smart-market-h5xu.onrender.com/stalls/${id}`)
          .then(() => {
            Swal.fire('ลบแล้ว!', 'แผงค้าถูกลบออกจากระบบ', 'success');
            fetchStalls(); // โหลดตารางใหม่
          })
          .catch(err => Swal.fire('Error', 'ลบไม่สำเร็จ', 'error'));
      }
    });
  };

  if (loading) return <p>⏳ กำลังโหลดรายการแผงค้า...</p>;

  return (
    <div className="card" style={{ marginTop: '20px', padding: '20px' }}>
      
      {/* หัวตาราง + ปุ่มเพิ่ม */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
        <h3>📋 รายชื่อแผงค้าทั้งหมด ({stalls.length} แผง)</h3>
        <button onClick={handleAddStall} style={{ backgroundColor: '#10b981', color: 'white', padding: '10px 20px' }}>
          + เพิ่มแผงค้า
        </button>
      </div>
      
      <div style={{ overflowX: 'auto' }}>
        <table className="custom-table">
          <thead>
            <tr>
              <th>รหัสแผง</th>
              <th>โซน</th>
              <th>สถานะ</th>
              <th>ราคา/เดือน</th>
              <th>จัดการ</th> {/* เพิ่มช่องปุ่มลบ */}
            </tr>
          </thead>
          <tbody>
            {stalls.map((stall) => (
              <tr key={stall.id}>
                <td><strong>{stall.code}</strong></td>
                <td>{stall.zone_id === 1 ? 'Zone A (อาหาร)' : 'Zone B (เสื้อผ้า)'}</td>
                <td>
                  <span style={{
                    padding: '5px 10px', borderRadius: '15px', fontSize: '12px', fontWeight: 'bold',
                    backgroundColor: stall.status === 'VACANT' ? '#d4edda' : '#f8d7da',
                    color: stall.status === 'VACANT' ? '#155724' : '#721c24'
                  }}>
                    {stall.status === 'VACANT' ? 'ว่าง' : 'ไม่ว่าง'}
                  </span>
                </td>
                <td>฿{parseInt(stall.monthly_price).toLocaleString()}</td>
                <td>
                  {/* ปุ่มลบ */}
                  <button 
                    onClick={() => handleDeleteStall(stall.id, stall.code)}
                    style={{ backgroundColor: '#ef4444', color: 'white', padding: '5px 10px', fontSize: '0.8rem' }}
                  >
                    🗑️ ลบ
                  </button>
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