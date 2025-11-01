import React, { useState, useEffect } from "react";
import Navbar from "../../components/Navbar/Navbar";
import ProgressBar from "@ramonak/react-progress-bar";
import axios from "axios";
import {
  AnimatedCard,
  AnimatedProgress,
  CoinCounter,
  SuccessAnimation,
  FadeIn
} from "../../components/Animations";
import { useCoinAnimation, useSuccessAnimation, useReducedMotion } from "../../utils/animations/useAnimationHooks";

// API base URL - using relative URL to work with proxy
const API_BASE_URL = "";

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
  const [targetCoins, setTargetCoins] = useState(500);
  const [loading, setLoading] = useState(true);
  const [redeemStatus, setRedeemStatus] = useState({});

  // Animation hooks
  const { coins: userCoins, addCoins, spendCoins } = useCoinAnimation(0);
  const { showSuccess, message, triggerSuccess } = useSuccessAnimation();
  const shouldReduceMotion = useReducedMotion();

  // Handle adding coins for testing
  const handleAddCoins = async () => {
    try {
      const userData = localStorage.getItem("data");
      console.log("User data from localStorage:", userData);

      if (userData) {
        const user = JSON.parse(userData);
        console.log("Parsed user:", user);
        const email = user.email;
        console.log("User email:", email);

        if (!email) {
          console.error("No email found in user data");
          // Create default user data if no email exists
          const defaultEmail = "user@example.com";
          localStorage.setItem("data", JSON.stringify({ email: defaultEmail, name: "Test User" }));
          console.log("Created default user data");

          const res = await axios.post(`${API_BASE_URL}/add-coins`, {
            email: defaultEmail,
            amount: 100
          });

          console.log("Add coins response:", res.data);
          addCoins(100, 'bounce');
          triggerSuccess("Successfully added 100 coins!");
          return;
        }

        const res = await axios.post(`${API_BASE_URL}/add-coins`, {
          email: email,
          amount: 100
        });

        console.log("Add coins response:", res.data);
        addCoins(100, 'bounce');
        triggerSuccess("Successfully added 100 coins!");
      } else {
        console.error("No user data found in localStorage");
        // Create default user data if none exists
        const defaultEmail = "user@example.com";
        localStorage.setItem("data", JSON.stringify({ email: defaultEmail, name: "Test User" }));
        console.log("Created default user data");

        const res = await axios.post(`${API_BASE_URL}/add-coins`, {
          email: defaultEmail,
          amount: 100
        });

        console.log("Add coins response:", res.data);
        addCoins(100, 'bounce');
        triggerSuccess("Successfully added 100 coins!");
      }
    } catch (error) {
      console.error("Error adding coins:", error);
    }
  };

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
          const res = await axios.post(`${API_BASE_URL}/rewards`, {
            email: email,
          });

          setRewards(res.data.rewards || []);
          addCoins(res.data.totalPoints || 0, 'bounce');
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
      const res = await axios.post(`${API_BASE_URL}/redeem-reward`, {
        email: email,
        rewardId: rewardId
      });

      // Update user's points with animation
      spendCoins(coinCost);
      setRedeemStatus({ ...redeemStatus, [rewardId]: "redeemed" });

      // Trigger success animation
      const reward = rewards.find(r => r.id === rewardId);
      triggerSuccess(`Successfully redeemed ${reward?.title}!`);

      // Refresh rewards data
      const rewardsRes = await axios.post("http://localhost:5000/rewards", {
        email: email,
      });
      setRewards(rewardsRes.data.rewards || []);
      addCoins(rewardsRes.data.totalPoints - userCoins + coinCost, 'bounce');

      // Reset redeem status after delay
      setTimeout(() => {
        setRedeemStatus(prev => ({ ...prev, [rewardId]: null }));
      }, 3000);
    } catch (error) {
      console.error("Error redeeming reward:", error);
      setRedeemStatus({ ...redeemStatus, [rewardId]: "failed" });
      setTimeout(() => {
        setRedeemStatus(prev => ({ ...prev, [rewardId]: null }));
      }, 3000);
    }
  };

  // Calculate progress percentage for coin progress
  const progressPercentage = Math.min(100, (userCoins / targetCoins) * 100);

  return (
    <div className="flex flex-row">
      <Navbar />
      <div className="w-full">
        <FadeIn>
          <div className="flex flex-row items-center justify-between p-6 bg-teal-100 h-fit shadow-lg">
            <h1 className="ml-4 text-3xl font-semibold text-teal-800">
              Rewards for you!
            </h1>
            <div className="flex items-center">
              <CoinCounter
                value={userCoins}
                size="large"
                showAnimation={!shouldReduceMotion}
                className="text-xl font-semibold"
              />
            </div>
          </div>
        </FadeIn>
        
        <FadeIn delay={0.2}>
          <div className="p-4">
            <div className="flex justify-between items-center mb-4 mt-4">
              <h1 className="font-semibold text-2xl">
                Redeem your coins for amazing fitness rewards!
              </h1>
              <button
                onClick={handleAddCoins}
                className="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
                </svg>
                Add 100 Coins
              </button>
            </div>

            <div className="w-1/2 mb-8">
              <h1 className="text-lg font-semibold mb-3">
                Progress towards {targetCoins} coins milestone:
              </h1>
              <AnimatedProgress
                value={userCoins}
                maxValue={targetCoins}
                height="20px"
                fillColor="#14b8a6"
                showPercentage={true}
                animated={!shouldReduceMotion}
                delay={0.3}
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
              rewards.map((reward, index) => (
                <AnimatedCard
                  key={reward.id}
                  className="w-[300px] bg-white p-4 shadow-lg rounded-lg flex flex-col items-center"
                  delay={index * 0.1}
                  hoverEffect={!shouldReduceMotion}
                  tapEffect={!shouldReduceMotion}
                >
                  <div className="h-[200px] w-[280px] overflow-hidden rounded-md mb-3">
                    <img
                      src={reward.image}
                      className="w-full h-full object-cover"
                      alt={reward.title}
                    />
                  </div>
                  <h1 className="mt-2 text-xl font-semibold text-center">{reward.title}</h1>
                  <div className="mt-3 flex items-center bg-yellow-50 px-4 py-2 rounded-full">
                    <CoinCounter
                      value={reward.coins}
                      size="small"
                      showAnimation={false}
                      className="text-lg font-medium text-yellow-700"
                    />
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
                </AnimatedCard>
              ))
            )}
          </div>
          </div>
        </FadeIn>

        {/* Success Animation */}
        <SuccessAnimation show={showSuccess}>
          {message}
        </SuccessAnimation>
      </div>
    </div>
  );
};

export default Awards;