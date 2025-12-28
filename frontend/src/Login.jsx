import { useState } from 'react';
import axios from 'axios';
import Swal from 'sweetalert2';

function Login({ onLoginSuccess }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  
  // 👇 1. เพิ่มตัวแปรเช็คสถานะ Loading
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // 👇 2. เริ่มโหลด: เปิดสวิตช์ Loading
    setIsLoading(true);
    
    try {
      // ยิงไปขอ Login ที่หลังบ้าน
      const res = await axios.post('https://smart-market-h5xu.onrender.com/login', { username, password });
      
      // ✅ Login ผ่าน
      Swal.fire({
          title: 'ยินดีต้อนรับ!',
          text: `สวัสดีคุณ ${res.data.user.full_name}`,
          icon: 'success',
          timer: 2000, // ปิดเองใน 2 วิ
          showConfirmButton: false
      }).then(() => {
          onLoginSuccess(res.data.user, res.data.token);
      });

    } catch (err) {
      // ❌ Login ไม่ผ่าน
      Swal.fire({
          title: 'เข้าสู่ระบบไม่สำเร็จ',
          text: err.response?.data?.message || 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง',
          icon: 'error',
          confirmButtonText: 'ลองใหม่',
          confirmButtonColor: '#d33'
      });
    } finally {
      // 👇 3. จบการทำงาน (ไม่ว่าจะผ่านหรือพัง): ปิดสวิตช์ Loading
      setIsLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '300px', margin: '100px auto', textAlign: 'center', padding: '30px', borderRadius: '15px', boxShadow: '0 10px 25px rgba(0,0,0,0.1)', background: 'white' }}>
      <h2 style={{ color: '#2c3e50', marginBottom: '20px' }}>🔐 Smart Market</h2>
      
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '15px' }}>
          <input 
            type="text" 
            placeholder="ชื่อผู้ใช้งาน (admin)" 
            value={username}
            onChange={e => setUsername(e.target.value)}
            // 👇 ถ้าโหลดอยู่ ห้ามพิมพ์แก้
            disabled={isLoading}
            style={{ padding: '12px', width: '100%', boxSizing: 'border-box', borderRadius: '8px', border: '1px solid #ddd', fontSize: '16px' }}
          />
        </div>
        <div style={{ marginBottom: '20px' }}>
          <input 
            type="password" 
            placeholder="รหัสผ่าน (1234)" 
            value={password}
            onChange={e => setPassword(e.target.value)}
            // 👇 ถ้าโหลดอยู่ ห้ามพิมพ์แก้
            disabled={isLoading}
            style={{ padding: '12px', width: '100%', boxSizing: 'border-box', borderRadius: '8px', border: '1px solid #ddd', fontSize: '16px' }}
          />
        </div>

        {/* 👇 ส่วนปุ่มกดที่ฉลาดขึ้น */}
        <button 
          type="submit" 
          disabled={isLoading} // ห้ามกดซ้ำถ้ากำลังหมุน
          style={{ 
            padding: '12px 20px', 
            background: isLoading ? '#ccc' : '#007bff', // เปลี่ยนสีตอนโหลด
            color: 'white', 
            border: 'none', 
            borderRadius: '50px', 
            cursor: isLoading ? 'not-allowed' : 'pointer', 
            width: '100%', 
            fontSize: '16px', 
            fontWeight: 'bold',
            transition: '0.3s'
          }}
        >
          {isLoading ? '⏳ กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบ'}
        </button>
      </form>
    </div>
  );
}

export default Login;