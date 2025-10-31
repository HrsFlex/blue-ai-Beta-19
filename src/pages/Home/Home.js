import React, { useEffect } from "react";
import ChatBot from "../../components/ChatBot/ChatBot";
import Navbar from "../../components/Navbar/Navbar";
import { useNavigate } from 'react-router-dom';

const Home = () => {
  const navigate = useNavigate();
  
  useEffect(() => {
    // Check for sessionId when component mounts
    const sessionId = localStorage.getItem("sessionId");
    if (!sessionId) {
      // If no sessionId exists, redirect to login
      navigate("/login");
    }
  }, [navigate]);

  return (
    <div className="flex flex-row">
      <Navbar />
      <ChatBot />
    </div>
  );
};

export default Home;