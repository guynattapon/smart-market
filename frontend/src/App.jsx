import { useState } from 'react';
import Login from './Login';
import Dashboard from './Dashboard';
import MarketMap from './MarketMap'; // 👈 นำเข้าไฟล์ใหม่
import './App.css'; 

function App() {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);

  const handleLogin = (loggedInUser, userToken) => {
    setUser(loggedInUser);
    setToken(userToken);
  };

  const handleLogout = () => {
    setUser(null);
    setToken(null);
  };

  // 1. ถ้ายังไม่ Login -> โชว์หน้า Login
  if (!user) {
    return <Login onLoginSuccess={handleLogin} />;
  }

  // 2. ถ้า Login แล้ว -> เช็คว่าเป็นใคร?
  return (
    <>
      {/* 👑 ถ้าเป็น ADMIN -> ให้ดู Dashboard (กราฟยอดขาย) */}
      {user.role === 'ADMIN' ? (
        <div className="container">
           <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <div>
              <h1 style={{ margin: 0 }}>Smart Market 🍎</h1>
              <p style={{ margin: 0, color: '#666' }}>Admin Console</p>
            </div>
            <button className="btn-logout" onClick={handleLogout} style={{ backgroundColor: '#ef4444', color: 'white' }}>
              ออกจากระบบ
            </button>
          </div>
          <Dashboard />
        </div>
      ) : (
        /* 🛒 ถ้าเป็นลูกค้าทั่วไป -> ให้ดู MarketMap (จองแผง) */
        <MarketMap user={user} onLogout={handleLogout} />
      )}
    </>
  );
}

export default App;