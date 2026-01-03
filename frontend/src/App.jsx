import { useState } from 'react';
import Login from './Login';
import Dashboard from './Dashboard';
import './App.css'; 

function App() {
  // 🧠 ส่วนความจำ: จำว่าใคร Login อยู่
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);

  // ✅ ฟังก์ชัน: เมื่อ Login สำเร็จ ให้ทำอะไร?
  const handleLogin = (loggedInUser, userToken) => {
    console.log("Login Success!", loggedInUser);
    setUser(loggedInUser); // จำข้อมูลคนเข้า
    setToken(userToken);   // จำกุญแจ
  };

  // ❌ ฟังก์ชัน: ออกจากระบบ
  const handleLogout = () => {
    setUser(null);
    setToken(null);
  };

  // 🚦 ตัวคุมทิศทาง
  // ถ้ายังไม่มี User -> โชว์หน้า Login
  if (!user) {
    return <Login onLoginSuccess={handleLogin} />;
  }

  // ถ้ามี User แล้ว -> โชว์หน้า Dashboard (ร้านค้า)
  return (
    <div className="container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
           <h1 style={{ margin: 0 }}>Smart Market 🍎</h1>
           <p style={{ margin: 0, color: '#666' }}>ยินดีต้อนรับ: {user.full_name} ({user.role})</p>
        </div>
        <button className="btn-logout" onClick={handleLogout} style={{ backgroundColor: '#ef4444', color: 'white' }}>
          ออกจากระบบ
        </button>
      </div>

      <Dashboard />
    </div>
  );
}

export default App;