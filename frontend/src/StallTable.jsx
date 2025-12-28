import { useState, useEffect } from 'react';
import axios from 'axios';

function StallTable() {
  const [stalls, setStalls] = useState([]);
  const [loading, setLoading] = useState(true);

  // ดึงข้อมูลแผงค้าทั้งหมดตอนเปิดหน้า
  useEffect(() => {
    axios.get('https://smart-market-h5xu.onrender.com/stalls')
      .then(res => {
        setStalls(res.data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  if (loading) return <p>⏳ กำลังโหลดรายการแผงค้า...</p>;

  return (
    <div className="card" style={{ marginTop: '20px', padding: '20px' }}>
      <h3>📋 รายชื่อแผงค้าทั้งหมด ({stalls.length} แผง)</h3>
      
      <div style={{ overflowX: 'auto' }}> {/* กันตารางทะลุจอในมือถือ */}
        <table className="custom-table">
          <thead>
            <tr>
              <th>รหัสแผง</th>
              <th>โซน</th>
              <th>สถานะ</th>
              <th>ราคา/เดือน</th>
            </tr>
          </thead>
          <tbody>
            {stalls.map((stall) => (
              <tr key={stall.id}>
                <td><strong>{stall.code}</strong></td>
                <td>{stall.zone_id === 1 ? 'Zone A (อาหาร)' : 'Zone B (เสื้อผ้า)'}</td>
                <td>
                  {/* สร้างป้ายสถานะสวยๆ */}
                  <span style={{
                    padding: '5px 10px',
                    borderRadius: '15px',
                    fontSize: '12px',
                    fontWeight: 'bold',
                    backgroundColor: stall.status === 'VACANT' ? '#d4edda' : '#f8d7da',
                    color: stall.status === 'VACANT' ? '#155724' : '#721c24'
                  }}>
                    {stall.status === 'VACANT' ? 'ว่าง' : 'ไม่ว่าง'}
                  </span>
                </td>
                <td>฿{parseInt(stall.monthly_price).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default StallTable;