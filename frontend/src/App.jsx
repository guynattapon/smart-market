import { useState } from 'react';
import axios from 'axios';
import Swal from 'sweetalert2';

function Login({ onLoginSuccess }) {
  const [isRegister, setIsRegister] = useState(false);
  
  // ข้อมูลฟอร์ม
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();

    if (isRegister) {
      // 🟢 สมัครสมาชิก
      axios.post('https://smart-market-h5xu.onrender.com/register', {
        username,
        password,
        full_name: fullName,
        phone_number: phone
      })
      .then(() => {
        Swal.fire('สำเร็จ!', 'บันทึกข้อมูลแล้ว! เข้าสู่ระบบได้เลย', 'success');
        setIsRegister(false);
        setPassword('');
      })
      .catch((err) => {
        Swal.fire('แจ้งเตือน', err.response?.data?.message || 'เกิดข้อผิดพลาด', 'error');
      });

    } else {
      // 🔵 เข้าสู่ระบบ
      axios.post('https://smart-market-h5xu.onrender.com/login', { username, password })
      .then((res) => {
        const { user, token } = res.data;
        Swal.fire({
          icon: 'success',
          title: 'ยินดีต้อนรับ',
          text: `สวัสดีคุณ ${user.full_name}`,
          timer: 1500,
          showConfirmButton: false
        });
        onLoginSuccess(user, token);
      })
      .catch((err) => {
        Swal.fire('เข้าไม่ได้', 'ชื่อผู้ใช้หรือรหัสผ่านผิด', 'error');
      });
    }
  };

  return (
    // 👇 1. กล่องใหญ่สุด (Background) บังคับเต็มจอ + จัดกึ่งกลาง
    <div style={{
      display: 'flex',            // ใช้ Flexbox จัดระเบียบ
      justifyContent: 'center',   // กึ่งกลางแนวนอน
      alignItems: 'center',       // กึ่งกลางแนวตั้ง
      minHeight: '100vh',         // สูงเต็มจอ 100%
      width: '100vw',             // กว้างเต็มจอ 100%
      background: '#f3f4f6',      // สีพื้นหลังเทาอ่อนๆ สบายตา
      position: 'fixed',          // ล็อกตำแหน่งไว้
      top: 0,
      left: 0
    }}>
      
      {/* 👇 2. กล่อง Login (Card) สีขาวตรงกลาง */}
      <div style={{ 
        background: 'white', 
        padding: '40px',             // เพิ่มพื้นที่ว่างด้านในให้ดูไม่อึดอัด
        borderRadius: '20px',        // มุมโค้งมนสวยๆ
        boxShadow: '0 10px 25px rgba(0,0,0,0.1)', // เงานุ่มๆ
        width: '100%', 
        maxWidth: '450px',           // 👈 ขยายความกว้างกล่องให้ใหญ่ขึ้น
        textAlign: 'center' 
      }}>
        
        <h1 style={{ color: isRegister ? '#2563eb' : '#333', marginBottom: '20px', fontSize: '28px' }}>
          {isRegister ? '📝 สมัครสมาชิก' : '🔐 เข้าสู่ระบบ'}
        </h1>
        
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          <input 
            type="text" 
            placeholder="Username (ชื่อผู้ใช้)" 
            value={username} 
            onChange={e => setUsername(e.target.value)} 
            required 
            style={{ 
              padding: '15px',        // ช่องกรอกใหญ่ขึ้น
              borderRadius: '10px', 
              border: '1px solid #ddd', 
              fontSize: '16px',       // ตัวหนังสือใหญ่ขึ้น
              background: '#f9fafb'
            }} 
          />
          
          <input 
            type="password" 
            placeholder="Password (รหัสผ่าน)" 
            value={password} 
            onChange={e => setPassword(e.target.value)} 
            required 
            style={{ 
              padding: '15px', 
              borderRadius: '10px', 
              border: '1px solid #ddd', 
              fontSize: '16px',
              background: '#f9fafb'
            }} 
          />

          {isRegister && (
            <>
              <input type="text" placeholder="ชื่อ-นามสกุลจริง" value={fullName} onChange={e => setFullName(e.target.value)} required style={{ padding: '15px', borderRadius: '10px', border: '1px solid #ddd', fontSize: '16px', background: '#f9fafb' }} />
              <input type="text" placeholder="เบอร์โทรศัพท์" value={phone} onChange={e => setPhone(e.target.value)} required style={{ padding: '15px', borderRadius: '10px', border: '1px solid #ddd', fontSize: '16px', background: '#f9fafb' }} />
            </>
          )}

          <button type="submit" style={{ 
            padding: '15px', 
            background: isRegister ? '#2563eb' : '#10b981', 
            color: 'white', 
            border: 'none', 
            borderRadius: '10px', 
            cursor: 'pointer', 
            fontWeight: 'bold', 
            fontSize: '18px',         // ปุ่มใหญ่สะใจ
            marginTop: '10px',
            transition: '0.3s'
          }}>
            {isRegister ? 'ยืนยันการสมัคร' : 'เข้าสู่ระบบ'}
          </button>
        </form>

        <div style={{ marginTop: '25px', fontSize: '15px', color: '#666' }}>
          {isRegister ? 'มีบัญชีแล้ว?' : 'ยังไม่มีบัญชี?'}
          <span 
            onClick={() => setIsRegister(!isRegister)} 
            style={{ 
              color: '#3b82f6', 
              cursor: 'pointer', 
              fontWeight: 'bold', 
              marginLeft: '5px', 
              textDecoration: 'underline' 
            }}
          >
            {isRegister ? 'กลับไปหน้า Login' : 'สมัครสมาชิกที่นี่'}
          </span>
        </div>

      </div>
    </div>
  );
}

export default Login;