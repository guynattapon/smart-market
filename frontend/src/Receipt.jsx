import React from 'react';

export const Receipt = React.forwardRef(({ data }, ref) => {
  if (!data) return null;

  const today = new Date().toLocaleDateString('th-TH', {
    year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
  });

  // 👇 ฟังก์ชันแปลงชื่อโซนในใบเสร็จ
  const getZoneName = (id) => {
    switch(parseInt(id)) {
      case 1: return 'โซนของสด (Fresh Market)';
      case 2: return 'โซนอาหารปรุงสำเร็จ (Street Food)';
      case 3: return 'โซนของแห้ง (Dry Goods)';
      case 4: return 'โซนเบ็ดเตล็ด (General/Clothes)';
      case 5: return 'โซนคาเฟ่/พิเศษ (Cafe & Modern)';
      default: return 'โซนทั่วไป';
    }
  };

  return (
    <div style={{ display: 'none' }}>
      <div ref={ref} style={{ padding: '40px', fontFamily: 'Prompt', color: '#000', width: '100%', maxWidth: '800px' }}>
        <div style={{ textAlign: 'center', marginBottom: '20px', borderBottom: '2px solid #000', paddingBottom: '20px' }}>
          <h1 style={{ margin: 0, fontSize: '24px' }}>🍎 Smart Market</h1>
          <p>ใบเสร็จรับเงิน / ใบแจ้งหนี้ (Receipt/Invoice)</p>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
          <div>
            <p><strong>ผู้เช่า:</strong> {data.tenant_name}</p>
            <p><strong>รหัสแผง:</strong> {data.code}</p>
            <p><strong>โซน:</strong> {getZoneName(data.zone_id)}</p> {/* 👈 ใช้ฟังก์ชันตรงนี้ */}
          </div>
          <div style={{ textAlign: 'right' }}>
            <p><strong>วันที่:</strong> {today}</p>
          </div>
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '20px' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #000', background: '#eee' }}>
              <th style={{ textAlign: 'left', padding: '10px' }}>รายการ</th>
              <th style={{ textAlign: 'right', padding: '10px' }}>จำนวนเงิน</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style={{ padding: '10px' }}>ค่าเช่าแผง ({getZoneName(data.zone_id)})</td>
              <td style={{ textAlign: 'right', padding: '10px' }}>{parseInt(data.monthly_price).toLocaleString()} บาท</td>
            </tr>
          </tbody>
          <tfoot>
             <tr style={{ borderTop: '1px solid #000' }}>
                <td style={{ padding: '10px', textAlign: 'right', fontWeight: 'bold' }}>รวมทั้งสิ้น</td>
                <td style={{ padding: '10px', textAlign: 'right', fontWeight: 'bold' }}>{parseInt(data.monthly_price).toLocaleString()} บาท</td>
             </tr>
          </tfoot>
        </table>
        <div style={{ marginTop: '50px', textAlign: 'center', display: 'flex', justifyContent: 'space-between' }}>
          <div><p>_________________</p><p>ผู้รับเงิน</p></div>
          <div><p>_________________</p><p>ผู้จ่ายเงิน</p></div>
        </div>
      </div>
    </div>
  );
});