import React from "react";
import Navbar from "../../components/Navbar/Navbar";
import { useEffect } from "react";
import YouTubePlayer from "react-player/youtube";
import ProgressBar from "@ramonak/react-progress-bar";
import { useState } from "react";
import { TiTick } from "react-icons/ti";
import axios from "axios";
// const dummyData = [
//   {
//     link: "https://www.youtube.com/shorts/pBT87_Xz2pw",
//     title: "8 Best Cardio Exercises You Can Do Anywhere",
//     channel: "CHRIS HERIACHRIS HERIA",
//     channel_link: "https://www.youtube.com/@CHRISHERIA",
//     rank: 1,
//   },
//   {
//     link: "https://www.youtube.com/watch?v=zNG4BgMi91g&pp=ygUGQ2FyZGlv",
//     title: "30 Minute Cardio Sweat Workout | PRE - Day 19",
//     channel: "Sydney Cummings HoudyshellSydney Cummings Houdyshell",
//     channel_link: "https://www.youtube.com/@sydneycummingshoudyshell",
//     rank: 2,
//   },
//   {
//     link: "https://www.youtube.com/watch?v=QbmPxLWmWr8&pp=ygUGQ2FyZGlv",
//     title:
//       "10 MIN CARDIO WORKOUT AT HOME (No Jumping/Apartment Friendly, No Equipment)",
//     channel: "MadFitMadFit",
//     channel_link: "https://www.youtube.com/@MadFit",
//     rank: 3,
//   },
//   {
//     link: "https://www.youtube.com/watch?v=YvrKIQ_Tbsk&pp=ygUGQ2FyZGlv",
//     title: "Cardio vs. strength training: What you need to know",
//     channel: "MD Anderson Cancer CenterMD Anderson Cancer Center",
//     channel_link: "https://www.youtube.com/@mdanderson",
//     rank: 4,
//   },
//   {
//     link: "https://www.youtube.com/watch?v=x2JQnP_L04g&pp=ygUGQ2FyZGlv",
//     title:
//       "10 MIN CARDIO HIIT WORKOUT // Intense Calorie Burn | MrandMrsMuscle",
//     channel: "MrandMrsMuscleMrandMrsMuscle",
//     channel_link: "https://www.youtube.com/@Mrandmrsmuscle",
//     rank: 5,
//   },
//   {
//     link: "https://www.youtube.com/watch?v=IKWXUR6fuSw&pp=ygUGQ2FyZGlv",
//     title:
//       "10 MIN CARDIO HIIT WORKOUT // Intense Calorie Burn | MrandMrsMuscle",
//     channel: "MrandMrsMuscleMrandMrsMuscle",
//     channel_link: "https://www.youtube.com/@Mrandmrsmuscle",
//     rank: 6,
//   },
//   {
//     link: "https://www.youtube.com/shorts/swVcELOpKLw",
//     title: "the best cardio for weight loss 👀",
//     channel: "smoothieflipsmoothieflip",
//     channel_link: "https://www.youtube.com/@smoothieflip",
//     rank: 7,
//   },
//   {
//     link: "https://www.youtube.com/shorts/nJuEW3Q-x_4",
//     title: "HIIT Cardio Ain't All That 💀🤷‍♂️",
//     channel: "Mario RiosMario Rios",
//     channel_link: "https://www.youtube.com/@Coach_MarioRios",
//     rank: 8,
//   },
//   {
//     link: "https://www.youtube.com/watch?v=LJwupStv_jE&pp=ygUGQ2FyZGlv",
//     title:
//       "30 MIN KILLER HIIT Workout - No Equipment - No repeats, Full Body Cardio Home Workout",
//     channel: "growingannanasgrowingannanas",
//     channel_link: "https://www.youtube.com/@growingannanas",
//     rank: 9,
//   },
//   {
//     link: "https://www.youtube.com/watch?v=VWj8ZxCxrYk&pp=ygUGQ2FyZGlv",
//     title: "15 MIN BEGINNER CARDIO Workout (At Home No Equipment)",
//     channel: "MadFitMadFit",
//     channel_link: "https://www.youtube.com/@MadFit",
//     rank: 10,
//   },
// ];
const Plans = () => {
  const [data, setData] = useState([]);
  const [count, setCount] = useState(0);
  const [done, setDone] = useState([
    false,
    false,
    false,
    false,
    false,
    false,
    false,
    false,
    false,
    false,
  ]);
  useEffect(() => {
    getPlans();
  }, []);
  const getPlans = async () => {
    let email = await localStorage.getItem("data");
    console.log(email);
    email = JSON.parse(email);
    email = email.email;
    console.log(email);
    const res = await axios.post("/plans", {
      email: email,
    });
    console.log(res.data);
    setData(res.data);
  };
  return (
    <div className="flex flex-row">
      <Navbar />
      <div className="w-full">
        <div className="flex flex-row items-center p-6 bg-teal-100  h-fit shadow-lg">
          <h1 className="ml-4 text-3xl font-semibold text-teal-800">
            Personalized Plans!
          </h1>
        </div>
        <div className="p-4">
          <h1 className="font-semibold text-2xl mb-4 mt-4">
            A place to find videos curated just for you!
          </h1>
          <div className="w-1/2 mb-8">
            <h1 className="text-lg font-semibold mb-3">Your progress: </h1>
            <ProgressBar completed={count * 10} />
          </div>
          <div className="flex flex-row flex-wrap justify-evenly gap-6">
            {data?.length === 0 ? (
              <div role="status">
                <svg
                  aria-hidden="true"
                  class="w-8 h-8 mr-2 text-gray-200 animate-spin dark:text-gray-600 fill-blue-600"
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
                <span class="sr-only">Loading...</span>
              </div>
            ) : null}
            {data?.map((d, index) => (
              <div className="w-[450px] bg-white pb-3 shadow-lg">
                <YouTubePlayer
                  url={d.link}
                  controls={true}
                  width="450px"
                  height="250px"
                />
                <h1 className="mt-3 text-xl font-semibold ml-2">{d.title}</h1>
                <div className="flex flex-row justify-between w-full">
                  <a href={d.channel_link} target="_blank" className="w-fit">
                    <h1 className="text-lg mt-2 text-red-800 ml-2">
                      {d.channel}
                    </h1>
                  </a>
                  {done[index] ? (
                    <h1 className="mr-6 text-lg text-green-600 mt-2">Done</h1>
                  ) : (
                    <button
                      onClick={() => {
                        console.log(index);
                        setCount(count + 1);
                        done[index] = true;
                        setDone(done);
                        console.log(count);
                      }}
                      className="mr-6"
                    >
                      <TiTick size={30} color="green" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Plans;
