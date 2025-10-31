import React, { useState, useEffect } from "react";
import Navbar from "../../components/Navbar/Navbar";
import ProgressBar from "@ramonak/react-progress-bar";
import axios from "axios";

const initialRewards = [
  {
    id: 1,
    image:
      "https://store.storeimages.cdn-apple.com/4668/as-images.apple.com/is/iphone-14-pro-finish-select-202209-6-7inch_AV1?wid=940&hei=1112&fmt=png-alpha&.v=1663703840578",
    coins: 400,
    title: "Apple iPhone 14",
  },
  {
    id: 2,
    image:
      "https://images.unsplash.com/photo-1546868871-7041f2a55e12?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTB8fGFwcGxlJTIwd2F0Y2h8ZW58MHx8MHx8fDA%3D&auto=format&fit=crop&w=800&q=60",
    coins: 120,
    title: "Apple Watch Series 8",
  },
  {
    id: 3,
    image:
      "https://images.unsplash.com/photo-1485965120184-e220f721d03e?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8YmljeWNsZXxlbnwwfHwwfHx8MA%3D%3D&auto=format&fit=crop&w=800&q=60",
    coins: 200,
    title: "Premium Road Bike",
  },
  {
    id: 4,
    image:
      "https://images.unsplash.com/photo-1602143407151-7111542de6e8?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8NXx8d2F0ZXIlMjBib3R0bGV8ZW58MHx8MHx8fDA%3D&auto=format&fit=crop&w=800&q=60",
    coins: 25,
    title: "Insulated Water Bottle",
  },
  {
    id: 5,
    image:
      "https://images.unsplash.com/photo-1575537302964-96cd47c06b1b?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8Zml0Yml0fGVufDB8fDB8fHww&auto=format&fit=crop&w=800&q=60",
    coins: 80,
    title: "Fitbit Fitness Tracker",
  },
  {
    id: 6,
    image:
      "https://images.unsplash.com/photo-1622979135225-d2ba269cf1ac?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTB8fGhlYWRwaG9uZXN8ZW58MHx8MHx8fDA%3D&auto=format&fit=crop&w=800&q=60",
    coins: 100,
    title: "Noise-Cancelling Headphones",
  },
  {
    id: 7,
    image:
      "https://images.unsplash.com/photo-1534258936925-c58bed479fcb?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8Z3ltJTIwbWVtYmVyc2hpcHxlbnwwfHwwfHx8MA%3D%3D&auto=format&fit=crop&w=800&q=60",
    coins: 150,
    title: "3-Month Gym Membership",
  },
  {
    id: 8,
    image:
      "https://images.unsplash.com/photo-1616279969856-759f316a5ac1?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8M3x8c21hcnQlMjBzY2FsZXxlbnwwfHwwfHx8MA%3D%3D&auto=format&fit=crop&w=800&q=60",
    coins: 60,
    title: "Smart Body Scale",
  },
];

