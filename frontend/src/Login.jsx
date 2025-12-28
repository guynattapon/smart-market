import { useState } from 'react';
import axios from 'axios';
import Swal from 'sweetalert2';

function Login({ onLoginSuccess }) {
  // ตัวแปรสลับหน้า (False = Login, True = Register)
  const [isRegister, setIsRegister] = useState(false);

  // ข้อมูลฟอร์ม
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();

    if (isRegister) {
      // 🟢 โหมดสมัครสมาชิก -> ยิงไปที่ /register
      axios.post('https://smart-market-h5xu.onrender.com/register', {
        username,
        password,
        full_name: fullName,
        phone_number: phone
      })
      .then(() => {
        Swal.fire('สำเร็จ!', 'บันทึกข้อมูลลงฐานข้อมูลแล้ว! เข้าสู่ระบบได้เลย', 'success');
        setIsRegister(false); // เด้งกลับไปหน้า Login
        setPassword('');      // ล้างรหัสผ่านเพื่อความปลอดภัย
      })
      .catch((err) => {
        Swal.fire('แจ้งเตือน', err.response?.data?.message || 'เกิดข้อผิดพลาด', 'error');
      });

    } else {
      // 🔵 โหมดเข้าสู่ระบบ -> ยิงไปที่ /login
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
    <div style={{ maxWidth: '400px', margin: '100px auto', padding: '30px', border: '1px solid #ddd', borderRadius: '15px', background: 'white', textAlign: 'center', boxShadow: '0 4px 15px rgba(0,0,0,0.1)' }}>
      <h2 style={{ color: isRegister ? '#2563eb' : '#333' }}>
        {isRegister ? '📝 สมัครสมาชิกใหม่' : '🔐 เข้าสู่ระบบ'}
      </h2>
      
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
        <input type="text" placeholder="Username (ตั้งภาษาอังกฤษ)" value={username} onChange={e => setUsername(e.target.value)} required style={{ padding: '12px', borderRadius: '8px', border: '1px solid #ccc' }} />
        
        <input type="password" placeholder="Password (จำให้ได้นะ)" value={password} onChange={e => setPassword(e.target.value)} required style={{ padding: '12px', borderRadius: '8px', border: '1px solid #ccc' }} />

        {isRegister && (
          <>
            <input type="text" placeholder="ชื่อ-นามสกุลจริง" value={fullName} onChange={e => setFullName(e.target.value)} required style={{ padding: '12px', borderRadius: '8px', border: '1px solid #ccc' }} />
            <input type="text" placeholder="เบอร์โทรศัพท์" value={phone} onChange={e => setPhone(e.target.value)} required style={{ padding: '12px', borderRadius: '8px', border: '1px solid #ccc' }} />
          </>
        )}

        <button type="submit" style={{ padding: '12px', background: isRegister ? '#2563eb' : '#10b981', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '16px' }}>
          {isRegister ? 'ยืนยันการสมัคร' : 'เข้าสู่ระบบ'}
        </button>
      </form>

      <div style={{ marginTop: '20px', fontSize: '14px', color: '#666' }}>
        {isRegister ? 'มีบัญชีแล้ว?' : 'ยังไม่มีบัญชี?'}
        <span onClick={() => setIsRegister(!isRegister)} style={{ color: '#3b82f6', cursor: 'pointer', fontWeight: 'bold', marginLeft: '5px', textDecoration: 'underline' }}>
          {isRegister ? 'กลับไปหน้า Login' : 'สมัครสมาชิกที่นี่'}
        </span>
      </div>
    </div>
  );
}

export default Login;