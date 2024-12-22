import { useState } from "react";
import { Outlet } from "react-router-dom";
import { Layout } from "antd";
import "./LayoutAdmin.scss";
import logo from "../images/logo.png";
import logo_fold from "../images/logo-fold.png";
import { MenuFoldOutlined, MenuUnfoldOutlined } from "@ant-design/icons";
import MenuSider from "../components/MenuSlider/MenuSlider";
import DropdownInfo from "../components/DropdownInfo/DropdownInfo";

const { Sider, Content } = Layout;

export default function LayoutAdmin() {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <>
      <Layout>
        <header className="header">
          <div
            className={`header__logoAdmin ${
              collapsed ? "header__logoAdmin--collapsed" : ""
            }`}
          >
            <img
              src={collapsed ? logo_fold : logo}
              alt={collapsed ? "logo-fold" : "logo"}
            />
          </div>
          <div className="header__nav">
            <div
              className="header__collapse"
              onClick={() => setCollapsed(!collapsed)}
            >
              {collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            </div>

            <div className="header__info">
              <DropdownInfo />
            </div>
          </div>
        </header>

        <Layout>
          <Sider theme="light" collapsed={collapsed} className="sider">
            <MenuSider />
          </Sider>
          <Content className="content">
            <Outlet />
          </Content>
        </Layout>
      </Layout>
    </>
  );
}
