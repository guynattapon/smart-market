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

    // เลือก URL ตามสถานะ (สมัครสมาชิก หรือ ล็อกอิน)
    const url = isRegister 
      ? 'https://smart-market-h5xu.onrender.com/register'
      : 'https://smart-market-h5xu.onrender.com/login';
    
    const payload = isRegister 
      ? { username, password, full_name: fullName, phone_number: phone }
      : { username, password };

    axios.post(url, payload)
      .then((res) => {
        // ✅ กรณีสำเร็จ
        if (isRegister) {
            Swal.fire('สำเร็จ!', 'สมัครสมาชิกแล้ว กรุณาเข้าสู่ระบบ', 'success');
            setIsRegister(false);
            setPassword('');
        } else {
            const { user, token } = res.data;
            Swal.fire({
                icon: 'success',
                title: 'ยินดีต้อนรับ',
                text: `สวัสดีคุณ ${user.full_name}`,
                timer: 1500,
                showConfirmButton: false
            });
            onLoginSuccess(user, token);
        }
      })
      .catch((err) => {
        // ❌ กรณี Error (โค้ดส่วนนี้จะช่วยบอกความจริง!)
        console.error("Login Error:", err);
        
        let errorMsg = 'เกิดข้อผิดพลาดที่ไม่ทราบสาเหตุ';
        let errorTitle = 'แย่แล้ว!';

        // 1. ถ้า Server ตอบกลับมา (เช่น 401, 500)
        if (err.response) {
            errorMsg = err.response.data.message || JSON.stringify(err.response.data);
            if (err.response.status === 404) errorMsg = "ไม่พบ API นี้ (เช็ค URL หลังบ้าน)";
            if (err.response.status === 500) errorTitle = "Server มีปัญหา (500)";
        } 
        // 2. ถ้าติดต่อ Server ไม่ได้เลย (Network Error)
        else if (err.request) {
            errorMsg = "ติดต่อ Server ไม่ได้ (Network Error) - Server อาจจะยังไม่ตื่น หรือเน็ตหลุด";
        } 
        // 3. Error อื่นๆ
        else {
            errorMsg = err.message;
        }

        Swal.fire({
            icon: 'error',
            title: errorTitle,
            text: errorMsg, // 👈 บรรทัดนี้จะเฉลยว่าทำไมเข้าไม่ได้!
            footer: 'ลองแคปภาพนี้มาถาม Gemini ได้เลยครับ'
        });
      });
  };

  return (
    <div style={{
      display: 'flex', justifyContent: 'center', alignItems: 'center',
      minHeight: '100vh', width: '100vw', background: '#f3f4f6',
      position: 'fixed', top: 0, left: 0
    }}>
      <div style={{ 
        background: 'white', padding: '40px', borderRadius: '20px',
        boxShadow: '0 10px 25px rgba(0,0,0,0.1)', width: '100%', maxWidth: '450px', textAlign: 'center' 
      }}>
        
        <h1 style={{ color: isRegister ? '#2563eb' : '#333', marginBottom: '20px', fontSize: '28px' }}>
          {isRegister ? '📝 สมัครสมาชิก' : '🔐 เข้าสู่ระบบ'}
        </h1>
        
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <input type="text" placeholder="Username" value={username} onChange={e => setUsername(e.target.value)} required 
            style={{ padding: '15px', borderRadius: '10px', border: '1px solid #ddd', fontSize: '16px', background: '#f9fafb'}} />
          
          <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} required 
            style={{ padding: '15px', borderRadius: '10px', border: '1px solid #ddd', fontSize: '16px', background: '#f9fafb'}} />

          {isRegister && (
            <>
              <input type="text" placeholder="ชื่อ-นามสกุลจริง" value={fullName} onChange={e => setFullName(e.target.value)} required style={{ padding: '15px', borderRadius: '10px', border: '1px solid #ddd', fontSize: '16px', background: '#f9fafb'}} />
              <input type="text" placeholder="เบอร์โทรศัพท์" value={phone} onChange={e => setPhone(e.target.value)} required style={{ padding: '15px', borderRadius: '10px', border: '1px solid #ddd', fontSize: '16px', background: '#f9fafb'}} />
            </>
          )}

          <button type="submit" style={{ 
            padding: '15px', background: isRegister ? '#2563eb' : '#10b981', color: 'white', 
            border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: 'bold', fontSize: '18px', marginTop: '10px'
          }}>
            {isRegister ? 'ยืนยันการสมัคร' : 'เข้าสู่ระบบ'}
          </button>
        </form>

        <div style={{ marginTop: '25px', fontSize: '15px', color: '#666' }}>
          {isRegister ? 'มีบัญชีแล้ว?' : 'ยังไม่มีบัญชี?'}
          <span onClick={() => setIsRegister(!isRegister)} style={{ color: '#3b82f6', cursor: 'pointer', fontWeight: 'bold', marginLeft: '5px', textDecoration: 'underline' }}>
            {isRegister ? 'กลับไปหน้า Login' : 'สมัครสมาชิกที่นี่'}
          </span>
        </div>

      </div>
    </div>
  );
}

export default Login;