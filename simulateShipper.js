async function runShipperSimulation() {
  console.log('🛵 Khởi động giả lập Shipper...');
  
  try {
    // 1. Lấy danh sách đơn hàng mới nhất
    const res = await fetch('http://localhost:5000/api/orders');
    const orders = await res.json();
    
    if (orders.length === 0) {
      console.log('❌ Không có đơn hàng nào để giao!');
      return;
    }
    
    // Lấy đơn hàng đầu tiên (mới nhất)
    const orderId = orders[0]._id;
    console.log(`📦 Đang xử lý đơn hàng: ${orderId}`);
    
    const statuses = ['preparing', 'delivering', 'completed'];
    
    for (let i = 0; i < statuses.length; i++) {
      // Đợi 5 giây giữa mỗi lần chuyển trạng thái
      await new Promise(resolve => setTimeout(resolve, 5000));
      
      const newStatus = statuses[i];
      console.log(`🔄 Đang cập nhật trạng thái thành: ${newStatus}...`);
      
      await fetch(`http://localhost:5000/api/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      
      console.log(`✅ Đã cập nhật thành: ${newStatus}`);
    }
    
    console.log('🎉 Giao hàng hoàn tất!');
  } catch (err) {
    console.error('Lỗi giả lập:', err.message);
  }
}

runShipperSimulation();
