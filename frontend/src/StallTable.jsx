import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import Swal from 'sweetalert2';
import { useReactToPrint } from 'react-to-print';
import { Receipt } from './Receipt';

function StallTable() {
  const [stalls, setStalls] = useState([]);
  const [loading, setLoading] = useState(true);

  // ==========================================
  // 🖨️ ส่วนของการพิมพ์ใบเสร็จ (Print Logic)
  // ==========================================
  const componentRef = useRef();
  const [printData, setPrintData] = useState(null);
  const [printTrigger, setPrintTrigger] = useState(0);

  const handlePrint = useReactToPrint({
    contentRef: componentRef,
    documentTitle: 'SmartMarket-Receipt',
  });

  // เมื่อ printData เปลี่ยน และ printTrigger ทำงาน -> สั่งพิมพ์
  useEffect(() => {
    if (printTrigger > 0 && printData) {
      handlePrint();
    }
  }, [printTrigger, printData]);

  const clickPrint = (stall) => {
    setPrintData(stall);
    setPrintTrigger(Date.now()); // กระตุ้นให้ useEffect ทำงาน
  };

  // ==========================================
  // 📥 ดึงข้อมูลแผงค้า (Fetch Data)
  // ==========================================
  const fetchStalls = () => {
    setLoading(true);
    axios.get('https://smart-market-h5xu.onrender.com/stalls')
      .then(res => {
        setStalls(res.data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchStalls();
  }, []);

  // ฟังก์ชันแปลง ID โซน เป็นชื่อโซน
  const getZoneName = (id) => {
    switch(parseInt(id)) {
      case 1: return '🥩 ของสด (Fresh)';
      case 2: return '🍛 อาหาร (Food)';
      case 3: return '🥫 ของแห้ง (Dry)';
      case 4: return '👕 เบ็ดเตล็ด (Gen)';
      case 5: return '☕ คาเฟ่ (Cafe)';
      default: return '❓ ไม่ระบุ';
    }
  };

  // ==========================================
  // 🛠️ 1. เพิ่มแผงค้าใหม่ (Add Stall)
  // ==========================================
  const handleAddStall = () => {
    Swal.fire({
      title: '🛠️ เพิ่มแผงค้าใหม่',
      html: `
        <input id="swal-code" class="swal2-input" placeholder="รหัสแผง (เช่น A01)">
        <select id="swal-zone" class="swal2-input">
          <option value="1">🥩 โซนของสด (Fresh Market)</option>
          <option value="2">🍛 โซนอาหารปรุงสำเร็จ (Street Food)</option>
          <option value="3">🥫 โซนของแห้ง (Dry Goods)</option>
          <option value="4">👕 โซนเบ็ดเตล็ด/เสื้อผ้า (General)</option>
          <option value="5">☕ โซนคาเฟ่/พิเศษ (Modern)</option>
        </select>
        <input id="swal-price" type="number" class="swal2-input" placeholder="ราคาเช่าต่อเดือน">
      `,
      showCancelButton: true,
      confirmButtonText: 'บันทึก',
      preConfirm: () => {
        return {
          code: document.getElementById('swal-code').value,
          zone_id: document.getElementById('swal-zone').value,
          monthly_price: document.getElementById('swal-price').value
        }
      }
    }).then((result) => {
      if (result.isConfirmed) {
        axios.post('https://smart-market-h5xu.onrender.com/stalls/add', result.value)
          .then(() => {
            Swal.fire('สำเร็จ', 'เพิ่มแผงค้าเรียบร้อย', 'success');
            fetchStalls();
          });
      }
    });
  };

  // ==========================================
  // 🔍 2. ตรวจสอบการจอง (Check Booking)
  // ==========================================
  const handleCheckSlip = (stall) => {
    Swal.fire({
      title: 'ตรวจสอบการจอง 🕵️',
      html: `
        <div style="display: flex; gap: 10px; justify-content: center; flex-wrap: wrap;">
            <div style="text-align:center;">
                <p>💰 สลิปโอนเงิน</p>
                <img src="${stall.slip_image}" style="max-width: 200px; border: 1px solid #ddd; border-radius: 8px;">
            </div>
            <div style="text-align:center;">
                <p>🆔 เอกสาร/บัตร ปชช.</p>
                <img src="${stall.doc_image || 'https://via.placeholder.com/200?text=No+Document'}" style="max-width: 200px; border: 1px solid #ddd; border-radius: 8px;">
            </div>
        </div>
        <p style="margin-top:15px;">ผู้จอง: <b>${stall.tenant_name}</b></p>
      `,
      width: '600px',
      showDenyButton: true,
      showCancelButton: true,
      confirmButtonText: '✅ อนุมัติ (Approve)',
      denyButtonText: '❌ ปฏิเสธ (Reject)',
      confirmButtonColor: '#10b981',
      denyButtonColor: '#ef4444',
    }).then((result) => {
      if (result.isConfirmed) {
        axios.put(`https://smart-market-h5xu.onrender.com/stalls/${stall.id}/approve`)
          .then(() => {
            Swal.fire('อนุมัติแล้ว!', '', 'success');
            fetchStalls();
          });
      } else if (result.isDenied) {
        axios.put(`https://smart-market-h5xu.onrender.com/stalls/${stall.id}/reject`)
          .then(() => {
            Swal.fire('ปฏิเสธแล้ว', '', 'info');
            fetchStalls();
          });
      }
    });
  };

  // ==========================================
  // 💰 3. ตรวจสอบการจ่ายบิล (Check Bill Payment)
  // ==========================================
  const handleCheckBillPayment = (stall) => {
    Swal.fire({
      title: 'ตรวจสอบการจ่ายบิล 💰',
      html: `
        <p>ยอดชำระ: <b>${stall.bill_total.toLocaleString()} บาท</b></p>
        <div style="text-align:center;">
            <img src="${stall.bill_slip_image}" style="max-width: 300px; border: 1px solid #ddd; border-radius: 8px; margin: 10px 0;">
        </div>
        <p>ผู้จ่าย: ${stall.tenant_name}</p>
      `,
      showDenyButton: true,
      showCancelButton: true,
      confirmButtonText: '✅ ยืนยันว่าจ่ายแล้ว (Approve)',
      denyButtonText: '❌ สลิปไม่ผ่าน (Reject)',
      confirmButtonColor: '#10b981',
      denyButtonColor: '#ef4444',
    }).then((result) => {
      if (result.isConfirmed) {
        // อนุมัติ -> เก็บประวัติ -> เคลียร์หนี้
        axios.put(`https://smart-market-h5xu.onrender.com/bill/${stall.id}/approve`)
          .then(() => {
            Swal.fire('เรียบร้อย', 'บันทึกประวัติและเคลียร์หนี้แล้ว', 'success');
            fetchStalls();
          });
      } else if (result.isDenied) {
        // ปฏิเสธ -> ให้ส่งใหม่
        axios.put(`https://smart-market-h5xu.onrender.com/bill/${stall.id}/reject`)
          .then(() => {
            Swal.fire('ปฏิเสธแล้ว', 'แจ้งลูกค้าให้ส่งใหม่', 'info');
            fetchStalls();
          });
      }
    });
  };

  // ==========================================
  // 🧾 4. ส่งบิลแจ้งหนี้ (Send Bill)
  // ==========================================
  const handleSendBill = (stall) => {
    Swal.fire({
      title: `🧾 แจ้งบิลแผง ${stall.code}`,
      html: `
        <div style="text-align:left; font-size:1rem; color:#333;">
            <div style="background:#f3f4f6; padding:10px; border-radius:8px; margin-bottom:15px;">
                <b>🏠 ค่าเช่า (Rent):</b> <span style="float:right; color:#059669; font-weight:bold;">${parseInt(stall.monthly_price).toLocaleString()} ฿</span>
            </div>
            <div style="margin-bottom: 10px;">
                <label>💧 ค่าน้ำ (Water):</label>
                <input id="bill-water" type="number" class="swal2-input" placeholder="0" value="0" style="margin-top:5px; width:100%;">
            </div>
            <div style="margin-bottom: 10px;">
                <label>⚡ ค่าไฟ (Electric):</label>
                <input id="bill-electric" type="number" class="swal2-input" placeholder="0" value="0" style="margin-top:5px; width:100%;">
            </div>
        </div>
      `,
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: '🚀 ส่งบิลแจ้งเตือน',
      confirmButtonColor: '#3b82f6',
      cancelButtonText: 'ยกเลิก',
      preConfirm: () => {
        const water = document.getElementById('bill-water').value;
        const electric = document.getElementById('bill-electric').value;
        if (water === '' || electric === '') { Swal.showValidationMessage('กรุณากรอกตัวเลข'); }
        return { water, electric };
      }
    }).then((result) => {
      if (result.isConfirmed) {
        const { water, electric } = result.value;
        const rent = stall.monthly_price;
        const total = parseInt(rent) + parseInt(water) + parseInt(electric);

        Swal.fire({title: 'กำลังส่งบิล...', didOpen: () => Swal.showLoading()});
        axios.post('https://smart-market-h5xu.onrender.com/notify/bill', {
            stall_code: stall.code,
            tenant_name: stall.tenant_name,
            rent, water, electric, total
        }).then(() => {
            Swal.fire('ส่งบิลแล้ว!', '', 'success');
            fetchStalls();
        });
      }
    });
  };

  // ==========================================
  // 📜 5. ดูประวัติการเงิน (Show History Popup)
  // ==========================================
  const handleShowHistory = () => {
    Swal.fire({ title: 'กำลังโหลดข้อมูล...', didOpen: () => Swal.showLoading() });
    
    axios.get('https://smart-market-h5xu.onrender.com/history')
      .then((res) => {
        const history = res.data;
        
        // ฟังก์ชันสำหรับกดดูรูป (ใส่ไว้ใน window เพื่อให้ HTML string เรียกใช้ได้)
        window.viewSlip = (index) => {
            const item = history[index];
            Swal.fire({
                title: 'หลักฐานการโอนเงิน',
                html: `<img src="${item.slip_image}" style="max-width: 100%; max-height: 400px; border-radius: 8px;">`,
                showCloseButton: true,
                confirmButtonText: 'ปิด'
            });
        };

        let tableHtml = `
          <div style="overflow-x: auto; max-height: 400px;">
            <table style="width:100%; border-collapse: collapse; font-size: 0.9rem;">
              <thead style="position: sticky; top: 0; background: #3b82f6; color: white;">
                <tr>
                  <th style="padding:8px;">วันที่</th>
                  <th style="padding:8px;">แผง</th>
                  <th style="padding:8px;">ผู้จ่าย</th>
                  <th style="padding:8px;">ยอดรวม</th>
                  <th style="padding:8px;">สลิป</th>
                </tr>
              </thead>
              <tbody>
        `;

        if (history.length === 0) {
            tableHtml += `<tr><td colspan="5" style="padding:20px;">ยังไม่มีประวัติการชำระเงิน</td></tr>`;
        } else {
            history.forEach((item, index) => {
                const date = new Date(item.paid_at).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: '2-digit', hour:'2-digit', minute:'2-digit' });
                tableHtml += `
                  <tr style="border-bottom: 1px solid #eee;">
                    <td style="padding:8px;">${date}</td>
                    <td style="padding:8px; font-weight:bold;">${item.stall_code}</td>
                    <td style="padding:8px;">${item.tenant_name}</td>
                    <td style="padding:8px; color:#10b981; font-weight:bold;">${parseInt(item.amount).toLocaleString()}</td>
                    <td style="padding:8px;">
                      <button onclick="window.viewSlip(${index})" 
                              style="background:#3b82f6; color:white; border:none; padding:5px 10px; border-radius:4px; cursor:pointer;">
                        📷 ดูรูป
                      </button>
                    </td>
                  </tr>
                `;
            });
        }
        tableHtml += `</tbody></table></div>`;

        Swal.fire({
          title: '📜 ประวัติการรับเงิน',
          html: tableHtml,
          width: '800px',
          confirmButtonText: 'ปิดหน้าต่าง'
        });
      })
      .catch(err => Swal.fire('Error', err.message, 'error'));
  };

  // ลบแผงค้า
  const handleDeleteStall = (id) => {
    Swal.fire({ title: 'ลบแผง?', icon: 'error', showCancelButton: true, confirmButtonText: 'ลบเลย!' })
      .then((result) => {
        if (result.isConfirmed) {
          axios.delete(`https://smart-market-h5xu.onrender.com/stalls/${id}`)
            .then(() => {
              Swal.fire('ลบแล้ว!', '', 'success');
              fetchStalls();
            });
        }
      });
  };

  // คืนแผง (Cancel Booking)
  const handleCancelBooking = (id) => {
    Swal.fire({ title: 'คืนแผง?', icon: 'warning', showCancelButton: true, confirmButtonText: 'คืนแผง' })
      .then((result) => {
        if (result.isConfirmed) {
          axios.put(`https://smart-market-h5xu.onrender.com/stalls/${id}/cancel`)
            .then(() => {
              Swal.fire('เรียบร้อย', '', 'success');
              fetchStalls();
            });
        }
      });
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="card" style={{ marginTop: '30px' }}>
      {/* Component สำหรับพิมพ์ใบเสร็จ (ซ่อนอยู่) */}
      <div style={{ display: 'none' }}><Receipt ref={componentRef} data={printData} /></div>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' }}>
        <h2>📋 จัดการแผงค้า</h2>
        
        <div style={{ display:'flex', gap:'10px' }}>
            <button onClick={handleShowHistory} className="btn-info" style={{backgroundColor:'#6366f1', color:'white', border:'none'}}>
                📜 ประวัติการเงิน
            </button>
            <button onClick={handleAddStall} className="btn-success">+ เพิ่มแผงค้า</button>
        </div>
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table className="custom-table">
          <thead>
            <tr><th>รหัส</th><th>โซน</th><th>สถานะ</th><th>ผู้เช่า</th><th>ราคา</th><th>จัดการ</th></tr>
          </thead>
          <tbody>
            {stalls.map((stall) => {
              const isOccupied = stall.status === 'OCCUPIED';
              const isPending = stall.status === 'PENDING';
              const isBillPending = stall.bill_status === 'PENDING';

              return (
              <tr key={stall.id}>
                <td><strong>{stall.code}</strong></td>
                <td>{getZoneName(stall.zone_id)}</td>
                <td>
                  <span style={{
                    padding: '5px 10px', borderRadius: '20px', fontWeight: 'bold', fontSize: '0.85rem',
                    backgroundColor: isOccupied ? '#fee2e2' : (isPending ? '#fef3c7' : '#d1fae5'),
                    color: isOccupied ? '#ef4444' : (isPending ? '#d97706' : '#10b981')
                  }}>
                    {isOccupied ? '🔴 ไม่ว่าง' : (isPending ? '🟡 รอตรวจจอง' : '🟢 ว่าง')}
                  </span>
                </td>
                <td>{stall.tenant_name || '-'}</td>
                <td>{parseInt(stall.monthly_price).toLocaleString()}</td>
                <td>
                  <div style={{ display: 'flex', gap: '5px' }}>
                    
                    {/* 1. ปุ่มตรวจจองแผง (ขึ้นตอน PENDING) */}
                    {isPending && (
                        <button onClick={() => handleCheckSlip(stall)} className="btn-warning btn-sm">🔍 ตรวจจอง</button>
                    )}

                    {/* 2. ปุ่มแจ้งบิล (ขึ้นตอน OCCUPIED และยังไม่มียอดหนี้) */}
                    {isOccupied && stall.bill_total === 0 && (
                        <button onClick={() => handleSendBill(stall)} className="btn-info btn-sm" title="ส่งบิล">🧾</button>
                    )}

                    {/* 3. ปุ่มตรวจการจ่ายบิล (ขึ้นตอนลูกค้าแนบสลิปมาแล้ว) */}
                    {isBillPending && (
                        <button onClick={() => handleCheckBillPayment(stall)} 
                            className="btn-warning btn-sm" 
                            title="ตรวจรับเงิน"
                            style={{backgroundColor:'#f59e0b', color:'black', border:'none', animation:'pulse 1s infinite'}}>
                            💰 ตรวจรับเงิน
                        </button>
                    )}

                    {/* 4. ปุ่มพิมพ์ใบเสร็จ (ขึ้นตอนจ่ายเงินครบแล้ว) */}
                    {isOccupied && (
                        <button onClick={() => clickPrint(stall)} className="btn-primary btn-sm">🖨️</button>
                    )}
                    
                    {/* 5. ปุ่มคืนแผง/ลบแผง */}
                    {(isOccupied || isPending) && (
                        <button onClick={() => handleCancelBooking(stall.id)} className="btn-danger btn-sm">🔄</button>
                    )}
                    <button onClick={() => handleDeleteStall(stall.id)} className="btn-danger btn-sm">🗑️</button>

                  </div>
                </td>
              </tr>
            )})}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default StallTable;  