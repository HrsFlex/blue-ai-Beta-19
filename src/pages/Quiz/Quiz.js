import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import Navbar from "../../components/Navbar/Navbar";
import { AnimatedCard, FadeIn, AnimatedProgress } from "../../components/Animations";
import { useReducedMotion } from "../../utils/animations/useAnimationHooks";

const set = [
  {
    question:
      "For the past week, how much were you bothered by: Nervousness or shakiness inside",
    choices: [
      "Not at all",
      "A little Bit",
      "Moderately",
      "Quite A Bit",
      "Extremely",
    ],
  },
  {
    question: "Faintness or dizziness",
    choices: [
      "Not at all",
      "A little Bit",
      "Moderately",
      "Quite A Bit",
      "Extremely",
    ],
  },
  {
    question: "The idea that someone else can control your thoughts",
    choices: [
      "Not at all",
      "A little Bit",
      "Moderately",
      "Quite A Bit",
      "Extremely",
    ],
  },
  {
    question: "Feeling others are to blame for most of your troubles",
    choices: [
      "Not at all",
      "A little Bit",
      "Moderately",
      "Quite A Bit",
      "Extremely",
    ],
  },
  {
    question: "Feeling easily annoyed or irritated",
    choices: [
      "Not at all",
      "A little Bit",
      "Moderately",
      "Quite A Bit",
      "Extremely",
    ],
  },
  {
    question: "Pains in heart or chest",
    choices: [
      "Not at all",
      "A little Bit",
      "Moderately",
      "Quite A Bit",
      "Extremely",
    ],
  },
  {
    question: "Feeling afraid in open spaces or on the streets",
    choices: [
      "Not at all",
      "A little Bit",
      "Moderately",
      "Quite A Bit",
      "Extremely",
    ],
  },
  {
    question: "Thoughts of ending your life",
    choices: [
      "Not at all",
      "A little Bit",
      "Moderately",
      "Quite A Bit",
      "Extremely",
    ],
  },
  {
    question: "Feeling that most people cannot be trusted",
    choices: [
      "Not at all",
      "A little Bit",
      "Moderately",
      "Quite A Bit",
      "Extremely",
    ],
  },
];

const answers = [
  {
    question:
      "For the past week, how much were you bothered by: Nervousness or shakiness inside",
    answer: "",
  },
  {
    question: "Faintness or dizziness",
    answer: "",
  },
  {
    question: "The idea that someone else can control your thoughts",
    answer: "",
  },
  {
    question: "Feeling others are to blame for most of your troubles",
    answer: "",
  },
  {
    question: "Feeling easily annoyed or irritated",
    answer: "",
  },
  {
    question: "Pains in heart or chest",
    answer: "",
  },
  {
    question: "Feeling afraid in open spaces or on the streets",
    answer: "",
  },
  {
    question: "Thoughts of ending your life",
    answer: "",
  },
  {
    question: "Feeling that most people cannot be trusted",
    answer: "",
  },
];

const Quiz = () => {
  const [ans, setAns] = useState(answers);
  const navigate = useNavigate();
  const shouldReduceMotion = useReducedMotion();

  const submit = () => {
    if (ans.some((answer) => answer.answer === "")) {
      alert("Please answer all the questions");
      return;
    }
    axios
      .post("/report/fetch", {
        quiz: JSON.stringify(ans),
        email: JSON.parse(localStorage.getItem("data")).email,
      })
      .then((res) => {
        console.log(res.data);
        navigate("/reports");
      });
  };

  const progressPercentage = (ans.filter(answer => answer.answer !== "").length / ans.length) * 100;

  return (
    <div className="flex">
      <Navbar />
      <div className="flex-1 px-[16vw] bg-sky-400">
        <div className="px-[7vw] py-12 bg-white">
          <FadeIn>
            <h1 className="text-6xl font-semibold">CBT</h1>
            <h1 className="py-4 text-xl">
              Answer the following questions based on how much were you bothered by
              these for the past week:
            </h1>

            <div className="mb-8">
              <AnimatedProgress
                value={ans.filter(answer => answer.answer !== "").length}
                maxValue={ans.length}
                height="24px"
                fillColor="#0ea5e9"
                showPercentage={true}
                animated={!shouldReduceMotion}
                delay={0.2}
              />
              <p className="text-sm text-gray-600 mt-2">
                Progress: {ans.filter(answer => answer.answer !== "").length} of {ans.length} questions answered
              </p>
            </div>
          </FadeIn>

          {set.map((item, index) => (
            <AnimatedCard
              key={index}
              className="py-4 mb-4"
              delay={index * 0.1}
              hoverEffect={!shouldReduceMotion}
            >
              <h1 className="text-lg font-medium">
                {index + 1}. {item.question}
              </h1>
              <div className="flex flex-row gap-4 py-2 flex-wrap">
                {item.choices.map((choice, choiceIndex) => (
                  <div className="flex flex-row items-center gap-2" key={choice}>
                    <input
                      type="radio"
                      checked={ans[index].answer === choice}
                      onChange={() =>
                        setAns((prev) =>
                          prev.map((answer, i) =>
                            i === index ? { ...answer, answer: choice } : answer
                          )
                        )
                      }
                      name={item.question + choice}
                      className="w-4 h-4"
                    />
                    <label className="cursor-pointer hover:text-sky-600 transition-colors">
                      {choice}
                    </label>
                  </div>
                ))}
              </div>
            </AnimatedCard>
          ))}

          <FadeIn delay={set.length * 0.1}>
            <div className="flex w-full gap-4">
              <button
                onClick={() => navigate("/")}
                className="col-span-3 bg-gradient-to-bl from-gray-600 to-gray-300 bg-[position:_0%_0%] hover:bg-[position:_100%_100%] bg-[size:_200%] transition-all duration-500 text-[#02203c] p-3 rounded-md"
              >
                Cancel
              </button>
              <button
                onClick={() => submit()}
                disabled={ans.some((answer) => answer.answer === "")}
                className="col-span-3 bg-gradient-to-bl from-sky-600 to-sky-300 bg-[position:_0%_0%] hover:bg-[position:_100%_100%] bg-[size:_200%] transition-all duration-500 text-[#02203c] p-3 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Submit Assessment
              </button>
            </div>
          </FadeIn>
        </div>
      </div>
    </div>
  );
};

export default Quiz;
