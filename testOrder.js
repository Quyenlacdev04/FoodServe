async function testOrder() {
  try {
    console.log('Sending test order...');
    const orderData = {
      userId: 'test_user',
      restaurantId: 'test_restaurant',
      items: [{ menuItemId: 'test_item', name: 'Test Food', price: 100, quantity: 1 }],
      totalAmount: 100,
      deliveryAddress: 'Test Address',
      contactPhone: '0123456789'
    };

    const postRes = await fetch('http://localhost:5000/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(orderData)
    });
    
    if (!postRes.ok) {
      console.log('POST Error:', await postRes.text());
    } else {
      console.log('POST Success:', await postRes.json());
    }

    console.log('Fetching orders...');
    const getRes = await fetch('http://localhost:5000/api/orders');
    console.log('Orders in DB:', await getRes.json());
  } catch (err) {
    console.error('Error:', err);
  }
}

testOrder();