const Awards = () => {
  const [rewards, setRewards] = useState(initialRewards);
  const [availableRewards, setAvailableRewards] = useState([]);
  const [userCoins, setUserCoins] = useState(0);
  const [targetCoins, setTargetCoins] = useState(500);
  const [loading, setLoading] = useState(true);
  const [redeemStatus, setRedeemStatus] = useState({});

  useEffect(() => {
    // Simulate fetching user's rewards data
    const fetchRewards = async () => {
      try {
        // Fetch user's rewards data from backend
        const userData = localStorage.getItem("data");
        if (userData) {
          const user = JSON.parse(userData);
          const email = user.email;

          // Fetch user rewards
          const res = await axios.post("/rewards", {
            email: email,
          });

          setRewards(res.data.rewards || []);
          setUserCoins(res.data.totalPoints || 0);
          setAvailableRewards(res.data.availableRewards || []);
        }
        setLoading(false);
      } catch (error) {
        console.error("Error fetching rewards:", error);
        setLoading(false);
      }
    };

    fetchRewards();
  }, []);

  const handleRedeem = async (rewardId, coinCost) => {
    // Check if user has enough coins
    if (userCoins < coinCost) {
      alert("You don't have enough coins to redeem this reward!");
      return;
    }

    try {
      setRedeemStatus({ ...redeemStatus, [rewardId]: "processing" });
      
      // Use the backend API to redeem reward
      const email = JSON.parse(localStorage.getItem("data")).email;
      const res = await axios.post("/redeem-reward", {
        email: email,
        rewardId: rewardId
      });

      // Update user's points
      setUserCoins(prevCoins => prevCoins - coinCost);
      setRedeemStatus({ ...redeemStatus, [rewardId]: "redeemed" });

      // Refresh rewards data
      const rewardsRes = await axios.post("/rewards", {
        email: email,
      });
      setRewards(rewardsRes.data.rewards || []);
      setUserCoins(rewardsRes.data.totalPoints || 0);
      
      // Optional: Remove the redeemed item or mark as redeemed
      // setRewards(rewards.filter(reward => reward.id !== rewardId));
    } catch (error) {
      console.error("Error redeeming reward:", error);
      setRedeemStatus({ ...redeemStatus, [rewardId]: "failed" });
    }
  };

  // Calculate progress percentage for coin progress
  const progressPercentage = Math.min(100, (userCoins / targetCoins) * 100);

  return (
    <div className="flex flex-row">
      <Navbar />
      <div className="w-full">
        <div className="flex flex-row items-center justify-between p-6 bg-teal-100 h-fit shadow-lg">
          <h1 className="ml-4 text-3xl font-semibold text-teal-800">
            Rewards for you!
          </h1>
          <div className="flex items-center">
            <svg 
              className="w-6 h-6 text-yellow-500 mr-2" 
              fill="currentColor" 
              viewBox="0 0 20 20" 
              xmlns="http://www.w3.org/2000/svg"
            >
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9 5a1 1 0 012 0v2a1 1 0 11-2 0V5zm0 8a1 1 0 012 0v2a1 1 0 11-2 0v-2zm8-5a1 1 0 00-1-1h-2a1 1 0 100 2h2a1 1 0 001-1zM5 8a1 1 0 100 2h2a1 1 0 100-2H5z" clipRule="evenodd"></path>
            </svg>
            <h1 className="text-xl font-semibold">{userCoins} Coins</h1>
          </div>
        </div>
        
        <div className="p-4">
          <h1 className="font-semibold text-2xl mb-4 mt-4">
            Redeem your coins for amazing fitness rewards!
          </h1>
          
          <div className="w-1/2 mb-8">
            <h1 className="text-lg font-semibold mb-3">
              Progress towards {targetCoins} coins milestone: 
            </h1>
            <ProgressBar 
              completed={progressPercentage} 
              bgColor="#14b8a6"
              height="20px"
              labelAlignment="center"
              baseBgColor="#e5e7eb"
              labelColor="#ffffff"
            />
            <p className="text-sm text-gray-600 mt-2">Complete more activities to earn additional coins!</p>
          </div>
          
          <div className="flex flex-row flex-wrap justify-evenly gap-8">
            {loading ? (
              <div role="status" className="flex items-center justify-center w-full py-20">
                <svg
                  aria-hidden="true"
                  className="w-12 h-12 mr-2 text-gray-200 animate-spin dark:text-gray-600 fill-teal-600"
                  viewBox="0 0 100 101"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z"
                    fill="currentColor"
                  />
                  <path
                    d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z"
                    fill="currentFill"
                  />
                </svg>
                <span className="sr-only">Loading...</span>
              </div>
            ) : (
              rewards.map((reward) => (
                <div key={reward.id} className="w-[300px] bg-white p-4 shadow-lg rounded-lg flex flex-col items-center hover:shadow-xl transition-shadow duration-300">
                  <div className="h-[200px] w-[280px] overflow-hidden rounded-md mb-3">
                    <img 
                      src={reward.image} 
                      className="w-full h-full object-cover" 
                      alt={reward.title}
                    />
                  </div>
                  <h1 className="mt-2 text-xl font-semibold text-center">{reward.title}</h1>
                  <div className="mt-3 flex items-center bg-yellow-50 px-4 py-2 rounded-full">
                    <svg 
                      className="w-5 h-5 text-yellow-500 mr-2" 
                      fill="currentColor" 
                      viewBox="0 0 20 20" 
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z"></path><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clipRule="evenodd"></path>
                    </svg>
                    <h1 className="text-lg font-medium text-yellow-700">{reward.coins} coins</h1>
                  </div>
                  
                  <button 
                    className={`mt-4 w-full py-3 px-4 rounded-md text-white font-medium transition-all ${
                      userCoins >= reward.coins 
                        ? 'bg-teal-500 hover:bg-teal-600' 
                        : 'bg-gray-400 cursor-not-allowed'
                    }`}
                    onClick={() => handleRedeem(reward.id, reward.coins)}
                    disabled={userCoins < reward.coins || redeemStatus[reward.id] === "redeemed"}
                  >
                    {redeemStatus[reward.id] === "processing" ? (
                      <div className="flex items-center justify-center">
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Processing...
                      </div>
                    ) : redeemStatus[reward.id] === "redeemed" ? (
                      <div className="flex items-center justify-center">
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                        </svg>
                        Redeemed!
                      </div>
                    ) : userCoins < reward.coins ? (
                      <div className="flex items-center justify-center">
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path>
                        </svg>
                        Need {reward.coins - userCoins} more coins
                      </div>
                    ) : (
                      <div className="flex items-center justify-center">
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                        </svg>
                        Redeem Now
                      </div>
                    )}
                  </button>
                  
                  {redeemStatus[reward.id] === "failed" && (
                    <p className="mt-2 text-red-500 text-sm">Failed to redeem. Try again.</p>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Awards;