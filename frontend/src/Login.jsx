import { useState } from 'react';
import axios from 'axios';
import Swal from 'sweetalert2' // อย่าลืมลง npm install sweetalert2 ก่อนนะ

function Login({ onLoginSuccess }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // ยิงไปขอ Login ที่หลังบ้าน
    axios.post('https://smart-market-h5xu.onrender.com/login', { username, password })
      .then((res) => {
        // ✅ Login ผ่าน: เด้ง Popup เขียว
        Swal.fire({
            title: 'ยินดีต้อนรับ!',
            text: `สวัสดีคุณ ${res.data.user.full_name}`,
            icon: 'success',
            confirmButtonText: 'เข้าสู่ตลาด',
            confirmButtonColor: '#3085d6'
        }).then((result) => {
            if (result.isConfirmed) {
                onLoginSuccess(res.data.user, res.data.token);
            }
        });
      })
      .catch((err) => {
        // ❌ Login ไม่ผ่าน: เด้ง Popup แดง
        Swal.fire({
            title: 'เข้าสู่ระบบไม่สำเร็จ',
            text: err.response?.data?.message || 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง',
            icon: 'error',
            confirmButtonText: 'ตกลง',
            confirmButtonColor: '#d33'
        });
      });
  };

  return (
    <div style={{ maxWidth: '300px', margin: '100px auto', textAlign: 'center', padding: '20px', border: '1px solid #ccc', borderRadius: '10px', boxShadow: '0 4px 8px rgba(0,0,0,0.1)', background: 'white' }}>
      <h2>🔐 เข้าสู่ระบบ</h2>
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '10px' }}>
          <input 
            type="text" 
            placeholder="ชื่อผู้ใช้งาน (admin / somchai)" 
            value={username}
            onChange={e => setUsername(e.target.value)}
            style={{ padding: '10px', width: '100%', boxSizing: 'border-box', borderRadius: '5px', border: '1px solid #ddd' }}
          />
        </div>
        <div style={{ marginBottom: '10px' }}>
          <input 
            type="password" 
            placeholder="รหัสผ่าน (1234)" 
            value={password}
            onChange={e => setPassword(e.target.value)}
            style={{ padding: '10px', width: '100%', boxSizing: 'border-box', borderRadius: '5px', border: '1px solid #ddd' }}
          />
        </div>
        <button type="submit" style={{ padding: '10px 20px', background: '#007bff', color: 'white', border: 'none', borderRadius: '50px', cursor: 'pointer', width: '100%', fontSize: '16px', fontWeight: 'bold' }}>
          Login
        </button>
      </form>
    </div>
  );
}

export default Login;