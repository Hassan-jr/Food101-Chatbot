"use client";
import Image from "next/image";
// components/DialogflowChat.js
import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { v4 as uuid } from "uuid";
import Sidenav from "../components/sidenav";

const Home = () => {
  const [foodItems, setFoodItems] = useState([]);
  const [orderItems, setOrderItems] = useState([]);
  const [orderStatus, setOrderStatus] = useState([]);
  const [ordersTable, setOrdersTable] = useState([]);

  //   useEffect(() => {
  //     // Get all food items
  //     const getFoodItems = async () => {
  //       const response = await axios.get("http://localhost:8000/fooditems");
  //       setFoodItems(response.data);
  //     };
  //     // get all order items
  //     const getOrderItems = async () => {
  //         const response = await axios.get("http://localhost:8000/orders_items");
  //         setOrderItems(response.data);
  //       };
  //           // get all order status
  //     const getOrderStatus = async () => {
  //         const response = await axios.get("http://localhost:8000/orders_status");
  //         setOrderStatus(response.data);
  //       };

  //     getFoodItems();
  //     getOrderItems()
  //     getOrderStatus()
  //   }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const foodItemsResponse = await axios.get(
          "http://localhost:8000/fooditems"
        );
        const orderItemsResponse = await axios.get(
          "http://localhost:8000/orders_items"
        );
        const orderStatusResponse = await axios.get(
          "http://localhost:8000/orders_status"
        );

        setFoodItems(foodItemsResponse.data);
        setOrderItems(orderItemsResponse.data);
        setOrderStatus(orderStatusResponse.data);

        // Transform data into the desired format
        const transformedOrdersTable = transformDataToOrdersTable(
          orderItemsResponse.data,
          orderStatusResponse.data,
          foodItemsResponse.data
        );
        setOrdersTable(transformedOrdersTable);
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };

    fetchData();
  }, []);

  // Function to transform data into the desired OrdersTable format
  const transformDataToOrdersTable = (orderItems, orderStatus, foodItems) => {
    const ordersTable = [];

    orderStatus.forEach((status) => {
      const orderTableItem = {
        order_id: status.order_id,
        order_status: status.status,
        order_items: [],
      };

      const orderItemsForOrder = orderItems.filter(
        (item) => item.order_id === status.order_id
      );

      orderItemsForOrder.forEach((orderItem) => {
        const foodItem = foodItems.find(
          (food) => food.item_id === orderItem.item_id
        );

        if (foodItem) {
          const orderTableItemDetail = {
            item_id: foodItem.item_id,
            name: foodItem.name,
            image_url: foodItem.image_url,
            price: foodItem.price,
            quantity: orderItem.quantity,
            total_price: orderItem.total_price,
          };

          orderTableItem.order_items.push(orderTableItemDetail);
        }
      });

      ordersTable.push(orderTableItem);
    });

    return ordersTable;
  };

  console.log("foodItems", foodItems);
  console.log("orderItems", orderItems);
  console.log("orderStatus", orderStatus);
  console.log("ordersTable", ordersTable);

  return (
    <main>
      <section className="bg-gray-50 dark:bg-gray-900">
        {/* side nav */}
        <Sidenav total= {ordersTable.length}/>
        <div className="md:h-screen sm:ml-64 relative">
          <div className="container mx-auto mt-8">
            <h1 className="text-2xl font-bold mb-4">Orders Table</h1>
            <table className="min-w-full bg-white border border-gray-300">
              <thead>
                <tr>
                  <th className=" w-2/12  py-2 px-4 border-b border-r">Order ID</th>

                  <th>
                    <table>
                      <thead>
                        <tr>
                          <th className=" w-1/12  py-2 px-4 border-b">
                            Item ID
                          </th>
                          <th className=" w-2/12  py-2 px-4 border-b">Name</th>
                          <th className=" w-3/12  py-2 px-4 border-b">Image</th>
                          <th className=" w-2/12  py-2 px-4 border-b">Price</th>
                          <th className=" w-2/12  py-2 px-4 border-b">
                            Quantity
                          </th>
                          <th className=" w-2/12  py-2 px-4 border-b">
                            Total Price
                          </th>
                        </tr>
                      </thead>
                    </table>
                  </th>
                  <th className=" w-2/12  py-2 px-4 border-b border-l">Order Total </th>
                  <th className=" w-2/12  py-2 px-4 border-b">Order Status</th>
                </tr>
              </thead>
              <tbody>
                {ordersTable.map((order) => (
                  <React.Fragment key={order.order_id}>
                    <tr>
                      <td className=" w-2/12  py-2 px-4 border-b border-r">
                        {order.order_id}
                      </td>

                      {order.order_items.length > 0 && (
                        <td>
                          <table>
                            <tbody>
                              {order.order_items.map((item, index) => (
                                <tr key={item.item_id}>
                                  <td className=" w-1/12  py-2 px-4 border-b">
                                    {item.item_id}
                                  </td>
                                  <td className=" w-2/12  py-2 px-4 border-b">
                                    {item.name}
                                  </td>
                                  <td className=" w-3/12  py-2 px-4 border-b">
                                    <img
                                      src={item.image_url}
                                      alt={item.name}
                                      className="h-16 w-16"
                                    />
                                  </td>
                                  <td className=" w-2/12  py-2 px-4 border-b">
                                    Ksh {item.price}
                                  </td>
                                  <td className=" w-2/12  py-2 px-4 border-b">
                                    {item.quantity}
                                  </td>
                                  <td className=" w-2/12  py-2 px-4 border-b">
                                    ${item.total_price}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </td>
                      )}
                      <td className=" w-2/12  py-2 px-4 border-b border-l">
                        Ksh {order.order_items.reduce(
                          (total, item) => total + item.total_price,
                          0
                        )}
                      </td>
                      <td className=" w-2/12  py-2 px-4 border-b">
                        {order.order_status}
                      </td>
                    </tr>
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </main>
  );
};

export default Home;
