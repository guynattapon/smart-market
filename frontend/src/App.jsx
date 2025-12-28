import { useState, useEffect } from 'react';
import axios from 'axios';
import Swal from 'sweetalert2';
// ... (imports อื่นๆ คงเดิม)

function App() {
  const [stalls, setStalls] = useState([]);
  const [user, setUser] = useState(null); // สมมติว่า Login แล้ว
  const [selectedZone, setSelectedZone] = useState('ทั้งหมด'); // ตัวแปรเก็บโซนที่เลือก

  // ดึงข้อมูลแผง
  useEffect(() => {
    fetchStalls();
  }, []);

  const fetchStalls = () => {
    axios.get('https://smart-market-h5xu.onrender.com/stalls')
      .then(res => setStalls(res.data))
      .catch(err => console.error(err));
  };

  // ฟังก์ชันกรองแผงตามโซน
  const filteredStalls = selectedZone === 'ทั้งหมด' 
    ? stalls 
    : stalls.filter(s => s.zone_name === selectedZone);

  // รายชื่อโซนทั้งหมด (ดึงจากข้อมูลที่มี)
  const zones = ['ทั้งหมด', ...new Set(stalls.map(s => s.zone_name))];

  // ฟังก์ชันจองแผง (แบบละเอียด)
  const handleBooking = (stall) => {
    if (!user) return Swal.fire('แจ้งเตือน', 'กรุณาเข้าสู่ระบบก่อนจอง', 'warning');

    Swal.fire({
      title: `จองแผง ${stall.zone_name} (A0${stall.id})`,
      html: `
        <div style="text-align: left; font-size: 14px;">
          <p><b>ราคา:</b> รายวัน ${stall.price_daily}฿ / รายเดือน ${stall.price_monthly}฿</p>
          <hr/>
          <label>ชื่อร้านค้า:</label>
          <input id="shop_name" class="swal2-input" placeholder="เช่น ร้านเจ๊แดง รสเด็ด">
          
          <label>ขายสินค้าประเภท:</label>
          <input id="product_type" class="swal2-input" placeholder="เช่น ข้าวแกง, เสื้อยืด">
          
          <label>เลขบัตรประชาชน (13 หลัก):</label>
          <input id="id_card" class="swal2-input" placeholder="กรอกเลขบัตรเพื่อยืนยันตัวตน">
          
          <label>รูปแบบการเช่า:</label>
          <select id="booking_type" class="swal2-input">
            <option value="DAILY">รายวัน (${stall.price_daily} บาท)</option>
            <option value="MONTHLY">รายเดือน (${stall.price_monthly} บาท)</option>
          </select>
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: 'ยืนยันการจอง',
      confirmButtonColor: '#10b981',
      preConfirm: () => {
        return {
          shop_name: document.getElementById('shop_name').value,
          product_type: document.getElementById('product_type').value,
          id_card: document.getElementById('id_card').value,
          booking_type: document.getElementById('booking_type').value
        };
      }
    }).then((result) => {
      if (result.isConfirmed) {
        const data = result.value;
        if(!data.shop_name || !data.id_card) return Swal.fire('ข้อมูลไม่ครบ', 'กรุณากรอกชื่อร้านและเลขบัตร', 'error');

        // ส่งข้อมูลไป Backend
        axios.post('https://smart-market-h5xu.onrender.com/book', {
          stall_id: stall.id,
          user_id: user.id,
          ...data // ส่งข้อมูลร้านค้า/บัตรปชช ไปด้วย
        }).then(() => {
          Swal.fire('สำเร็จ!', 'จองแผงเรียบร้อยแล้ว', 'success');
          fetchStalls(); // โหลดข้อมูลใหม่
        });
      }
    });
  };

  return (
    <div style={{ padding: '20px' }}>
      <h1>🗺️ ผังตลาด Smart Market</h1>
      
      {/* ปุ่มเลือกโซน */}
      <div style={{ marginBottom: '20px', display: 'flex', gap: '10px', overflowX: 'auto' }}>
        {zones.map(zone => (
          <button 
            key={zone}
            onClick={() => setSelectedZone(zone)}
            style={{
              padding: '10px 20px',
              borderRadius: '20px',
              border: 'none',
              background: selectedZone === zone ? '#2563eb' : '#eee',
              color: selectedZone === zone ? 'white' : 'black',
              cursor: 'pointer',
              whiteSpace: 'nowrap'
            }}
          >
            {zone}
          </button>
        ))}
      </div>

      {/* แสดงแผง */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '15px' }}>
        {filteredStalls.map(stall => (
          <div key={stall.id} 
               onClick={() => stall.status === 'AVAILABLE' && handleBooking(stall)}
               style={{
                 border: '1px solid #ddd', padding: '15px', borderRadius: '10px',
                 background: stall.status === 'AVAILABLE' ? '#d1fae5' : '#fca5a5',
                 cursor: stall.status === 'AVAILABLE' ? 'pointer' : 'not-allowed',
                 textAlign: 'center'
               }}>
            <h3>{stall.code || `แผง ${stall.id}`}</h3>
            <span style={{ fontSize: '12px', background: 'white', padding: '2px 8px', borderRadius: '10px', border: '1px solid #ccc' }}>
              {stall.zone_name}
            </span>
            <p>{stall.status === 'AVAILABLE' ? 'ว่าง' : 'ไม่ว่าง'}</p>
            {stall.status === 'OCCUPIED' && <p style={{fontSize:'12px'}}>ร้าน: {stall.current_shop_name}</p>}
          </div>
        ))}
      </div>
    </div>
  );
}

export default App;