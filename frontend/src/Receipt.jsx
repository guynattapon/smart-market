import React from 'react';

// ใช้ forwardRef เพื่อให้ Library เข้าถึง component นี้ได้
export const Receipt = React.forwardRef(({ data }, ref) => {
  
  // วันที่ปัจจุบัน
  const today = new Date().toLocaleDateString('th-TH', {
    year: 'numeric', month: 'long', day: 'numeric',
    hour: '2-digit', minute: '2-digit'
  });

  return (
    // ⚠️ สำคัญ: ต้องมี div นี้ครอบไว้เสมอ ห้าม return null
    <div style={{ display: 'none' }}> 
      <div ref={ref} style={{ padding: '40px', fontFamily: 'Prompt', color: '#000', width: '100%', maxWidth: '800px' }}>
        
        {/* ถ้ามีข้อมูล ค่อยโชว์เนื้อหา (ถ้าไม่มี ให้โชว์กล่องเปล่าๆ ไปก่อน) */}
        {data ? (
          <>
            {/* หัวใบเสร็จ */}
            <div style={{ textAlign: 'center', marginBottom: '20px', borderBottom: '2px solid #000', paddingBottom: '20px' }}>
              <h1 style={{ margin: 0, fontSize: '24px' }}>🍎 Smart Market</h1>
              <p style={{ margin: '5px 0' }}>ใบเสร็จรับเงิน / ใบแจ้งหนี้ (Receipt/Invoice)</p>
              <p style={{ fontSize: '12px', color: '#555' }}>เลขที่ผู้เสียภาษี: 0123456789 | สาขาสำนักงานใหญ่</p>
            </div>

            {/* ข้อมูลลูกค้า และ วันที่ */}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
              <div>
                <p><strong>ผู้เช่า (Tenant):</strong> {data.tenant_name}</p>
                <p><strong>รหัสแผง (Stall Code):</strong> <span style={{fontSize:'18px', fontWeight:'bold'}}>{data.code}</span></p>
                <p><strong>โซน (Zone):</strong> {data.zone_id === 1 ? 'Zone A (อาหาร)' : 'Zone B (เสื้อผ้า)'}</p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <p><strong>เลขที่ใบเสร็จ:</strong> INV-{data.id}{Date.now().toString().slice(-4)}</p>
                <p><strong>วันที่ (Date):</strong> {today}</p>
              </div>
            </div>

            {/* ตารางรายการ */}
            <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '20px' }}>
              <thead>
                <tr style={{ background: '#eee', borderBottom: '1px solid #000' }}>
                  <th style={{ padding: '10px', textAlign: 'left' }}>รายการ (Description)</th>
                  <th style={{ padding: '10px', textAlign: 'right' }}>จำนวนเงิน (Amount)</th>
                </tr>
              </thead>
              <tbody>
                <tr style={{ borderBottom: '1px solid #ccc' }}>
                  <td style={{ padding: '15px 10px' }}>ค่าเช่าแผงตลาด (Smart Market Rental Fee)</td>
                  <td style={{ padding: '15px 10px', textAlign: 'right' }}>{parseInt(data.monthly_price).toLocaleString()} บาท</td>
                </tr>
              </tbody>
              <tfoot>
                <tr>
                  <td style={{ padding: '15px 10px', textAlign: 'right', fontWeight: 'bold' }}>รวมทั้งสิ้น (Total)</td>
                  <td style={{ padding: '15px 10px', textAlign: 'right', fontWeight: 'bold', fontSize: '18px' }}>
                    {parseInt(data.monthly_price).toLocaleString()} บาท
                  </td>
                </tr>
              </tfoot>
            </table>

            {/* ส่วนท้ายและลายเซ็น */}
            <div style={{ marginTop: '50px', display: 'flex', justifyContent: 'space-between', textAlign: 'center' }}>
              <div>
                <p>__________________________</p>
                <p>ผู้รับเงิน (Cashier)</p>
                <p>(เจ้าหน้าที่ Smart Market)</p>
              </div>
              <div>
                <p>__________________________</p>
                <p>ผู้จ่ายเงิน (Payer)</p>
                <p>({data.tenant_name})</p>
              </div>
            </div>
            
            <div style={{ marginTop: '30px', textAlign: 'center', fontSize: '12px', color: '#888' }}>
              <p>ขอบคุณที่ใช้บริการ Smart Market ของเรา</p>
            </div>
          </>
        ) : (
          <p>กำลังโหลดข้อมูลใบเสร็จ...</p>
        )}

      </div>
    </div>
  );
});