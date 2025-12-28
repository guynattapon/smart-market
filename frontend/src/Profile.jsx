import Swal from 'sweetalert2';

function Profile({ user, onBack }) {
  // ฟังก์ชันจำลองการแก้ไขข้อมูล (เผื่ออนาคตอยากทำเพิ่ม)
  const handleEdit = () => {
    Swal.fire('เร็วๆ นี้', 'ระบบแก้ไขข้อมูลจะมาในเวอร์ชันถัดไปครับ!', 'info');
  };

  return (
    <div style={{ maxWidth: '600px', margin: '40px auto', padding: '0 20px' }}>
      <div className="card" style={{ padding: '40px', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
        
        {/* พื้นหลังตกแต่งด้านบน */}
        <div style={{ 
          position: 'absolute', top: 0, left: 0, right: 0, height: '120px', 
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' 
        }}></div>

        {/* รูปโปรไฟล์ (ใช้อักษรตัวแรกของชื่อ) */}
        <div style={{ 
          width: '120px', height: '120px', 
          background: 'white', 
          borderRadius: '50%', 
          margin: '40px auto 20px', 
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '50px', color: '#667eea', fontWeight: 'bold',
          border: '5px solid white',
          boxShadow: '0 4px 10px rgba(0,0,0,0.1)',
          position: 'relative', zIndex: 1
        }}>
          {user.full_name ? user.full_name.charAt(0).toUpperCase() : 'U'}
        </div>

        {/* ข้อมูลชื่อและบทบาท */}
        <h2 style={{ margin: '10px 0', color: '#2d3748', fontSize: '1.8rem' }}>{user.full_name}</h2>
        
        <div style={{ marginBottom: '30px' }}>
          <span style={{ 
            padding: '6px 18px', 
            borderRadius: '20px', 
            background: user.role === 'ADMIN' ? '#fef3c7' : '#e0e7ff', 
            color: user.role === 'ADMIN' ? '#d97706' : '#4338ca',
            fontWeight: 'bold', fontSize: '14px',
            display: 'inline-block',
            boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
          }}>
            {user.role === 'ADMIN' ? '👑 ผู้ดูแลระบบสูงสุด' : '🏪 ผู้เช่าแผงค้า'}
          </span>
        </div>

        {/* กล่องรายละเอียด */}
        <div style={{ textAlign: 'left', background: '#f8fafc', padding: '20px', borderRadius: '15px', marginBottom: '30px' }}>
          <div style={{ marginBottom: '15px', borderBottom: '1px solid #e2e8f0', paddingBottom: '10px' }}>
            <p style={{ color: '#718096', marginBottom: '5px', fontSize: '13px', fontWeight: '600' }}>ชื่อผู้ใช้งาน (USERNAME)</p>
            <div style={{ fontSize: '16px', color: '#2d3748', fontWeight: '500' }}>@{user.username}</div>
          </div>
          
          <div>
            <p style={{ color: '#718096', marginBottom: '5px', fontSize: '13px', fontWeight: '600' }}>เบอร์โทรศัพท์</p>
            <div style={{ fontSize: '16px', color: '#2d3748', fontWeight: '500' }}>📞 {user.phone_number || 'ไม่ได้ระบุ'}</div>
          </div>
        </div>

        {/* ปุ่มกด */}
        <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
          <button 
            onClick={onBack}
            style={{ 
              background: 'white', border: '1px solid #cbd5e0', color: '#4a5568', 
              padding: '10px 25px', borderRadius: '50px' 
            }}
          >
            ⬅️ กลับหน้าหลัก
          </button>
          
          <button 
            onClick={handleEdit}
            style={{ 
              background: '#4a5568', color: 'white', border: 'none', 
              padding: '10px 25px', borderRadius: '50px',
              display: 'flex', alignItems: 'center', gap: '5px'
            }}
          >
            ✏️ แก้ไขข้อมูล
          </button>
        </div>

      </div>
      
      {/* Footer เล็กๆ */}
      <p style={{ textAlign: 'center', color: '#a0aec0', fontSize: '12px', marginTop: '20px' }}>
        Smart Market ID: {user.id} • Registered Member
      </p>
    </div>
  );
}

export default Profile;