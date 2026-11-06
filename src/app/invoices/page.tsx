"use client";

import React, { useState, useEffect, useCallback } from "react";
import { message } from "antd";
import { IconFileText, IconScale } from "@tabler/icons-react";
import { ErpPageContainer, ErpDetailContainer } from "@/components/layout/ErpPageContainer";
import { useTranslation } from "@/locales/LanguageContext";
import IpcListTab from "./_components/IpcListTab";
import PaymentPrepTab from "./_components/PaymentPrepTab";
import IpcDetailDrawer from "./_components/IpcDetailDrawer";
import { invoicesApi } from "./api";
import { IpcRecord, PaymentPrepItem } from "./types";

export default function InvoicesPage() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<1 | 2>(1);
  const [loading, setLoading] = useState(true);

  const [ipcList, setIpcList] = useState<IpcRecord[]>([]);
  const [pendingItems, setPendingItems] = useState<PaymentPrepItem[]>([]);
  const [contracts, setContracts] = useState<any[]>([]);

  const [selectedIpc, setSelectedIpc] = useState<IpcRecord | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Load initial data
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [ipcs, contractData] = await Promise.all([
        invoicesApi.getIpcList(),
        invoicesApi.getContracts(),
      ]);
      setIpcList(ipcs);
      setContracts(contractData);

      const targetContractId = contractData[0]?.ContractId;
      if (targetContractId) {
        const items = await invoicesApi.getPendingReceiptItems(targetContractId);
        setPendingItems(items);
      } else {
        setPendingItems([]);
      }
    } catch (error) {
      console.error("Lỗi tải dữ liệu Hóa đơn / IPC:", error);
      message.error("Không thể tải danh sách hóa đơn/IPC");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Open detail drawer for an IPC
  const handleSelectIpc = (ipc: IpcRecord) => {
    setSelectedIpc(ipc);
    setDrawerOpen(true);
  };

  // Create a draft IPC from Tab 2
  const handleCreateDraftIpc = (newIpc: IpcRecord) => {
    const updatedList = [newIpc, ...ipcList];
    setIpcList(updatedList);
    invoicesApi.saveIpcList(updatedList);
    setSelectedIpc(newIpc);
    setDrawerOpen(true);
  };

  // Submit IPC for approval
  const handleSubmitApproval = (ipcId: string) => {
    const updatedList = ipcList.map((item) => {
      if (item.IpcId === ipcId) {
        return {
          ...item,
          Status: 2,
          StatusName: "Chờ duyệt",
          CurrentAssignee: "Nguyen Van C",
        };
      }
      return item;
    });
    setIpcList(updatedList);
    invoicesApi.saveIpcList(updatedList);
    if (selectedIpc && selectedIpc.IpcId === ipcId) {
      setSelectedIpc({
        ...selectedIpc,
        Status: 2,
        StatusName: "Chờ duyệt",
        CurrentAssignee: "Nguyen Van C",
      });
    }
    message.success(`Đã trình duyệt thành công hồ sơ ${ipcId}`);
  };

  if (drawerOpen && selectedIpc) {
    return (
      <ErpDetailContainer>
        <IpcDetailDrawer
          onClose={() => setDrawerOpen(false)}
          ipc={selectedIpc}
          onSubmitApproval={handleSubmitApproval}
          onRefresh={fetchData}
          contracts={contracts}
        />
      </ErpDetailContainer>
    );
  }

  return (
    <ErpPageContainer>
      <div style={{ display: "flex", flexDirection: "column", height: "100%", gap: 8 }}>
        {/* 2 Main Tabs Navigation */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            paddingBottom: 6,
            borderBottom: "1px solid #f1f5f9",
          }}
        >
          <button
            type="button"
            onClick={() => setActiveTab(1)}
            style={{
              padding: "6px 14px",
              borderRadius: 6,
              fontSize: 12.5,
              fontWeight: 700,
              cursor: "pointer",
              transition: "all 0.2s",
              border: activeTab === 1 ? "1.5px solid #008f89" : "1px solid #e2e8f0",
              backgroundColor: activeTab === 1 ? "#008f89" : "#ffffff",
              color: activeTab === 1 ? "#ffffff" : "#475569",
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            <IconFileText size={15} />
            <span>{t("invoices.tabs.ipcList")}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab(2)}
            style={{
              padding: "6px 14px",
              borderRadius: 6,
              fontSize: 12.5,
              fontWeight: 700,
              cursor: "pointer",
              transition: "all 0.2s",
              border: activeTab === 2 ? "1.5px solid #008f89" : "1px solid #e2e8f0",
              backgroundColor: activeTab === 2 ? "#008f89" : "#ffffff",
              color: activeTab === 2 ? "#ffffff" : "#475569",
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            <IconScale size={15} />
            <span>{t("invoices.tabs.pendingBilling")}</span>
          </button>
        </div>

        {/* Tab Contents */}
        <div style={{ flex: 1, minHeight: 0 }}>
          {activeTab === 1 ? (
            <IpcListTab
              ipcList={ipcList}
              loading={loading}
              onRefresh={fetchData}
              onSelectIpc={handleSelectIpc}
              onNavigateToTab2={() => setActiveTab(2)}
              contracts={contracts}
            />
          ) : (
            <PaymentPrepTab
              items={pendingItems}
              loading={loading}
              contracts={contracts}
              onCreateDraftIpc={handleCreateDraftIpc}
              ipcList={ipcList}
            />
          )}
        </div>
      </div>
    </ErpPageContainer>
  );
}
