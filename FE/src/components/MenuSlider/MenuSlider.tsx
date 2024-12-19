import { Menu, MenuProps } from "antd";
import { DashboardOutlined } from "@ant-design/icons";
import { Link } from "react-router-dom";
import { FaUsers } from "react-icons/fa";

type MenuItem = Required<MenuProps>["items"][number];

export default function MenuSider() {
  const items: MenuItem[] = [
    {
      label: <Link to="/">Dashboard</Link>,
      key: "dashboard",
      icon: <DashboardOutlined />,
    },
    {
      label: "Manage Users",
      key: "manage-users",
      icon: <FaUsers />,
      children: [
        {
          label: <Link to="/list-users">List Users</Link>,
          key: "list-users",
        },
      ],
    },
  ];

  return (
    <>
      <Menu
        mode="inline"
        items={items}
        defaultSelectedKeys={["dashboard"]}
        defaultOpenKeys={["dashboard"]}
      />
    </>
  );
}
