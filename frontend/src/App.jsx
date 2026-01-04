import { useState } from 'react';
import Login from './Login';
import Register from './Register';
import StallTable from './StallTable';
import MarketMap from './MarketMap';
import Navbar from './Navbar';
import './App.css';

function App() {
  const [user, setUser] = useState(null);
  const [page, setPage] = useState('login'); // login, register, dashboard

  // ฟังก์ชัน Logout
  const handleLogout = () => {
    setUser(null);
    setPage('login');
  };

  return (
    <div style={{ backgroundColor: '#f3f4f6', minHeight: '100vh' }}>
      
      {/* Navbar อยู่บนสุดเสมอ */}
      <Navbar user={user} onLogout={handleLogout} />

      <div className="container" style={{ padding: '0 20px 40px 20px', maxWidth: '1200px', margin: '0 auto' }}>
        
        {/* Logic สลับหน้า */}
        {!user ? (
          page === 'login' ? (
            <Login setUser={setUser} switchToRegister={() => setPage('register')} />
          ) : (
            <Register switchToLogin={() => setPage('login')} />
          )
        ) : (
          user.role === 'ADMIN' ? (
            <StallTable />
          ) : (
            <MarketMap user={user} />
          )
        )}
        
      </div>

      <footer style={{ textAlign: 'center', padding: '20px', color: '#999', fontSize: '0.8rem' }}>
        © 2026 Smart Market Project
      </footer>
    </div>
  );
}

export default App;