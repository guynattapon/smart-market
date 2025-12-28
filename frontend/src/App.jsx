import { useState, useEffect } from 'react'
import axios from 'axios'
import Swal from 'sweetalert2' // ✅ อย่าลืม import Swal
import './App.css'
import Login from './Login'
import Dashboard from './Dashboard';
import Profile from './Profile';

function App() {
  const [user, setUser] = useState(null)
  const [stalls, setStalls] = useState([])
  const [myBills, setMyBills] = useState([])
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

  // 👇 แก้ไขฟังก์ชัน Logout ให้มี Popup ถามก่อน
  const handleLogout = () => {
    Swal.fire({
      title: 'ยืนยันการออกจากระบบ?',
      text: "คุณต้องการออกจากระบบใช่หรือไม่",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'ใช่, ออกจากระบบ',
      cancelButtonText: 'ยกเลิก'
    }).then((result) => {
      if (result.isConfirmed) {
        // ถ้ากด "ใช่" ถึงจะล้างข้อมูล
        setUser(null)
        localStorage.removeItem('user_data')
        setStalls([])
        setMyBills([])
        setCurrentPage('home');
        
        Swal.fire({
          title: 'ออกจากระบบแล้ว',
          icon: 'success',
          timer: 1500,
          showConfirmButton: false
        })
      }
    })
  }

  const handlePayBill = (bill) => {
    Swal.fire({
      title: `ยืนยันจ่ายเงิน ${bill.total_amount} บาท?`,
      text: "ระบบจะทำการบันทึกยอดทันที",
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'จ่ายเลย',
      cancelButtonText: 'เดี๋ยวก่อน'
    }).then((result) => {
      if (result.isConfirmed) {
        axios.post('https://smart-market-h5xu.onrender.com/pay-bill', { bill_id: bill.id })
          .then((res) => {
            Swal.fire('สำเร็จ!', res.data.message, 'success')
            fetchData(user)
          })
          .catch((err) => Swal.fire('เกิดข้อผิดพลาด', '', 'error'))
      }
    })
  }

  const handleStallClick = (stall) => {
    if (stall.status === 'VACANT') {
      Swal.fire({
        title: `จองแผง ${stall.code}?`,
        text: `ราคา ${stall.monthly_price} บาท/เดือน`,
        icon: 'info',
        showCancelButton: true,
        confirmButtonText: 'จองเลย!',
        confirmButtonColor: '#10b981'
      }).then((result) => {
        if (result.isConfirmed) {
          axios.post('https://smart-market-h5xu.onrender.com/book', { stall_id: stall.id, user_id: user.id })
            .then(() => { 
                Swal.fire('จองสำเร็จ!', 'ยินดีด้วย คุณได้แผงค้าใหม่แล้ว', 'success'); 
                fetchData(user); 
            })
            .catch(err => Swal.fire('Error', err.message, 'error'))
        }
      })
      return; 
    }

    if (stall.status === 'OCCUPIED' && user.role === 'ADMIN') {
      // ใช้ SweetAlert แบบใส่ข้อมูล (Input) ได้
      Swal.fire({
        title: `📋 ออกบิลแผง ${stall.code}`,
        html:
          '<input id="swal-input1" class="swal2-input" placeholder="เลขมิเตอร์น้ำ">' +
          '<input id="swal-input2" class="swal2-input" placeholder="เลขมิเตอร์ไฟ">',
        focusConfirm: false,
        preConfirm: () => {
          return [
            document.getElementById('swal-input1').value,
            document.getElementById('swal-input2').value
          ]
        }
      }).then((result) => {
        if (result.value) {
            const [water, electric] = result.value;
            if(!water || !electric) return;

            axios.post('https://smart-market-h5xu.onrender.com/create-bill', {
                stall_id: stall.id,
                water_current: water,
                electric_current: electric
            })
            .then((res) => Swal.fire('เรียบร้อย', res.data.message, 'success'))
            .catch((err) => Swal.fire('Error', err.response?.data?.message || err.message, 'error'));
        }
      })
    } else {
      if (stall.status === 'OCCUPIED') {
          Swal.fire('แผงนี้มีเจ้าของแล้ว', '', 'info')
      }
    }
  }

  if (!user) return <Login onLoginSuccess={handleLoginSuccess} />

  if (currentPage === 'profile') {
    return <Profile user={user} onBack={() => setCurrentPage('home')} />;
  }

  return (
    <div className="container"> 
      
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2 style={{ fontSize: '1.2rem' }}>
            <span style={{ fontSize: '1.5rem', marginRight: '5px' }}>🏪</span> 
            {user.full_name} ({user.role})
        </h2>
        
        <div style={{ display: 'flex', gap: '10px' }}>
            <button 
                onClick={() => setCurrentPage('profile')}
                style={{ padding: '8px 15px', borderRadius: '20px', border: '1px solid #ccc', background: 'white', cursor: 'pointer', color: '#333', fontWeight: 'bold' }}
            >
                👤 โปรไฟล์
            </button>

            <button onClick={handleLogout} className="btn-logout" style={{ color: 'white', fontWeight: 'bold' }}>
                ออกจากระบบ
            </button>
        </div>
      </div>

      {user.role === 'ADMIN' && <Dashboard />}

      <h1 style={{ textAlign: 'center', margin: '30px 0 20px', color: '#1a1a1a' }}>🗺️ ผังตลาด Smart Market</h1>
      
      <div className="map-container" style={{ position: 'relative', width: '600px', height: '400px', margin: '0 auto 30px', borderRadius: '15px', background: '#e5e7eb', boxShadow: 'inset 0 0 20px rgba(0,0,0,0.1)' }}>
        {stalls.map((stall) => {
          const coords = stall.map_coordinates || { x: 0, y: 0 }
          let bgColor = stall.status === 'VACANT' ? '#10b981' : '#ef4444' // เขียว / แดง
          
          return (
            <div key={stall.id}
              className="stall-box"
              style={{
                position: 'absolute', left: `${coords.x}px`, top: `${coords.y}px`,
                width: '80px', height: '60px', backgroundColor: bgColor,
                color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center',
                borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', 
                boxShadow: '0 4px 6px rgba(0,0,0,0.2)',
                transition: 'transform 0.2s',
                border: '2px solid white'
              }}
              onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
              onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
              onClick={() => handleStallClick(stall)}
            >
              {stall.code}
            </div>
          )
        })}
      </div>

      {user.role === 'TENANT' && (
        <div style={{ borderTop: '2px solid #e5e7eb', paddingTop: '30px' }}>
          <h2>💸 บิลค่าเช่าของคุณ</h2>
          {myBills.length === 0 ? (
            <div style={{ padding: '20px', textAlign: 'center', background: '#f0fdf4', borderRadius: '10px', color: '#166534' }}>
                🎉 เย้! คุณไม่มีหนี้ค้างชำระ
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '10px', background: 'white', borderRadius: '10px', overflow: 'hidden', boxShadow: '0 2px 5px rgba(0,0,0,0.05)' }}>
              <thead style={{ background: '#f3f4f6' }}>
                <tr>
                  <th style={{ padding: '12px' }}>แผง</th>
                  <th>วันที่</th>
                  <th>ยอดรวม</th>
                  <th>สถานะ</th>
                  <th>ทำรายการ</th>
                </tr>
              </thead>
              <tbody>
                {myBills.map(bill => (
                  <tr key={bill.id} style={{ borderBottom: '1px solid #eee' }}>
                    <td style={{ padding: '12px', textAlign: 'center' }}>{bill.stall_code}</td>
                    <td style={{ textAlign: 'center' }}>{new Date(bill.created_at).toLocaleDateString('th-TH')}</td>
                    <td style={{ textAlign: 'center', fontWeight: 'bold', color: '#ef4444' }}>฿{bill.total_amount}</td>
                    <td style={{ textAlign: 'center' }}>
                      <span style={{ 
                        padding: '4px 10px', borderRadius: '20px', color: 'white', fontSize: '0.8rem',
                        background: bill.status === 'PAID' ? '#10b981' : '#f59e0b' 
                      }}>
                        {bill.status === 'PAID' ? 'จ่ายแล้ว' : 'รอชำระ'}
                      </span>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      {bill.status === 'PENDING' && (
                        <button 
                          onClick={() => handlePayBill(bill)}
                          style={{ background: '#3b82f6', color: 'white', border: 'none', padding: '5px 10px', borderRadius: '5px', cursor: 'pointer' }}
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

      {/* 👇 Footer ด้านล่างสุด */}
      <footer style={{ marginTop: '60px', textAlign: 'center', color: '#9ca3af', fontSize: '14px', borderTop: '1px solid #eee', paddingTop: '20px' }}>
        <p>© 2026 Smart Market System by <strong>[Guy_karakate]</strong></p>
        <p>Full Stack Project (React + Node.js + PostgreSQL)</p>
      </footer>

    </div>
  )
}

export default App