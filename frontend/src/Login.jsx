import { useState } from 'react';
import axios from 'axios';

function Login({ onLoginSuccess }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // ยิงไปขอ Login ที่หลังบ้าน
    axios.post('https://smart-market-h5xu.onrender.com/login', { username, password })
      .then((res) => {
        alert(`ยินดีต้อนรับคุณ ${res.data.user.full_name}`);
        // ส่งข้อมูล user กลับไปบอก App ตัวแม่ว่า "ผ่านแล้วนะ"
        onLoginSuccess(res.data.user, res.data.token);
      })
      .catch((err) => {
        alert('เข้าสู่ระบบไม่สำเร็จ: ' + (err.response?.data?.message || 'Error'));
      });
  };

  return (
    <div style={{ maxWidth: '300px', margin: '100px auto', textAlign: 'center', padding: '20px', border: '1px solid #ccc', borderRadius: '10px' }}>
      <h2>🔐 เข้าสู่ระบบ</h2>
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '10px' }}>
          <input 
            type="text" 
            placeholder="ชื่อผู้ใช้งาน (admin / somchai)" 
            value={username}
            onChange={e => setUsername(e.target.value)}
            style={{ padding: '8px', width: '100%' }}
          />
        </div>
        <div style={{ marginBottom: '10px' }}>
          <input 
            type="password" 
            placeholder="รหัสผ่าน (1234)" 
            value={password}
            onChange={e => setPassword(e.target.value)}
            style={{ padding: '8px', width: '100%' }}
          />
        </div>
        <button type="submit" style={{ padding: '10px 20px', background: '#007bff', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>
          Login
        </button>
      </form>
    </div>
  );
}

export default Login;