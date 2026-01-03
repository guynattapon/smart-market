import { useState } from 'react';
import axios from 'axios';
import Swal from 'sweetalert2';

function Login({ onLoginSuccess }) {
  const [isRegister, setIsRegister] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();

    const url = isRegister 
      ? 'https://smart-market-h5xu.onrender.com/register'
      : 'https://smart-market-h5xu.onrender.com/login';
    
    const payload = isRegister 
      ? { username, password, full_name: fullName, phone_number: phone }
      : { username, password };

    axios.post(url, payload)
      .then((res) => {
        if (isRegister) {
            Swal.fire('สำเร็จ!', 'สมัครสมาชิกแล้ว กรุณาเข้าสู่ระบบ', 'success');
            setIsRegister(false);
            setPassword('');
        } else {
            // ✅ นี่คือจุดสำคัญ! ส่งข้อมูลกลับไปให้ App.jsx
            const { user, token } = res.data;
            onLoginSuccess(user, token);
            
            Swal.fire({
                icon: 'success',
                title: 'ยินดีต้อนรับ',
                text: `สวัสดีคุณ ${user.full_name}`,
                timer: 1500,
                showConfirmButton: false
            });
        }
      })
      .catch((err) => {
        console.error("Login Error:", err);
        let errorMsg = err.response?.data?.message || err.message;
        if (err.message === "onLoginSuccess is not a function") {
            errorMsg = "โปรแกรมเมอร์ลืมใส่ฟังก์ชันรับค่าใน App.jsx (แต่ตอนนี้เราแก้แล้ว!)";
        }
        Swal.fire('เกิดข้อผิดพลาด', errorMsg, 'error');
      });
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', width: '100vw', background: '#f3f4f6', position: 'fixed', top: 0, left: 0 }}>
      <div style={{ background: 'white', padding: '40px', borderRadius: '20px', boxShadow: '0 10px 25px rgba(0,0,0,0.1)', width: '100%', maxWidth: '450px', textAlign: 'center' }}>
        <h1 style={{ color: isRegister ? '#2563eb' : '#333', marginBottom: '20px' }}>{isRegister ? '📝 สมัครสมาชิก' : '🔐 เข้าสู่ระบบ'}</h1>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <input type="text" placeholder="Username" value={username} onChange={e => setUsername(e.target.value)} required style={{ padding: '15px', borderRadius: '10px', border: '1px solid #ddd', background: '#f9fafb'}} />
          <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} required style={{ padding: '15px', borderRadius: '10px', border: '1px solid #ddd', background: '#f9fafb'}} />
          {isRegister && <><input type="text" placeholder="ชื่อ-นามสกุล" value={fullName} onChange={e => setFullName(e.target.value)} required style={{ padding: '15px', borderRadius: '10px', border: '1px solid #ddd', background: '#f9fafb'}} /><input type="text" placeholder="เบอร์โทร" value={phone} onChange={e => setPhone(e.target.value)} required style={{ padding: '15px', borderRadius: '10px', border: '1px solid #ddd', background: '#f9fafb'}} /></>}
          <button type="submit" style={{ padding: '15px', background: isRegister ? '#2563eb' : '#10b981', color: 'white', border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: 'bold', fontSize: '18px' }}>{isRegister ? 'ยืนยัน' : 'เข้าสู่ระบบ'}</button>
        </form>
        <div style={{ marginTop: '20px' }}>
            <span onClick={() => setIsRegister(!isRegister)} style={{ color: '#3b82f6', cursor: 'pointer', fontWeight: 'bold', textDecoration: 'underline' }}>{isRegister ? 'กลับไปหน้า Login' : 'สมัครสมาชิกใหม่'}</span>
        </div>
      </div>
    </div>
  );
}
export default Login;