function Profile({ user, onBack }) {
  return (
    <div style={{ maxWidth: '500px', margin: '40px auto', padding: '30px', background: 'white', borderRadius: '20px', boxShadow: '0 10px 30px rgba(0,0,0,0.1)', textAlign: 'center' }}>
      
      {/* 1. รูปโปรไฟล์ (ใช้อักษรตัวแรกของชื่อ) */}
      <div style={{ 
        width: '100px', height: '100px', 
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', 
        borderRadius: '50%', 
        margin: '0 auto 20px', 
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '40px', color: 'white', fontWeight: 'bold'
      }}>
        {user.full_name ? user.full_name.charAt(0).toUpperCase() : 'U'}
      </div>

      {/* 2. ข้อมูลส่วนตัว */}
      <h2 style={{ margin: '10px 0', color: '#2d3748' }}>{user.full_name}</h2>
      <span style={{ 
        padding: '5px 15px', 
        borderRadius: '20px', 
        background: user.role === 'ADMIN' ? '#fef3c7' : '#e0e7ff', 
        color: user.role === 'ADMIN' ? '#d97706' : '#4338ca',
        fontWeight: 'bold', fontSize: '14px'
      }}>
        {user.role === 'ADMIN' ? '👑 ผู้ดูแลระบบ' : '🏪 ผู้เช่าแผงค้า'}
      </span>

      <div style={{ marginTop: '30px', textAlign: 'left' }}>
        <p style={{ color: '#718096', marginBottom: '5px', fontSize: '14px' }}>ชื่อผู้ใช้งาน (Username)</p>
        <div style={{ padding: '10px', background: '#f7fafc', borderRadius: '10px', fontWeight: '500', marginBottom: '15px' }}>
          {user.username}
        </div>

        <p style={{ color: '#718096', marginBottom: '5px', fontSize: '14px' }}>เบอร์โทรศัพท์</p>
        <div style={{ padding: '10px', background: '#f7fafc', borderRadius: '10px', fontWeight: '500' }}>
          {user.phone_number || '-'}
        </div>
      </div>

      {/* 3. ปุ่มย้อนกลับ */}
      <button 
        onClick={onBack}
        style={{ marginTop: '30px', width: '100%', background: 'white', border: '1px solid #cbd5e0', color: '#4a5568' }}
      >
        ⬅️ กลับหน้าหลัก
      </button>

    </div>
  );
}

export default Profile;