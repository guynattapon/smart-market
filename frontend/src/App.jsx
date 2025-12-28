import { useState, useEffect } from 'react'
import axios from 'axios'
import Swal from 'sweetalert2' 
import './App.css'
import Login from './Login'
import Dashboard from './Dashboard';
import Profile from './Profile'; // ✅ 1. ต้องมีบรรทัดนี้

function App() {
  const [user, setUser] = useState(null)
  const [stalls, setStalls] = useState([])
  const [myBills, setMyBills] = useState([])
  
  // ✅ 2. ตัวแปรสลับหน้า
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
    Swal.fire({
      title: 'ยืนยันการออกจากระบบ?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      confirmButtonText: 'ออกเลย',
      cancelButtonText: 'ยกเลิก'
    }).then((result) => {
      if (result.isConfirmed) {
        setUser(null)
        localStorage.removeItem('user_data')
        setStalls([])
        setMyBills([])
        setCurrentPage('home');
      }
    })
  }

  const handlePayBill = (bill) => {
    Swal.fire({
      title: `ยืนยันจ่ายเงิน ${bill.total_amount} บาท?`,
      showCancelButton: true,
      confirmButtonText: 'แจ้งโอน'
    }).then((result) => {
      if (result.isConfirmed) {
        axios.post('https://smart-market-h5xu.onrender.com/pay-bill', { bill_id: bill.id })
          .then((res) => {
            Swal.fire('สำเร็จ!', res.data.message, 'success')
            fetchData(user)
          })
          .catch((err) => Swal.fire('Error', 'เกิดข้อผิดพลาด', 'error'))
      }
    })
  }

  const handleStallClick = (stall) => {
    if (stall.status === 'VACANT') {
      Swal.fire({
        title: `จองแผง ${stall.code}?`,
        text: `ราคา ${stall.monthly_price} บาท/เดือน`,
        showCancelButton: true,
        confirmButtonText: 'จองเลย'
      }).then((result) => {
        if (result.isConfirmed) {
          axios.post('https://smart-market-h5xu.onrender.com/book', { stall_id: stall.id, user_id: user.id })
            .then(() => { 
                Swal.fire('จองสำเร็จ!', '', 'success'); 
                fetchData(user); 
            })
            .catch(err => Swal.fire('Error', err.message, 'error'))
        }
      })
      return; 
    }

    if (stall.status === 'OCCUPIED' && user.role === 'ADMIN') {
      Swal.fire({
        title: `ออกบิลแผง ${stall.code}`,
        html: '<input id="swal-input1" class="swal2-input" placeholder="มิเตอร์น้ำ">' +
              '<input id="swal-input2" class="swal2-input" placeholder="มิเตอร์ไฟ">',
        focusConfirm: false,
        preConfirm: () => [document.getElementById('swal-input1').value, document.getElementById('swal-input2').value]
      }).then((result) => {
        if (result.value) {
            const [water, electric] = result.value;
            if(!water || !electric) return;
            axios.post('https://smart-market-h5xu.onrender.com/create-bill', { stall_id: stall.id, water_current: water, electric_current: electric })
            .then((res) => Swal.fire('เรียบร้อย', res.data.message, 'success'))
            .catch((err) => Swal.fire('Error', err.message, 'error'));
        }
      })
    } else {
      if (stall.status === 'OCCUPIED') Swal.fire('แผงนี้มีเจ้าของแล้ว', '', 'info')
    }
  }

  if (!user) return <Login onLoginSuccess={handleLoginSuccess} />

  // ✅ 3. ถ้ากดปุ่ม Profile ให้โชว์หน้านั้น
  if (currentPage === 'profile') {
    return <Profile user={user} onBack={() => setCurrentPage('home')} />;
  }

  return (
    <div className="container"> 
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2 style={{ fontSize: '1.2rem' }}>🏪 {user.full_name} ({user.role})</h2>
        <div style={{ display: 'flex', gap: '10px' }}>
            <button onClick={() => setCurrentPage('profile')} style={{ background: 'white', border: '1px solid #ccc', borderRadius: '20px', padding: '5px 15px', cursor: 'pointer' }}>
                👤 ข้อมูลส่วนตัว
            </button>
            <button onClick={handleLogout} className="btn-logout" style={{ color: 'white', borderRadius: '20px', padding: '5px 15px' }}>
                ออกจากระบบ
            </button>
        </div>
      </div>

      {user.role === 'ADMIN' && <Dashboard />}

      <h1 style={{ textAlign: 'center', margin: '30px 0' }}>🗺️ ผังตลาด Smart Market</h1>
      
      <div className="map-container" style={{ position: 'relative', width: '600px', height: '400px', margin: '0 auto 30px', borderRadius: '15px', background: '#e5e7eb', boxShadow: 'inset 0 0 20px rgba(0,0,0,0.1)' }}>
        {stalls.map((stall) => {
          const coords = stall.map_coordinates || { x: 0, y: 0 }
          let bgColor = stall.status === 'VACANT' ? '#10b981' : '#ef4444'
          return (
            <div key={stall.id} className="stall-box"
              style={{
                position: 'absolute', left: `${coords.x}px`, top: `${coords.y}px`,
                width: '80px', height: '60px', backgroundColor: bgColor,
                color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center',
                borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', border: '2px solid white', boxShadow: '0 4px 6px rgba(0,0,0,0.2)'
              }}
              onClick={() => handleStallClick(stall)}
            >
              {stall.code}
            </div>
          )
        })}
      </div>

      {user.role === 'TENANT' && (
        <div style={{ borderTop: '2px solid #eee', paddingTop: '20px' }}>
          <h2>💸 บิลค่าเช่า</h2>
          {myBills.length === 0 ? <p>ไม่มียอดค้างชำระ</p> : (
            <table style={{ width: '100%', background: 'white', borderRadius: '10px' }}>
              <thead><tr><th>แผง</th><th>ยอดรวม</th><th>สถานะ</th><th>ทำรายการ</th></tr></thead>
              <tbody>
                {myBills.map(bill => (
                  <tr key={bill.id} style={{ borderBottom: '1px solid #eee' }}>
                    <td style={{ textAlign: 'center', padding: '10px' }}>{bill.stall_code}</td>
                    <td style={{ textAlign: 'center', color: 'red', fontWeight: 'bold' }}>฿{bill.total_amount}</td>
                    <td style={{ textAlign: 'center' }}>{bill.status === 'PAID' ? '✅ จ่ายแล้ว' : 'รอชำระ'}</td>
                    <td style={{ textAlign: 'center' }}>
                      {bill.status === 'PENDING' && <button onClick={() => handlePayBill(bill)} style={{ background: '#3b82f6', color: 'white', border: 'none', padding: '5px 10px', borderRadius: '5px' }}>แจ้งโอน</button>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Footer */}
      <footer style={{ marginTop: '50px', textAlign: 'center', color: '#888', fontSize: '12px' }}>
        <p>© 2024 Smart Market System by <strong>[ชื่อของคุณใส่ตรงนี้]</strong></p>
      </footer>
    </div>
  )
}

export default App