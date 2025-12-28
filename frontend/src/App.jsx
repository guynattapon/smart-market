import { useState, useEffect } from 'react'
import axios from 'axios'
import './App.css'
import Login from './Login'
import Dashboard from './Dashboard';
import Profile from './Profile';

function App() {
  const [user, setUser] = useState(null)
  const [stalls, setStalls] = useState([])
  const [myBills, setMyBills] = useState([])
  
  // 👇 ต้องมีบรรทัดนี้นะครับ! (ตัวแปรสลับหน้า)
  const [currentPage, setCurrentPage] = useState('home');

  useEffect(() => {
    const savedUser = localStorage.getItem('user_data')
    if (savedUser) {
      const parsedUser = JSON.parse(savedUser)
      setUser(parsedUser)
      fetchData(parsedUser)
    }
  }, [])

  const fetchData = (userData) => {
    axios.get('https://smart-market-h5xu.onrender.com/stalls')
      .then((res) => setStalls(res.data))
      .catch((err) => console.error(err))

    if (userData && userData.role === 'TENANT') {
      axios.get(`https://smart-market-h5xu.onrender.com/my-bills/${userData.id}`)
        .then((res) => setMyBills(res.data))
        .catch((err) => console.error(err))
    }
  }

  const handleLoginSuccess = (userData, token) => {
    setUser(userData)
    localStorage.setItem('user_data', JSON.stringify(userData))
    fetchData(userData)
    setCurrentPage('home');
  }

  const handleLogout = () => {
    setUser(null)
    localStorage.removeItem('user_data')
    setStalls([])
    setMyBills([])
    setCurrentPage('home');
  }

  const handlePayBill = (bill) => {
    const confirm = window.confirm(`ยืนยันการจ่ายเงินยอด ${bill.total_amount} บาท?`)
    if (confirm) {
      axios.post('https://smart-market-h5xu.onrender.com/pay-bill', { bill_id: bill.id })
        .then((res) => {
          alert(res.data.message)
          fetchData(user)
        })
        .catch((err) => alert('เกิดข้อผิดพลาด'))
    }
  }

  const handleStallClick = (stall) => {
    if (stall.status === 'VACANT') {
      if (window.confirm(`ยืนยันจองแผง ${stall.code} ในนามคุณ ${user.full_name}?`)) {
        axios.post('https://smart-market-h5xu.onrender.com/book', { stall_id: stall.id, user_id: user.id })
          .then(() => { alert('🎉 จองสำเร็จ!'); fetchData(user); })
          .catch(err => alert('Error: ' + err.message))
      }
      return; 
    }

    if (stall.status === 'OCCUPIED' && user.role === 'ADMIN') {
      const water = prompt(`📋 ออกบิลแผง ${stall.code}\nกรอก "เลขมิเตอร์น้ำ":`);
      if (!water) return;
      const electric = prompt(`กรอก "เลขมิเตอร์ไฟ":`);
      if (!electric) return;

      axios.post('https://smart-market-h5xu.onrender.com/create-bill', {
        stall_id: stall.id,
        water_current: water,
        electric_current: electric
      })
      .then((res) => alert('✅ ' + res.data.message))
      .catch((err) => alert('❌ ' + (err.response?.data?.message || err.message)));
    } else {
      alert(`แผง ${stall.code} ไม่ว่างครับ`)
    }
  }

  if (!user) return <Login onLoginSuccess={handleLoginSuccess} />

  // 👇 ถ้ากดปุ่มแล้ว ให้โชว์หน้า Profile
  if (currentPage === 'profile') {
    return <Profile user={user} onBack={() => setCurrentPage('home')} />;
  }

  return (
    <div className="container"> 
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2>👤 ผู้ใช้งาน: {user.full_name} ({user.role})</h2>
        
        <div style={{ display: 'flex', gap: '10px' }}>
            {/* 👇 ปุ่มพระเอกของเรา ต้องอยู่นี่ครับ */}
            <button 
                onClick={() => setCurrentPage('profile')}
                style={{ padding: '8px 15px', borderRadius: '20px', border: '1px solid #ccc', background: 'white', cursor: 'pointer', color: '#333' }}
            >
                ข้อมูลส่วนตัว
            </button>

            <button onClick={handleLogout} className="btn-logout" style={{ color: 'white' }}>
                ออกจากระบบ
            </button>
        </div>
      </div>

      {user.role === 'ADMIN' && (
         <Dashboard />
      )}

      <h1>🗺️ แผนที่ตลาด (Smart Market)</h1>
      
      <div className="map-container" style={{ position: 'relative', width: '600px', height: '400px', margin: '0 auto 30px', borderRadius: '10px' }}>
        {stalls.map((stall) => {
          const coords = stall.map_coordinates || { x: 0, y: 0 }
          let bgColor = stall.status === 'VACANT' ? 'var(--success-color)' : 'var(--danger-color)'
          
          return (
            <div key={stall.id}
              className="stall-box"
              style={{
                position: 'absolute', left: `${coords.x}px`, top: `${coords.y}px`,
                width: '80px', height: '60px', backgroundColor: bgColor,
                color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center',
                borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold', boxShadow: '2px 2px 5px rgba(0,0,0,0.3)'
              }}
              onClick={() => handleStallClick(stall)}
            >
              {stall.code}
            </div>
          )
        })}
      </div>

      {user.role === 'TENANT' && (
        <div style={{ borderTop: '2px solid #e5e7eb', paddingTop: '20px' }}>
          <h2>💸 บิลค่าเช่าของฉัน</h2>
          {myBills.length === 0 ? (
            <p style={{ color: '#6b7280' }}>ยังไม่มีบิลค้างชำระ (สบายตัว!)</p>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>แผง</th>
                  <th>รอบบิล</th>
                  <th>ค่าน้ำ</th>
                  <th>ค่าไฟ</th>
                  <th>รวมทั้งสิ้น</th>
                  <th>สถานะ</th>
                  <th>จัดการ</th>
                </tr>
              </thead>
              <tbody>
                {myBills.map(bill => (
                  <tr key={bill.id}>
                    <td>{bill.stall_code}</td>
                    <td>{new Date(bill.created_at).toLocaleDateString('th-TH')}</td>
                    <td>{bill.water_total} บ.</td>
                    <td>{bill.electric_total} บ.</td>
                    <td style={{ fontWeight: 'bold', color: 'var(--danger-color)' }}>{bill.total_amount} บ.</td>
                    <td>
                      <span style={{ 
                        padding: '5px 12px', borderRadius: '20px', color: 'white', fontSize: '0.85rem', fontWeight: '500',
                        background: bill.status === 'PAID' ? 'var(--success-color)' : '#f59e0b' 
                      }}>
                        {bill.status === 'PAID' ? 'จ่ายแล้ว' : 'รอชำระ'}
                      </span>
                    </td>
                    <td>
                      {bill.status === 'PENDING' && (
                        <button 
                          onClick={() => handlePayBill(bill)}
                          className="btn-pay"
                          style={{ color: 'white' }}
                        >
                          แจ้งโอน
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  )
}

export default App