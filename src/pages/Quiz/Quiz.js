import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

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
  return (
    <div className="px-[16vw] bg-sky-400">
      <div className="px-[7vw] py-12 bg-white">
        <h1 className="text-6xl font-semibold">CBT</h1>
        <h1 className="py-4 text-xl">
          Answer the following questions based on how much were you bothered by
          these for the past week:
        </h1>
        {set.map((item, index) => (
          <div className="py-4" key={index}>
            <h1 className="text-lg">
              {index + 1}. {item.question}
            </h1>
            <div className="flex flex-row gap-4 py-2">
              {item.choices.map((choice) => (
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
                  />
                  <label>{choice}</label>
                </div>
              ))}
            </div>
          </div>
        ))}
        <div className="flex w-full gap-4">
          <button
            onClick={() => navigate("/")}
            className="col-span-3 bg-gradient-to-bl from-gray-600 to-gray-300 bg-[position:_0%_0%] hover:bg-[position:_100%_100%] bg-[size:_200%] transition-all duration-500 text-[#02203c] p-3 rounded-md"
          >
            Cancel
          </button>
          <button
            onClick={() => submit()}
            className="col-span-3 bg-gradient-to-bl from-sky-600 to-sky-300 bg-[position:_0%_0%] hover:bg-[position:_100%_100%] bg-[size:_200%] transition-all duration-500 text-[#02203c] p-3 rounded-md"
          >
            Submit
          </button>
        </div>
      </div>
    </div>
  );
};

export default Quiz;
