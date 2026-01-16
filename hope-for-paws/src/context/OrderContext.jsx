import { createContext, useContext, useState } from "react";

const OrderContext = createContext();

export const useOrders = () => useContext(OrderContext);

export const OrderProvider = ({ children }) => {
  const [orders, setOrders] = useState([]);

  const placeOrder = (cartItems) => {
    const newOrder = {
      id: "ORD-" + Date.now(),
      products: cartItems,
      status: "Pending",
      createdAt: new Date()
    };
    setOrders(prev => [newOrder, ...prev]);
  };

  const updateOrderStatus = (id, status) => {
    setOrders(prev =>
      prev.map(order =>
        order.id === id ? { ...order, status } : order
      )
    );
  };

  return (
    <OrderContext.Provider value={{ orders, placeOrder, updateOrderStatus }}>
      {children}
    </OrderContext.Provider>
  );
};

