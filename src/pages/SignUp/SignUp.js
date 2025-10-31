import React, { Fragment, useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { MdEmail, MdPassword, MdPerson, MdCheck } from "react-icons/md";
import { PiCaretUpDownBold } from "react-icons/pi";
import wallpaper from "../../assets/login_wallp.png";
import { Tab, Listbox, Transition } from "@headlessui/react";
import axios from "axios";

const classNames = (...classes) => {
  return classes.filter(Boolean).join(" ");
};

const gender = [{ name: "Male" }, { name: "Female" }, { name: "Other" }];

const SignUp = () => {
  const navigate = useNavigate();
  const [tab, setTab] = useState(0);
  const [pass, setPass] = useState("");
  const [data, setData] = useState({
    email: "",
    name: "",
    password: "",
    address: "",
    age: "",
    height: "",
    sex: 0,
    weight: "",
    condition: "",
    history: "",
    emergency1: "",
    emergency2: "",
  });
  const register = () => {
    if (
      data.email === "" ||
      data.password === "" ||
      data.name === "" ||
      data.address === "" ||
      data.age === "" ||
      data.height === "" ||
      data.weight === "" ||
      data.condition === "" ||
      data.history === "" ||
      data.emergency1 === "" ||
      data.emergency2 === ""
    ) {
      alert("Please fill all the fields");
      return;
    } else if (data.password !== pass) {
      alert("Passwords don't match");
      return;
    }
    let config = {
      method: "post",
      maxBodyLength: Infinity,
      url: "/auth/register",
      headers: {
        "Content-Type": "application/json",
      },
      data: JSON.stringify(data),
    };
    axios
      .request(config)
      .then((response) => {
        console.log(JSON.stringify(response.data));
        navigate("/login");
      })
      .catch((error) => {
        console.log(error);
      });
  };
  return (
    <div className="w-full h-screen flex">
      <div className="flex flex-col px-36 py-6 flex-grow max-w-[50vw]">
        <div className="mt-32 max-w-[600px]">
          <h1 className="text-5xl leading-tight font-semibold mt-4 text-transparent bg-clip-text bg-gradient-to-r to-sky-600 from-sky-400">
            Blue.ai
          </h1>
          <h1 className="mt-4 text-2xl font-normal ">
            Empowering your journey to mental well-being with a stigma-free 3D
            companion
          </h1>
        </div>
        <img src={wallpaper} className="w-[450px]" />
      </div>
      <div className="flex min-w-[650px] justify-between flex-grow bg-[#02203c] text-sky-300">
        <div className="p-8 w-full min-h-[300px] px-24 self-center">
          <div
            className="flex flex-col justify-center gap-5"
            //   onSubmit={(e) => register(e)}
          >
            <h1 className="text-3xl font-semibold">Sign in!</h1>
            <p className="text-md font-medium">
              Start your journey of healing yourself!
            </p>
            <Tab.Group selectedIndex={tab} onChange={setTab}>
              <Tab.List className="flex justify-around space-x-1 rounded-xl py-2">
                <Tab
                  key="login"
                  className={({ selected }) =>
                    selected
                      ? "px-4 py-2 rounded-lg bg-blue-900/20 scale-110 border-2 border-sky-600 outline-none"
                      : "px-4 py-2 rounded-lg bg-transparent hover:bg-blue-900/20 transition-all duration-200 ease-in-out hover:scale-110"
                  }
                >
                  Login Details
                </Tab>
                <Tab
                  key="personal"
                  className={({ selected }) =>
                    selected
                      ? "px-4 py-2 rounded-lg bg-blue-900/20 scale-110 border-2 border-sky-600 outline-none"
                      : "px-4 py-2 rounded-lg bg-transparent hover:bg-blue-900/20 transition-all duration-200 ease-in-out hover:scale-110"
                  }
                >
                  Personal Details
                </Tab>
                <Tab
                  key="health"
                  className={({ selected }) =>
                    selected
                      ? "px-4 py-2 rounded-lg bg-blue-900/20 scale-110 border-2 border-sky-600 outline-none"
                      : "px-4 py-2 rounded-lg bg-transparent hover:bg-blue-900/20 transition-all duration-200 ease-in-out hover:scale-110"
                  }
                >
                  Health Details
                </Tab>
              </Tab.List>
              <Tab.Panels className="min-h-[30vh]">
                <Tab.Panel key="login" className="grid grid-cols-1 gap-4">
                  <div className="bg-sky-900 shadow p-2 flex items-center rounded-md">
                    <MdEmail className="text-sky-500 mr-2" size={18} />
                    <input
                      type="text"
                      placeholder="Enter email"
                      className="p-1 w-full text-sm outline-none bg-inherit"
                      value={data.email}
                      onChange={(e) =>
                        setData({ ...data, email: e.target.value })
                      }
                    />
                  </div>
                  <div className="bg-sky-900 shadow p-2 flex items-center rounded-md">
                    <MdPerson className="text-sky-500 mr-2" size={18} />
                    <input
                      type="text"
                      placeholder="Enter name"
                      className="p-1 text-sm outline-none bg-inherit"
                      value={data.name}
                      onChange={(e) =>
                        setData({ ...data, name: e.target.value })
                      }
                    />
                  </div>
                  <div className="bg-sky-900 shadow p-2 flex items-center rounded-md">
                    <MdPassword className="text-sky-500 mr-2" size={18} />
                    <input
                      type="password"
                      placeholder="Enter password"
                      className="p-1 text-sm outline-none bg-inherit"
                      value={data.password}
                      onChange={(e) =>
                        setData({ ...data, password: e.target.value })
                      }
                    />
                  </div>
                  <div className="bg-sky-900 shadow p-2 flex items-center rounded-md">
                    <MdPassword className="text-sky-500 mr-2" size={18} />
                    <input
                      type="password"
                      placeholder="Re-enter password"
                      className="p-1 text-sm outline-none bg-inherit"
                      value={pass}
                      onChange={(e) => setPass(e.target.value)}
                    />
                  </div>
                </Tab.Panel>
                <Tab.Panel key="personal" className="grid grid-cols-12 gap-4">
                  <div className="bg-sky-900 shadow p-2 flex items-center rounded-md col-span-12">
                    <input
                      type="text"
                      placeholder="Enter address"
                      className="p-1 text-sm w-full outline-none bg-inherit"
                      value={data.address}
                      onChange={(e) =>
                        setData({ ...data, address: e.target.value })
                      }
                    />
                  </div>
                  <div className="bg-sky-900 shadow p-2 flex items-center rounded-md col-span-6">
                    <input
                      type="number"
                      placeholder="Enter age"
                      className="p-1 text-sm w-full outline-none bg-inherit"
                      value={data.age}
                      onChange={(e) =>
                        setData({ ...data, age: e.target.value })
                      }
                    />
                  </div>
                  <div className="bg-sky-900 shadow p-2 flex items-center rounded-md col-span-6">
                    <input
                      type="number"
                      placeholder="Enter weight"
                      className="p-1 text-sm w-full outline-none bg-inherit"
                      value={data.weight}
                      onChange={(e) =>
                        setData({ ...data, weight: e.target.value })
                      }
                    />
                  </div>
                  <Listbox
                    value={data.sex}
                    onChange={(x) =>
                      setData((prevData) => ({
                        ...prevData,
                        sex: x,
                      }))
                    }
                  >
                    <div className="relative bg-sky-900 shadow rounded-md col-span-6">
                      <Listbox.Button className="relative text-gray-400 w-full h-full cursor-default rounded-lg py-2 pl-3 pr-10 text-left shadow-md focus:outline-none focus-visible:border-indigo-500 focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-opacity-75 focus-visible:ring-offset-2 focus-visible:ring-offset-orange-300 sm:text-sm">
                        <span className="block truncate">
                          {gender[data.sex].name}
                        </span>
                        <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                          <PiCaretUpDownBold
                            className="h-5 w-5 text-gray-400"
                            aria-hidden="true"
                          />
                        </span>
                      </Listbox.Button>
                      <Transition
                        as={Fragment}
                        leave="transition ease-in duration-100"
                        leaveFrom="opacity-100"
                        leaveTo="opacity-0"
                      >
                        <Listbox.Options className="absolute bg-sky-900 mt-1 max-h-60 w-full overflow-auto rounded-md py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
                          {gender.map((person, personIdx) => (
                            <Listbox.Option
                              key={personIdx}
                              className={({ active }) =>
                                `relative cursor-default select-none py-2 px-4 ${
                                  active
                                    ? "bg-sky-300 text-[#02203c]"
                                    : "text-sky-300"
                                }`
                              }
                              value={personIdx}
                            >
                              {({ selected }) => (
                                <>
                                  <span
                                    className={`block truncate ${
                                      selected ? "font-medium" : "font-normal"
                                    }`}
                                  >
                                    {person.name}
                                  </span>
                                  {selected && (
                                    <span className="absolute inset-y-0 right-0 flex items-center pr-3 text-[#02203c]">
                                      <MdCheck
                                        className="h-5 w-5"
                                        aria-hidden="true"
                                      />
                                    </span>
                                  )}
                                </>
                              )}
                            </Listbox.Option>
                          ))}
                        </Listbox.Options>
                      </Transition>
                    </div>
                  </Listbox>
                  <div className="bg-sky-900 shadow p-2 flex items-center rounded-md col-span-6">
                    <input
                      type="number"
                      placeholder="Enter height"
                      className="p-1 text-sm w-full outline-none bg-inherit"
                      value={data.height}
                      onChange={(e) =>
                        setData({ ...data, height: e.target.value })
                      }
                    />
                  </div>
                </Tab.Panel>
                <Tab.Panel key="health" className="grid grid-cols-12 gap-4">
                  <div className="bg-sky-900 shadow p-2 col-span-6 flex items-center rounded-md">
                    <input
                      type="text"
                      placeholder="Any medical condition"
                      className="p-1 text-sm w-full outline-none bg-inherit"
                      value={data.condition}
                      onChange={(e) =>
                        setData({ ...data, condition: e.target.value })
                      }
                    />
                  </div>
                  <div className="bg-sky-900 shadow p-2 flex items-center rounded-md col-span-6">
                    <input
                      type="text"
                      placeholder="Any family issue"
                      className="p-1 text-sm w-full outline-none bg-inherit"
                      value={data.history}
                      onChange={(e) =>
                        setData({ ...data, history: e.target.value })
                      }
                    />
                  </div>
                  <div className="bg-sky-900 shadow p-2 flex items-center rounded-md col-span-6">
                    <input
                      type="number"
                      placeholder="Emergency Contact 1"
                      className="p-1 text-sm w-full outline-none bg-inherit"
                      value={data.emergency1}
                      onChange={(e) =>
                        setData({ ...data, emergency1: e.target.value })
                      }
                    />
                  </div>
                  <div className="bg-sky-900 shadow p-2 flex items-center rounded-md col-span-6">
                    <input
                      type="number"
                      placeholder="Emergency Contact 2"
                      className="p-1 text-sm w-full outline-none bg-inherit"
                      value={data.emergency2}
                      onChange={(e) =>
                        setData({ ...data, emergency2: e.target.value })
                      }
                    />
                  </div>
                </Tab.Panel>
              </Tab.Panels>
            </Tab.Group>
            <div className="w-full grid grid-cols-12">
              {tab > 0 ? (
                <button
                  onClick={() => setTab((prevTab) => prevTab - 1)}
                  className="col-span-3 bg-gradient-to-bl from-sky-600 to-sky-300 bg-[position:_0%_0%] hover:bg-[position:_100%_100%] bg-[size:_200%] transition-all duration-500 text-[#02203c] p-3 rounded-md"
                >
                  Prev
                </button>
              ) : null}
              {tab < 1 ? (
                <div className="col-span-9 flex justify-center items-center"></div>
              ) : (
                <div className="col-span-6 flex justify-center items-center"></div>
              )}
              {tab !== 2 ? (
                <button
                  onClick={() => setTab((prevTab) => prevTab + 1)}
                  className="col-span-3 bg-gradient-to-bl from-sky-600 to-sky-300 bg-[position:_0%_0%] hover:bg-[position:_100%_100%] bg-[size:_200%] transition-all duration-500 text-[#02203c] p-3 rounded-md"
                >
                  Next
                </button>
              ) : null}
              {tab === 2 ? (
                <button
                  onClick={() => register()}
                  className="col-span-3 bg-gradient-to-bl from-sky-600 to-sky-300 bg-[position:_0%_0%] hover:bg-[position:_100%_100%] bg-[size:_200%] transition-all duration-500 text-[#02203c] p-3 rounded-md"
                >
                  Submit
                </button>
              ) : null}
            </div>
            {/* <button
              disabled={registering}
              className="bg-gradient-to-bl from-sky-600 to-sky-300 bg-[position:_0%_0%] hover:bg-[position:_100%_100%] bg-[size:_200%] transition-all duration-500 text-[#02203c] p-3 rounded-md"
            >
              {registering ? "Registering..." : "Register"}
            </button> */}
            <Link to="/login" className="text-sky-600 mt-4 font-medium">
              Already have an account? Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignUp;
