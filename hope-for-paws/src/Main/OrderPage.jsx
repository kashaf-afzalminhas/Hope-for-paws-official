
import React, { useState } from 'react';
import { useOrders } from '../context/OrderContext';

const OrderPage = () => {
  const { orders } = useOrders();
  const [filterStatus, setFilterStatus] = useState('All'); // Default: show all orders

  // Filter orders based on selected status
  const filteredOrders =
    filterStatus === 'All'
      ? orders
      : orders.filter(order => order.status === filterStatus);

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-8">
      <h1 className="text-3xl font-semibold text-[#6b493d]">My Orders</h1>

      {/* Status Filter Buttons */}
      <div className="flex gap-4 mb-6">
        {['All', 'Pending', 'Shipped', 'Delivered'].map(status => (
          <button
            key={status}
            onClick={() => setFilterStatus(status)}
            className={`px-4 py-2 rounded border text-sm ${
              filterStatus === status ? 'bg-[#6b493d] text-white' : ''
            }`}
          >
            {status}
          </button>
        ))}
      </div>

      {filteredOrders.length === 0 && (
        <p className="text-gray-500">No orders found for "{filterStatus}" status.</p>
      )}

      {filteredOrders.map(order => (
        <div key={order.id} className="border rounded-lg p-6 space-y-4">

          {/* Header */}
          <div className="flex justify-between items-center">
            <div>
              <p className="font-semibold text-lg">Order ID</p>
              <p className="text-gray-600">{order.id}</p>
            </div>

            <span
              className={`px-4 py-1 rounded-full text-white text-sm
                ${order.status === 'Pending' && 'bg-yellow-500'}
                ${order.status === 'Shipped' && 'bg-blue-500'}
                ${order.status === 'Delivered' && 'bg-green-600'}
              `}
            >
              {order.status}
            </span>
          </div>

          {/* Products */}
          <div className="space-y-4">
            {order.products.map((item, i) => (
              <div key={i} className="flex justify-between border-b pb-3">

                <div className="flex gap-4">
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-16 h-16 object-cover rounded"
                  />

                  <div>
                    <p className="font-medium">{item.name}</p>
                    <p className="text-sm text-gray-600">Seller: {item.seller}</p>
                    <p className="text-sm">Qty: {item.quantity}</p>
                  </div>
                </div>

                <p className="font-medium">
                  ${(item.price * item.quantity).toFixed(2)}
                </p>

              </div>
            ))}
          </div>

        </div>
      ))}
    </div>
  );
};

export default OrderPage;
