import { DownOutlined, UserOutlined } from "@ant-design/icons";
import { RiDashboard3Line } from "react-icons/ri";

import { Avatar, Dropdown, MenuProps, message, Space } from "antd";
import { ImExit } from "react-icons/im";
import { VscAccount } from "react-icons/vsc";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "../../redux/store";
import { logout } from "../../services/api";
import { Link, useNavigate } from "react-router-dom";
import { logoutAction } from "../../redux/account/accountSlice";

export default function DropdownInfo() {
  const user = useSelector((state: RootState) => state.account.user);
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const items: MenuProps["items"] = [
    {
      label: "Information",
      key: "information",
      icon: <VscAccount />,
    },
    {
      label: "Logout",
      key: "logout",
      icon: <ImExit />,
    },
  ];

  if (user.role === "ADMIN") {
    items?.unshift({
      label: <Link to={"/admin"}>Dashboard</Link>,
      key: "dashboard",
      icon: <RiDashboard3Line />,
    });
  }

  const handleMenuClick: MenuProps["onClick"] = async (e) => {
    //   if (e.key === "logout") {
    //     const res = await logout();
    //     if (res && res.statusCode === 201) {
    //       message.success("Logout successful!");
    //       localStorage.removeItem("access_token");
    //       dispatch(logoutAction());
    //       console.log("you have logout");
    //       navigate("/");
    //     } else {
    //       message.error("Logout failed!");
    //     }
    //   }
  };

  const menuProps = {
    items,
    onClick: handleMenuClick,
  };

  return (
    <>
      {user && user.fullName ? (
        <Dropdown menu={menuProps}>
          <Space>
            <Avatar
              src={`${import.meta.env.VITE_BACKEND_URL}/images/avatar/${
                user?.avatar
              }`}
              icon={<UserOutlined />}
            />
            {user.fullName}
            <DownOutlined />
          </Space>
        </Dropdown>
      ) : (
        <>
          Welcome, would you like to{" "}
          <Link to={import.meta.env.VITE_FRONTEND_URL + "/login"}>login</Link>
          {!window.location.pathname.startsWith("/admin") && (
            <>
              {" "}
              or{" "}
              <Link to={import.meta.env.VITE_FRONTEND_URL + "/register"}>
                register
              </Link>
            </>
          )}
        </>
      )}
    </>
  );
}
