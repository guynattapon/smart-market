import Swal from 'sweetalert2';

function Navbar({ user, onLogout }) {
  const handleLogoutClick = () => {
    Swal.fire({
      title: 'ต้องการออกจากระบบ?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'ใช่, ออกจากระบบ',
      cancelButtonText: 'ยกเลิก',
      confirmButtonColor: '#ef4444'
    }).then((result) => {
      if (result.isConfirmed) {
        onLogout();
      }
    });
  };

  return (
    <nav style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '15px 30px',
      backgroundColor: '#ffffff',
      boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
      position: 'sticky',
      top: 0,
      zIndex: 1000,
      marginBottom: '30px'
    }}>
      {/* Logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <div style={{ fontSize: '2rem' }}>🏪</div>
        <div>
          <h1 style={{ margin: 0, fontSize: '1.5rem', color: '#333' }}>Smart Market</h1>
          <span style={{ fontSize: '0.8rem', color: '#666' }}>ระบบบริหารจัดการตลาด</span>
        </div>
      </div>

      {/* User & Logout */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
        {user ? (
          <>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontWeight: 'bold', color: '#3b82f6' }}>
                👤 {user.full_name || user.username}
              </div>
              <div style={{ fontSize: '0.8rem', color: '#888', textTransform: 'uppercase' }}>
                สถานะ: {user.role}
              </div>
            </div>
            
            <button 
              onClick={handleLogoutClick}
              style={{
                backgroundColor: '#ef4444',
                color: 'white',
                border: 'none',
                padding: '8px 15px',
                borderRadius: '6px',
                cursor: 'pointer',
                fontWeight: 'bold'
              }}
            >
              🚪 ออกจากระบบ
            </button>
          </>
        ) : (
          <div style={{ color: '#666', fontStyle: 'italic' }}>กรุณาเข้าสู่ระบบ...</div>
        )}
      </div>
    </nav>
  );
}

export default Navbar;