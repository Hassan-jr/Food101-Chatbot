import Image from "next/image";
import React from "react";

function message({ msg }) {
  return (
    <div
      className={`flex items-start gap-2.5 ${
        msg.from == "Bot" ? "" : "ml-auto"
      }`}
    >
      <div
        className={`flex flex-col w-full max-w-[320px] leading-1.5 p-4 border-gray-200 ${
          msg.from == "Bot" ? "bg-blue-400 text-white" : "bg-gray-100"
        } rounded-e-xl rounded-es-xl dark:bg-gray-700`}
      >
        <div className="flex items-center space-x-2 rtl:space-x-reverse">
          <span className="text-sm font-semibold text-gray-900 dark:text-white">
            {msg.from}
          </span>
          <span className="text-sm font-normal text-gray-500 dark:text-gray-400">
            {msg.timeStamp?.toLocaleTimeString()}
          </span>
        </div>
        {msg.message.text == true ? (
          <p className="text-sm font-normal py-2.5 text-gray-900 dark:text-white">
            {msg.message.content}
          </p>
        ) : (
          <div className="flex flex-row gap-2 flex-wrap w-96">
            {msg.message.content.map((file, index) => (
              <div key={index}>
                <div style={{position:"relative", width: "150px", height: "150px" }}>
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
        )}

        <span className="text-sm font-normal text-gray-500 dark:text-gray-400">
          Delivered
        </span>
      </div>
    </div>
  );
}

export default message;
