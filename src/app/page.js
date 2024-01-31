"use client";
import Image from "next/image";
// components/DialogflowChat.js
import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { v4 as uuid } from "uuid";
import Sidenav from "./components/sidenav";

const Home = () => {
  const [items, setItems] = useState([]);
  useEffect(() => {
    const getFoodItems = async () => {
      const response = await axios.get("http://localhost:8000/fooditems");
      setItems(response.data);
    };
    getFoodItems();
  }, []);
  console.log(items);

  return (
    <main>
      <section className="bg-gray-50 dark:bg-gray-900">
        {/* side nav */}
        <Sidenav />
        <div className="md:h-screen sm:ml-64 relative">
          {/* Header */}
          <div></div>
          {/* food items */}
          <div className="flex flex-row flex-wrap gap-3 pt-4 px-auto bg-gray-100">
            {items.map((food, index) => (
              <div
                key={index}
                className="flex flex-col w-60 mx-auto"
                style={{
                  borderRadius: "16px",
                  //background: "#e0e0e0",
                  boxShadow: "5px 5px 10px #9d9d9d,-5px -5px 10px #ffffff",
                }}
              >
                <div className="w-60">
                  <img
                    src={food.image_url}
                    fill
                    className="w-60 h-48 bg-cover"
                    style={{ objectFit: "cover" }}
                    alt={food.name}
                  />
                </div>

                <p className="text-sm font-normal p-2.5 text-gray-900 dark:text-white flex flex-row justify-between">
                  <span className=" text-blue-800 font-bold">{index + 1} {food.name}</span>
                  <span className=" text-blue-800 font-bold">Ksh {food.price}</span>
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
};

export default Home;
