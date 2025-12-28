import { useState, useEffect } from 'react';
import axios from 'axios';
import Swal from 'sweetalert2';
import Login from './Login'; // เรียกใช้หน้า Login

function App() {
  const [user, setUser] = useState(null);
  const [stalls, setStalls] = useState([]);

  // ฟังก์ชัน: เมื่อ Login สำเร็จ ให้บันทึกข้อมูล User และโหลดแผง
  const handleLoginSuccess = (userData) => {
    setUser(userData);
    fetchStalls();
  };

  // ฟังก์ชัน: ดึงข้อมูลแผงจาก Server
  const fetchStalls = () => {
    axios.get('https://smart-market-h5xu.onrender.com/stalls')
      .then(res => setStalls(res.data))
      .catch(err => console.error(err));
  };

  // ฟังก์ชัน: จองแผง (แบบง่าย ไม่ต้องกรอกเยอะ)
  const handleBooking = (stall) => {
    Swal.fire({
      title: `ยืนยันจองแผง ${stall.code || 'A0'+stall.id}?`,
      text: "คุณต้องการจองแผงนี้ใช่หรือไม่",
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'จองเลย!',
      confirmButtonColor: '#10b981'
    }).then((result) => {
      if (result.isConfirmed) {
        axios.post('https://smart-market-h5xu.onrender.com/book', {
          stall_id: stall.id,
          user_id: user.id
        }).then(() => {
          Swal.fire('สำเร็จ', 'จองแผงเรียบร้อยแล้ว', 'success');
          fetchStalls(); // โหลดใหม่ให้สถานะเปลี่ยน
        });
      }
    });
  };

  // ฟังก์ชัน: ออกจากระบบ
  const handleLogout = () => {
    setUser(null);
  };

  // 🔒 ถ้ายังไม่ Login -> ให้โชว์หน้า Login ก่อนเสมอ
  if (!user) {
    return <Login onLoginSuccess={handleLoginSuccess} />;
  }

  // 🔓 ถ้า Login แล้ว -> โชว์หน้าจองแผง
  return (
    <div style={{ padding: '20px', textAlign: 'center', fontFamily: 'sans-serif' }}>
      
      {/* ส่วนหัว: แสดงชื่อคนล็อกอิน + ปุ่มออก */}
      <div style={{
        display:'flex', justifyContent:'space-between', alignItems:'center', 
        marginBottom:'30px', padding:'15px', background:'#f3f4f6', borderRadius:'10px'
      }}>
         <h3 style={{margin:0}}>👤 ผู้ใช้งาน: {user.full_name}</h3>
         <button onClick={handleLogout} style={{
           background:'#ef4444', color:'white', border:'none', 
           padding:'8px 15px', borderRadius:'5px', cursor:'pointer', fontWeight:'bold'
         }}>
           ออกจากระบบ
         </button>
      </div>

      <h1 style={{ color: '#2563eb' }}>🗺️ ผังตลาด Smart Market (Basic)</h1>

      {/* ตารางแสดงแผง */}
      <div style={{ 
        display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', 
        gap: '20px', maxWidth:'800px', margin:'0 auto' 
      }}>
        {stalls.map(stall => (
          <div key={stall.id} 
               onClick={() => stall.status === 'AVAILABLE' && handleBooking(stall)}
               style={{
                 height: '120px',
                 display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center',
                 border: '2px solid',
                 borderColor: stall.status === 'AVAILABLE' ? '#34d399' : '#f87171',
                 borderRadius: '15px',
                 background: 'white',
                 cursor: stall.status === 'AVAILABLE' ? 'pointer' : 'not-allowed',
                 boxShadow: '0 4px 6px rgba(0,0,0,0.05)'
               }}>
            <h2 style={{ margin: '0 0 10px 0', color: '#374151' }}>{stall.code || `A0${stall.id}`}</h2>
            <span style={{
              fontSize:'14px', 
              color: stall.status === 'AVAILABLE' ? '#059669' : '#dc2626',
              fontWeight: 'bold'
            }}>
              {stall.status === 'AVAILABLE' ? 'ว่าง ✅' : 'ไม่ว่าง ❌'}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default App;