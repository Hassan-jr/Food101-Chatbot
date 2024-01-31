"use client";
import Image from "next/image";
// components/DialogflowChat.js
import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { v4 as uuid } from "uuid";
import Sidenav from "../components/sidenav";
import Message from "../components/message";

const CNN = () => {
  const [predImages, setPredImages] = useState([]);

  // ################################ IMAGE PREDICTION ###################################

  const handleUpload = async (event) => {
    try {
      const predictionsArray = []; // collects names to get a sentences

      const formData = new FormData();
      const files = event.target.files;
      console.log("Files", files);

      // predict on mutiple image
      const results = await Promise.all(
        Object.entries(files).map(async ([key, value]) => {
          formData.append("file", value);

          const response = await axios.post(
            "http://127.0.0.1:8000/predict",
            formData
          );
          console.log("Response:", response);

          const result = await response.data;
          predictionsArray.push(result.prediction);
          return result.prediction;
        })
      );

      const preds = Object.entries(files).map(([key, value], index) => ({
        imag_url: URL.createObjectURL(value),
        name: results[index],
        timeStamp: new Date(),
      }));

      // Add the images and the prediction to the images
      setPredImages((prev) => [...prev, ...preds]);
    } catch (error) {
      console.error("Error uploading image and making prediction:", error);
    }
  };

  console.log("PRED images:", predImages);

  return (
    <main>
      <section className="bg-gray-50 dark:bg-gray-900">
        {/* side nav */}
        <Sidenav />
        {/* CNN */}
        <div className="md:h-screen sm:ml-64 relative border-2">
          <div className=" min-h-screen max-h-[90vh] overflow-y-auto flex flex-row gap-2 flex-wrap  px-10 pb-20">
            {predImages.map((file, index) => (
              <div key={index}>
                <div
                  style={{
                    position: "relative",
                    width: "240px",
                    height: "200px",
                  }}
                >
                  <Image
                    src={file?.imag_url}
                    fill
                    style={{ objectFit: "cover" }}
                    alt={file?.name}
                  />
                </div>
                <p className="text-sm font-normal py-2.5 text-gray-900 dark:text-white">
                  Prediction: &nbsp;
                  <span className=" text-blue-800 font-bold">{file?.name}</span>
                </p>
              </div>
            ))}
          </div>

          {/* file upload */}
          <div className="absolute bottom-0 px-10 flex w-full">
            <div className=" w-full text-center m-1">
              <label
                className="block text-sm font-mediu dark:text-white bg-gray-50 text-blue-800 font-bold border border-blue-800 rounded-lg py-6 cursor-pointer "
                htmlFor="file_input"
              >
                Upload file
              </label>
              <input
                className="hidden w-full text-sm text-gray-900 border border-gray-300 rounded-lg cursor-pointer bg-gray-50 dark:text-gray-400 focus:outline-none dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400"
                id="file_input"
                type="file"
                accept="image/*"
                multiple
                required
                onChange={handleUpload}
              />
            </div>
          </div>
        </div>
      </section>
    </main>
  );
};

export default CNN;
