"use client";

import React, { useState, useEffect, useTransition } from "react";
import { Layout, Menu, Button, Avatar, Dropdown, Space, Typography, Tag, Spin } from "antd";
import type { MenuProps } from "antd";
import {
  IconFileText,
  IconFileCheck,
  IconShoppingCart,
  IconBuildingWarehouse,
  IconBuildingCommunity,
  IconLogout,
  IconUser,
  IconWorld,
  IconLayoutDashboard,
} from "@tabler/icons-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { useTranslation } from "@/locales/LanguageContext";

const { Header, Sider, Content } = Layout;
const { Text } = Typography;

interface ErpLayoutProps {
  children: React.ReactNode;
}

export const ErpLayout: React.FC<ErpLayoutProps> = ({ children }) => {
  const [collapsed, setCollapsed] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [pendingPath, setPendingPath] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading, logout } = useAuth();
  const [openKeys, setOpenKeys] = useState<string[]>([]);

  // Tự động đóng popup submenu khi pathname thay đổi hoặc khi click chọn mục
  useEffect(() => {
    if (collapsed) {
      setOpenKeys([]);
    } else {
      setOpenKeys(pathname.startsWith("/warehouse") ? ["warehouse"] : []);
    }
  }, [collapsed, pathname]);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    setPendingPath(null);
  }, [pathname]);

  useEffect(() => {
    if (!loading && !user && pathname !== "/login") {
      router.replace("/login");
    }
  }, [user, loading, pathname, router]);

  const { t, language, setLanguage } = useTranslation();

  if (pathname === "/login") {
    return <>{children}</>;
  }

  if (loading) {
    return (
      <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", height: "100vh", gap: 12 }}>
        <Spin size="large" />
        <Text type="secondary">{language === "en" ? "Loading session..." : "Đang tải phiên làm việc..."}</Text>
      </div>
    );
  }

  if (!user) {
    return (
      <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", height: "100vh", gap: 12 }}>
        <Spin size="large" />
        <Text type="secondary">{language === "en" ? "Redirecting to login..." : "Đang chuyển hướng đến trang đăng nhập..."}</Text>
      </div>
    );
  }

  const activePath = pendingPath || pathname;
  const isNavigating = isPending || Boolean(pendingPath && pendingPath !== pathname);

  const menuItems: MenuProps["items"] = [
    {
      key: "/quotations",
      icon: <IconFileText size={18} strokeWidth={1.8} />,
      label: <Link href="/quotations" prefetch={false}>{t("menu.quotations")}</Link>,
    },
    {
      key: "/contracts",
      icon: <IconFileCheck size={18} strokeWidth={1.8} />,
      label: <Link href="/contracts" prefetch={false}>{t("menu.contracts")}</Link>,
    },
    {
      key: "/purchase-orders",
      icon: <IconShoppingCart size={18} strokeWidth={1.8} />,
      label: <Link href="/purchase-orders" prefetch={false}>{t("menu.purchaseOrders")}</Link>,
    },
    {
      key: "warehouse",
      icon: <IconBuildingWarehouse size={18} strokeWidth={1.8} />,
      label: t("menu.warehouse"),
      children: [
        {
          key: "/warehouse/receipt",
          label: <Link href="/warehouse/receipt" prefetch={false}>{t("menu.receipt")}</Link>,
        },
        {
          key: "/warehouse/requisition",
          label: <Link href="/warehouse/requisition" prefetch={false}>{t("menu.requisition")}</Link>,
        },
        {
          key: "/warehouse/issue",
          label: <Link href="/warehouse/issue" prefetch={false}>{t("menu.issue")}</Link>,
        },
        {
          key: "/warehouse/inventory",
          label: <Link href="/warehouse/inventory" prefetch={false}>{t("menu.inventory")}</Link>,
        },
        {
          key: "/warehouse/period-report",
          label: <Link href="/warehouse/period-report" prefetch={false}>{t("menu.periodReport")}</Link>,
        },
      ],
    },
  ];

  const userFullName = mounted && user?.FullName ? user.FullName : mounted && user?.LogIn ? user.LogIn : "";
  const userInitial = mounted && (user?.FullName?.[0] || user?.LogIn?.[0]) ? (user?.FullName?.[0] || user?.LogIn?.[0]).toUpperCase() : "U";
  const userJobTitle = mounted && user?.JobTitle ? user.JobTitle : "";

  const userMenuItems: MenuProps["items"] = [
    {
      key: "user-info",
      label: (
        <div style={{ padding: "4px 8px" }}>
          <Text strong suppressHydrationWarning>{mounted && user?.FullName ? user.FullName : mounted && user?.LogIn ? user.LogIn : t("common.account")}</Text>
          <br />
          <Text type="secondary" style={{ fontSize: 12 }} suppressHydrationWarning>{mounted ? user?.LogIn : ""}</Text>
        </div>
      ),
      disabled: true,
    },
    { type: "divider" },
    {
      key: "logout",
      icon: <IconLogout size={16} strokeWidth={1.8} />,
      label: t("common.logout"),
      danger: true,
      onClick: logout,
    },
  ];

  const languageMenuItems: MenuProps["items"] = [
    {
      key: "vi",
      label: (
        <Space size={6}>
          <span>🇻🇳</span>
          <span style={{ fontWeight: language === "vi" ? 600 : 400 }}>Tiếng Việt (vi)</span>
        </Space>
      ),
      onClick: () => setLanguage("vi"),
    },
    {
      key: "en",
      label: (
        <Space size={6}>
          <span>🇺🇸</span>
          <span style={{ fontWeight: language === "en" ? 600 : 400 }}>English (en)</span>
        </Space>
      ),
      onClick: () => setLanguage("en"),
    },
  ];

  return (
    <Layout style={{ minHeight: "100vh", background: "#f2f6f5" }}>
      <Sider
        collapsible
        collapsed={collapsed}
        onCollapse={(val) => setCollapsed(val)}
        theme="dark"
        width={250}
        style={{
          boxShadow: "2px 0 8px rgba(18, 52, 67, 0.12)",
          zIndex: 101,
          position: "sticky",
          top: 0,
          height: "100vh",
          overflow: "auto",
          background: "#0e2631",
        }}
      >
        <div
          style={{
            height: 48,
            display: "flex",
            alignItems: "center",
            padding: "0 16px",
            background: "#082a39",
            gap: 12,
            borderBottom: "1px solid rgba(220, 229, 230, 0.1)",
          }}
        >
          <IconBuildingCommunity size={22} strokeWidth={1.8} style={{ color: "#008f89" }} />
          {!collapsed && (
            <div>
              <Text strong style={{ color: "#fff", fontSize: 15, display: "block", lineHeight: "1.2", letterSpacing: "-0.3px" }}>
                ConsIMS
              </Text>
            </div>
          )}
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[activePath]}
          openKeys={openKeys}
          onOpenChange={(keys) => setOpenKeys(keys)}
          items={menuItems}
          onClick={({ key }) => {
            if (collapsed) {
              setOpenKeys([]);
            }
            if (key !== pathname) {
              setPendingPath(key);
              startTransition(() => {
                router.push(key);
              });
            }
          }}
          style={{ marginTop: 8, background: "#0e2631" }}
        />
      </Sider>
      <Layout style={{ background: "#f2f6f5" }}>
        <Header
          style={{
            height: 48,
            lineHeight: "48px",
            background: "#fff",
            padding: "0 18px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            borderBottom: "1px solid #dce5e6",
            boxShadow: "0 1px 4px rgba(18, 52, 67, 0.04)",
            zIndex: 100,
            position: "sticky",
            top: 0,
          }}
        >
          <Space size="middle">
            <IconLayoutDashboard size={18} strokeWidth={1.8} style={{ color: "#008f89" }} />
            <Text strong style={{ fontSize: 15, color: "#123443" }}>
              {activePath === "/quotations" && t("pageTitles.quotations")}
              {activePath === "/contracts" && t("pageTitles.contracts")}
              {activePath === "/purchase-orders" && t("pageTitles.purchaseOrders")}
              {activePath.startsWith("/warehouse/receipt") && t("pageTitles.receipt")}
              {activePath.startsWith("/warehouse/requisition") && t("pageTitles.requisition")}
              {activePath.startsWith("/warehouse/issue") && t("pageTitles.issue")}
              {activePath.startsWith("/warehouse/inventory") && t("pageTitles.inventory")}
              {activePath.startsWith("/warehouse/period-report") && t("pageTitles.periodReport")}
            </Text>
            {isNavigating && <Spin size="small" />}
          </Space>

          <Space size="middle">
            <Dropdown menu={{ items: languageMenuItems }} placement="bottomRight">
              <Button style={{ display: "inline-flex", alignItems: "center", gap: 6, borderRadius: 6, height: 30, borderColor: "#dce5e6", color: "#123443", fontSize: 12.5 }}>
                <IconWorld size={15} strokeWidth={1.8} style={{ color: "#008f89" }} />
                <span>{language === "en" ? "English (en)" : "Tiếng Việt (vi)"}</span>
              </Button>
            </Dropdown>
            <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
              <Space style={{ cursor: "pointer" }} size={8}>
                <span suppressHydrationWarning>
                  <Avatar size={30} style={{ backgroundColor: "#008f89" }} icon={<IconUser size={15} />}>
                    {userInitial}
                  </Avatar>
                </span>
                <div style={{ textAlign: "left", lineHeight: 1.2 }}>
                  <Text strong style={{ display: "block", fontSize: 12.5, color: "#123443" }} suppressHydrationWarning>
                    {userFullName}
                  </Text>
                  <Text style={{ fontSize: 10.5, color: "#718894" }} suppressHydrationWarning>
                    {userJobTitle}
                  </Text>
                </div>
              </Space>
            </Dropdown>
          </Space>
        </Header>
        <Content
          style={{
            margin: "16px 20px 24px 20px",
            minHeight: 280,
            background: "#f2f6f5",
            opacity: isNavigating ? 0.65 : 1,
            transition: "opacity 0.15s ease",
          }}
        >
          {children}
        </Content>
      </Layout>
    </Layout>
  );
};
