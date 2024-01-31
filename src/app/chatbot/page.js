"use client";
import Image from "next/image";
// components/DialogflowChat.js
import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { v4 as uuid } from "uuid";
import Sidenav from "../components/sidenav";
import Message from "../components/message";

const DialogflowChat = () => {
  const [userId, setUserId] = useState("");
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState("");

  // auto scroll
  const messagesRef = useRef(null);
  useEffect(() => {
    messagesRef.current?.lastElementChild?.scrollIntoView();
  }, [messages]);

  // get user id
  useEffect(() => {
    const id = uuid();
    setUserId(id);
  }, []);

  // send text messages
  const handleSendMessage = async () => {
    try {
      setMessages((prev) => [
        ...prev,
        {
          message: { text: true, content: inputText },
          from: "You",
          timeStamp: new Date(),
        },
      ]);
      const response = await axios.post(
        "http://localhost:8000/get_image_text_response",
        {
          text_input: inputText,
          user_id: userId,
        }
      );

      setMessages((prev) => [
        ...prev,
        {
          message: {
            text: true,
            content:
              response.data.response_text || response.data.fulfillmentText,
          },
          from: "Bot",
          timeStamp: new Date(),
        },
      ]);

      // empty input text
      setInputText("");
    } catch (error) {
      console.error("Error:", error);
    }
  };

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

      // generate a sentence from the class name
      const sentence = predictionsArray
        .map(
          (prediction) =>
            `1 ${prediction}`
        )
        .join(", ");
      console.log("sentence: ", sentence);
      console.log("Prediction Result:", results);

      // Add the images and the prediction to the images
      setMessages((prev) => [
        ...prev,
        {
          message: {
            text: false,
            content: Object.entries(files).map(([key, value], index) => ({
              imag_url: URL.createObjectURL(value),
              name: results[index],
            })),
            from: "You",
            timeStamp: new Date(),
          },
        },
      ]);

      // send image senteces
      const response = await axios.post(
        "http://localhost:8000/get_image_text_response",
        {
          text_input: sentence,
          user_id: userId,
        }
      );

      // set response
      setMessages((prev) => [
        ...prev,
        {
          message: {
            text: true,
            content:
              response.data.response_text || response.data.fulfillmentText,
          },
          from: "Bot",
          timeStamp: new Date(),
        },
      ]);
    } catch (error) {
      console.error("Error uploading image and making prediction:", error);
    }
  };

  return (
    <main>
      <section className="bg-gray-50 dark:bg-gray-900">
        {/* side nav */}
        <Sidenav />
        {/* chatbot */}
        <div className="md:h-screen sm:ml-64 relative">
          {/* messages */}
          <div className="relative min-h-screen max-h-[90vh] overflow-y-auto p-10 border border-gray-300">
            {messages.map((msg, index) => (
              <div
                ref={messagesRef}
                key={index}
                className={`flex flex-column mb-12`}
              >
                <Message msg={msg} />
              </div>
            ))}
          </div>
          {/* inputs */}
          <div className="absolute bottom-0 p-10 flex w-full">
            {/* input text */}
            <input
              type="text"
              placeholder="Type your message..."
              value={inputText}
              className="w-4/5 mr-2 bg-gray-50 border border-gray-300 text-gray-900 sm:text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleSendMessage();
                }
              }}
            />
            {/* file upload */}
            <div className="w-1/5 m-1">
              <label
                className="block text-sm font-mediu dark:text-white bg-gray-50 text-blue-800 font-bold border border-primary-800 rounded-lg px-3 py-2.5 cursor-pointer "
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
            {/* send button */}
            <button
              className="text-white w-1/5 bg-blue-600 hover:bg-primary-700 focus:ring-4 focus:outline-none focus:ring-primary-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center dark:bg-primary-600 dark:hover:bg-primary-700 dark:focus:ring-primary-800"
              onClick={handleSendMessage}
            >
              Send
            </button>
          </div>
        </div>
      </section>
    </main>
  );
};

export default DialogflowChat;
