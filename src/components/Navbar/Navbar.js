import React, { useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { FiHome } from "react-icons/fi";
import { SiPlanet } from "react-icons/si";
import { BiSolidReport, BiLogOut } from "react-icons/bi";
import { FaUserDoctor } from "react-icons/fa6";
import { MdOutlineFoodBank } from "react-icons/md";
import { BsFillChatLeftTextFill } from "react-icons/bs";
import { BiSolidPhoneCall } from "react-icons/bi";
import { ToastContainer, toast } from "react-toastify";
import { FaAward } from "react-icons/fa";
import "react-toastify/dist/ReactToastify.css";
import logo from "../../assets/logo.png"
const navigations = [
  {
    id: 1,
    name: "Home",
    path: "/",
    Icon: ({ color }) => <FiHome size={25} color={color} />,
  },
  {
    id: 2,
    name: "Plans",
    path: "/plans",
    Icon: ({ color }) => <SiPlanet size={25} color={color} />,
  },
  {
    id: 3,
    name: "Reports",
    path: "/reports",
    Icon: ({ color }) => <BiSolidReport size={25} color={color} />,
  },
  {
    id: 4,
    name: "Search Doctors",
    path: "/search-doctors",
    Icon: ({ color }) => <FaUserDoctor size={25} color={color} />,
  },
  {
    id: 5,
    path: "/diet-plan",
    name: "Diet Plan",
    Icon: ({ color }) => <MdOutlineFoodBank size={25} color={color} />,
  },
  {
    id: 6,
    path: "/chat",
    name: "Support Group",
    Icon: ({ color }) => <BsFillChatLeftTextFill size={25} color={color} />,
  },
  {
    id: 8,
    path: "/rewards",
    name: "Rewards",
    Icon: ({ color }) => <FaAward size={25} color={color} />,
  },
  {
    id: 7,
    name: "Emergency Call",
    Icon: ({ color }) => <BiSolidPhoneCall size={25} color={color} />,
  },
];
const Navbar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  useEffect(() => {
    console.log(location.pathname);
  }, [location]);
  const logout = () => {
    localStorage.removeItem("token")
    localStorage.removeItem("user")
    navigate("/login")
  }
  return (
    <div className="py-6 px-4 w-[20vw] h-screen shadow-lg">
      <ToastContainer />
      <div className="flex items-center">
      <h1 className="text-2xl text-teal-500 font-bold">.ai</h1>
      <img src={logo} className="w-12 h-12 ml-2" />
      </div>
      <div className="mt-8">
        <div>
        {navigations.map((nav) => (
          <Link
            onClick={() => {
              if (nav.id === 7) {
                toast("Hold Tight! Help Being Sent");
              }
            }}
            to={nav.path}
            key={nav.id}
          >
            <div
              className={`flex flex-row items-center py-4 px-2 rounded-md ${
                location.pathname === nav.path ? "bg-teal-100" : ""
              } `}
            >
              <nav.Icon
                color={location.pathname === nav.path ? "#115E59" : "#5A5A5A"}
              />
              <h1
                className={`text-lg ml-2  ${
                  location.pathname === nav.path
                    ? "text-teal-800 font-semibold"
                    : "text-gray-700"
                }`}
                >
                  {nav.name}
                </h1>
              </div>
            </Link>
          ))}
        </div>
        <button onClick={() => logout()}>
          <div className="flex flex-row items-center py-4 px-2 rounded-md text-red-500">
            <BiLogOut size={25} className="text-red-500" />
            <h1
              className='text-lg ml-2 text-red-500'
            >
              Logout
            </h1>
          </div>
        </button>
      </div>
    </div>
  );
};

export default Navbar;
