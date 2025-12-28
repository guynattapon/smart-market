import { useState } from 'react';
import axios from 'axios';
import Swal from 'sweetalert2';

function Login({ onLoginSuccess }) {
  // สร้างตัวแปรเช็คว่า "กำลังสมัครสมาชิกอยู่ไหม?"
  const [isRegister, setIsRegister] = useState(false);

  // ตัวแปรเก็บข้อมูลฟอร์ม
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();

    if (isRegister) {
      // --- โหมดสมัครสมาชิก ---
      axios.post('https://smart-market-h5xu.onrender.com/register', {
        username,
        password,
        full_name: fullName,
        phone_number: phone
      })
      .then((res) => {
        Swal.fire('สำเร็จ!', 'สมัครสมาชิกเรียบร้อยแล้ว กรุณาเข้าสู่ระบบ', 'success');
        setIsRegister(false); // สลับกลับไปหน้า Login
        setPassword(''); // ล้างรหัสผ่าน
      })
      .catch((err) => {
        Swal.fire('เกิดข้อผิดพลาด', err.response?.data?.message || err.message, 'error');
      });

    } else {
      // --- โหมดเข้าสู่ระบบ (อันเดิม) ---
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
        Swal.fire('เข้าสู่ระบบไม่สำเร็จ', err.response?.data?.message || 'เช็คชื่อ/รหัสผ่านอีกทีนะ', 'error');
      });
    }
  };

  return (
    <div style={{ 
      maxWidth: '400px', margin: '100px auto', padding: '30px', 
      border: '1px solid #ddd', borderRadius: '15px', 
      boxShadow: '0 4px 15px rgba(0,0,0,0.1)', background: 'white', textAlign: 'center' 
    }}>
      <h2 style={{ color: isRegister ? '#2563eb' : '#333' }}>
        {isRegister ? '📝 สมัครสมาชิกใหม่' : '🔐 เข้าสู่ระบบ Smart Market'}
      </h2>
      
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
        
        <input 
          type="text" placeholder="ชื่อผู้ใช้งาน (Username)" value={username} 
          onChange={e => setUsername(e.target.value)} required 
          style={{ padding: '12px', borderRadius: '8px', border: '1px solid #ccc' }}
        />
        
        <input 
          type="password" placeholder="รหัสผ่าน (Password)" value={password} 
          onChange={e => setPassword(e.target.value)} required 
          style={{ padding: '12px', borderRadius: '8px', border: '1px solid #ccc' }}
        />

        {/* 👇 ช่องกรอกเพิ่ม จะโผล่มาเฉพาะตอนกดสมัครสมาชิก */}
        {isRegister && (
          <>
            <input 
              type="text" placeholder="ชื่อ-นามสกุลจริง (เช่น สมศรี มีตังค์)" value={fullName} 
              onChange={e => setFullName(e.target.value)} required 
              style={{ padding: '12px', borderRadius: '8px', border: '1px solid #ccc' }}
            />
            <input 
              type="text" placeholder="เบอร์โทรศัพท์ (ใส่ขีดด้วยจะดีมาก)" value={phone} 
              onChange={e => setPhone(e.target.value)} required 
              style={{ padding: '12px', borderRadius: '8px', border: '1px solid #ccc' }}
            />
          </>
        )}

        <button type="submit" style={{ 
          padding: '12px', background: isRegister ? '#2563eb' : '#10b981', color: 'white', 
          border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '16px', fontWeight: 'bold' 
        }}>
          {isRegister ? 'ยืนยันการสมัคร' : 'เข้าสู่ระบบ'}
        </button>
      </form>

      <hr style={{ margin: '20px 0', border: 'none', borderTop: '1px solid #eee' }} />

      {/* 👇 ปุ่มสลับโหมด */}
      <p style={{ fontSize: '14px', color: '#666' }}>
        {isRegister ? 'มีบัญชีอยู่แล้ว?' : 'ยังไม่มีบัญชีผู้ใช้งาน?'}
        <span 
          onClick={() => setIsRegister(!isRegister)} 
          style={{ 
            color: '#3b82f6', cursor: 'pointer', fontWeight: 'bold', marginLeft: '5px', textDecoration: 'underline' 
          }}
        >
          {isRegister ? 'กลับไปหน้า Login' : 'สมัครสมาชิกที่นี่'}
        </span>
      </p>

    </div>
  );
}

export default Login;