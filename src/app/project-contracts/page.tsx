"use client";

import React, { useState } from "react";
import { Tabs, Space } from "antd";
import { IconBuildingCommunity, IconBriefcase } from "@tabler/icons-react";
import { ErpPageContainer } from "@/components/layout/ErpPageContainer";
import MainContractsTab from "./_components/MainContractsTab";
import ProjectContractsTab from "./_components/ProjectContractsTab";
import { useTranslation } from "@/locales/LanguageContext";

export default function ContractsUnifiedPage() {
  const { language } = useTranslation();
  const isEn = language === "en";

  const [activeTabKey, setActiveTabKey] = useState<string>("main");
  const [hasLoadedSubTab, setHasLoadedSubTab] = useState<boolean>(false);

  const tabItems = [
    {
      key: "main",
      label: (
        <Space size={6}>
          <IconBuildingCommunity size={16} strokeWidth={1.8} style={{ color: "#008f89" }} />
          <span>{isEn ? "CLIENT CONTRACTS" : "HỢP ĐỒNG CHỦ ĐẦU TƯ"}</span>
        </Space>
      ),
    },
    {
      key: "sub",
      label: (
        <Space size={6}>
          <IconBriefcase size={16} strokeWidth={1.8} style={{ color: "#008f89" }} />
          <span>{isEn ? "PROJECT SUBCONTRACTS" : "HỢP ĐỒNG DỰ ÁN (THẦU PHỤ / NCC)"}</span>
        </Space>
      ),
    },
  ];

  return (
    <ErpPageContainer>
      {/* Thanh Tabs chuyển đổi */}
      <div style={{ flexShrink: 0, marginBottom: 8 }}>
        <Tabs
          activeKey={activeTabKey}
          onChange={(key) => {
            setActiveTabKey(key);
            if (key === "sub") {
              setHasLoadedSubTab(true);
            }
          }}
          items={tabItems}
        />
      </div>

      {/* Nội dung: Hiển thị duy nhất 1 Tab toàn màn hình (không chia trên dưới) */}
      <div style={{ flex: "1 1 0%", minHeight: 0, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <div
          style={{
            display: activeTabKey === "main" ? "flex" : "none",
            flex: "1 1 0%",
            minHeight: 0,
            flexDirection: "column",
            height: "100%",
            overflow: "hidden",
          }}
        >
          <MainContractsTab />
        </div>

        <div
          style={{
            display: activeTabKey === "sub" ? "flex" : "none",
            flex: "1 1 0%",
            minHeight: 0,
            flexDirection: "column",
            height: "100%",
            overflow: "hidden",
          }}
        >
          {hasLoadedSubTab ? (
            <ProjectContractsTab />
          ) : (
            <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <span style={{ color: "#94a3b8" }}>{isEn ? "Loading..." : "Đang tải dữ liệu..."}</span>
            </div>
          )}
        </div>
      </div>
    </ErpPageContainer>
  );
}
