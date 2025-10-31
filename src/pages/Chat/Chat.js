import React, { useEffect, useState } from "react";
import Navbar from "../../components/Navbar/Navbar";
import { AiOutlineSend } from "react-icons/ai";
import { db } from "../../firbase";
import {
  addDoc,
  serverTimestamp,
  query,
  collection,
  orderBy,
  onSnapshot,
  limit,
} from "firebase/firestore";
const Chat = () => {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const sendMessage = async () => {
    console.log("Hello");
    await addDoc(collection(db, "messages"), {
      message: message,
      username: "Manan",
      createdAt: serverTimestamp(),
    });
    setMessage("");
  };
  useEffect(() => {
    const q = query(
      collection(db, "messages"),
      orderBy("createdAt", "desc"),
      limit(50)
    );
    const unsubscribe = onSnapshot(q, (QuerySnapshot) => {
      const fetchedMessages = [];
      QuerySnapshot.forEach((doc) => {
        fetchedMessages.push({ ...doc.data(), id: doc.id });
      });
      const sortedMessages = fetchedMessages.sort(
        (a, b) => a.createdAt - b.createdAt
      );
      console.log(sortedMessages);
      setMessages(sortedMessages);
    });

    return () => unsubscribe;
  }, []);
  return (
    <div className="flex flex-row w-full">
      <Navbar />
      <div className="w-full relative">
        <div className="flex flex-row items-center px-6 py-4 bg-teal-100 w-full h-fit shadow-lg">
          <img
            src="https://jagwire.augusta.edu/wp-content/uploads/sites/15/2022/11/group.jpg"
            className="w-[65px] h-[65px] rounded-full object-cover"
          />
          <h1 className="ml-4 text-3xl font-semibold text-teal-800">
            Support Group
          </h1>
        </div>
        <div className="flex flex-col p-4 ">
          {messages?.map((message) => (
            <div
              key={message?.id}
              className={` ${message?.username === "Manan" ? "self-end" : ""}`}
            >
              {message?.username !== "Manan" ? (
                <div className="flex flex-row items-center">
                  <img
                    className="w-[30px] h-[30px] rounded-full"
                    src="https://htmlstream.com/preview/unify-v2.6/assets/img-temp/400x450/img5.jpg"
                  />
                  <h1 className="self-end ml-2">{message?.username}</h1>
                </div>
              ) : null}

              <div
                className={`mb-4 ml-8 px-4 py-3 rounded-lg max-w-[350px] ${
                  message?.username === "Manan"
                    ? "self-end bg-teal-200 text-teal-800"
                    : "bg-white shadow w-fit text-gray-700"
                } `}
              >
                <h1 className="text-xl font-semibold">{message?.message}</h1>
              </div>
            </div>
          ))}
        </div>
        <div className="absolute bottom-4 p-4 px-8 w-full flex flex-row items-center">
          <div className="p-2 w-full border border-2 border-gray-200 shadow-md rounded">
            <input
              type="text"
              className="text-lg w-full outline-none"
              placeholder="Enter message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />
          </div>
          <button className="ml-4 cursor-pointer">
            <AiOutlineSend onClick={() => sendMessage()} size={30} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default Chat;
