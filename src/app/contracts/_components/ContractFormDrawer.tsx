"use client";

import React, { useState, useEffect } from "react";
import {
  Form,
  Button,
  Select,
  DatePicker,
  Input,
  InputNumber,
  Space,
  Typography,
  Row,
  Col,
  Checkbox,
  Divider,
  message,
  Popconfirm,
} from "antd";
import type { FormInstance } from "antd";
import {
  IconCircleX,
  IconX,
  IconPaperclip,
  IconDeviceFloppy,
  IconSend,
  IconGitBranch,
  IconTrash,
} from "@tabler/icons-react";
import { CaretDownOutlined } from "@ant-design/icons";
import { AttachmentFile, PriceListItem } from "../types";
import ContractPriceListsSection from "./ContractPriceListsSection";
import ContractAttachmentsModal from "./ContractAttachmentsModal";
import ContractWorkflowDrawer from "./ContractWorkflowDrawer";
import { useContractMaterialsAndPriceLists } from "../_hooks/useContractMaterialsAndPriceLists";
import { useTranslation } from "@/locales/LanguageContext";
import { contractsApi } from "../api";
import { extractApiList } from "@/lib/api-client";
import { ApprovalBadge } from "@/components/common/ApprovalBadge";

const { Text } = Typography;

export type { PriceListItem };

interface ContractFormDrawerProps {
  open: boolean;
  onClose: () => void;
  editingContract?: any | null;
  form: FormInstance;
  submitting: boolean;
  selectedClientDisplay: string;
  onOpenClientLov: () => void;
  onClearClient: () => void;
  selectedMainContractDisplay: string;
  onOpenMainContractLov: () => void;
  onClearMainContract: () => void;
  attachments: AttachmentFile[];
  selectedAttachmentKeys: React.Key[];
  setSelectedAttachmentKeys: (keys: React.Key[]) => void;
  onUploadAttachment: (options: any) => void;
  onDeleteAttachment: (id: string) => void;
  onBatchDeleteAttachments: () => void;
  onToggleClientDoc: (id: string, checked: boolean) => void;
  onFinish: (values: any) => void;
  onRefreshContracts?: () => void;
  onUpdateEditingContract?: (updated: any) => void;
}

export default function ContractFormDrawer({
  open,
  onClose,
  editingContract,
  form,
  submitting,
  selectedClientDisplay,
  onOpenClientLov,
  onClearClient,
  selectedMainContractDisplay,
  onOpenMainContractLov,
  onClearMainContract,
  attachments,
  selectedAttachmentKeys,
  setSelectedAttachmentKeys,
  onUploadAttachment,
  onDeleteAttachment,
  onBatchDeleteAttachments,
  onToggleClientDoc,
  onFinish,
  onRefreshContracts,
  onUpdateEditingContract,
}: ContractFormDrawerProps) {
  const { t } = useTranslation();
  const [isAttachmentModalOpen, setIsAttachmentModalOpen] = useState(false);
  const [submittingApproval, setSubmittingApproval] = useState(false);
  const [isWorkflowDrawerOpen, setIsWorkflowDrawerOpen] = useState(false);
  const [workflowData, setWorkflowData] = useState<any[]>([]);
  const [loadingWorkflow, setLoadingWorkflow] = useState(false);
  const [currentStatusCode, setCurrentStatusCode] = useState<number | string | null>(null);
  const [currentStatusName, setCurrentStatusName] = useState<string | null>(null);

  useEffect(() => {
    setCurrentStatusCode(editingContract?.StatusCode ?? null);
    setCurrentStatusName(editingContract?.StatusName ?? null);
  }, [editingContract]);

  const isEditing = Boolean(editingContract);
  const rawContractId =
    editingContract?.ContractId ??
    editingContract?.ContractID ??
    editingContract?.Id ??
    editingContract?.ID ??
    form.getFieldValue("ContractId");
  const hasContractId = Boolean(rawContractId);

  const activeStatusCode = currentStatusCode ?? editingContract?.StatusCode;
  const isDraft =
    activeStatusCode !== undefined && activeStatusCode !== null && String(activeStatusCode).trim() !== ""
      ? Number(activeStatusCode) === 0
      : (
          String(currentStatusName ?? editingContract?.StatusName ?? "").toLowerCase().includes("draft") ||
          String(currentStatusName ?? editingContract?.StatusName ?? "").toLowerCase().includes("nháp") ||
          !isEditing
        );

  // StatusCode === 0 là bản nháp -> hiển thị nút "Trình duyệt" (!isTaskAssigned)
  // StatusCode !== 0 là đã trình duyệt/đang duyệt/đã duyệt -> hiển thị nút "Xem quy trình duyệt" (isTaskAssigned)
  const isTaskAssigned = isEditing && !isDraft;

  const handleSubmitApproval = async () => {
    const rawContractId =
      editingContract?.ContractId ??
      editingContract?.ContractID ??
      editingContract?.Id ??
      editingContract?.ID ??
      form.getFieldValue("ContractId");

    const contractId = rawContractId && !isNaN(Number(rawContractId)) ? Number(rawContractId) : rawContractId;

    if (!contractId) {
      message.error("Không tìm thấy thông tin mã hợp đồng để trình duyệt.");
      return;
    }

    try {
      setSubmittingApproval(true);
      const res: any = await contractsApi.submitContractApproval(contractId);
      message.success(res?.Message || res?.message || t.contract.submitApprovalSuccess);
      setCurrentStatusCode(2);
      setCurrentStatusName("Chờ duyệt");
      if (editingContract) {
        editingContract.StatusCode = 2;
        editingContract.StatusName = "Chờ duyệt";
        editingContract.TaskAssign = "Y";
      }

      // Tự động refetch dữ liệu hợp đồng mới nhất để cập nhật lại Giá trị hợp đồng (Amount)
      const directAmount =
        res?.Data?.Amount ??
        res?.Data?.[0]?.Amount ??
        res?.Amount ??
        res?.ContractedAmount;

      try {
        const updatedData = await contractsApi.getContracts(
          {
            DisplayMode: "mat_equip",
            ContractId: contractId,
          },
          { skipCache: true }
        );
        const list = extractApiList(updatedData);
        const updatedContract =
          list.find((c: any) => Number(c.ContractId) === Number(contractId)) ||
          list[0];

        if (updatedContract) {
          const newAmount = Number(
            updatedContract.Amount ??
            updatedContract.ContractedAmount ??
            directAmount ??
            0
          );
          form.setFieldsValue({ Amount: newAmount });
          if (updatedContract.StatusCode !== undefined && updatedContract.StatusCode !== null) {
            setCurrentStatusCode(updatedContract.StatusCode);
          }
          if (updatedContract.StatusName) {
            setCurrentStatusName(updatedContract.StatusName);
          }
          if (editingContract) {
            editingContract.Amount = newAmount;
            editingContract.ContractedAmount = newAmount;
            if (updatedContract.StatusCode !== undefined && updatedContract.StatusCode !== null) {
              editingContract.StatusCode = updatedContract.StatusCode;
            }
            if (updatedContract.StatusName) {
              editingContract.StatusName = updatedContract.StatusName;
            }
            editingContract.TaskAssign = "Y";
          }
        } else if (directAmount !== undefined && directAmount !== null) {
          const newAmount = Number(directAmount);
          form.setFieldsValue({ Amount: newAmount });
          if (editingContract) {
            editingContract.Amount = newAmount;
            editingContract.ContractedAmount = newAmount;
          }
        }
      } catch (errFetch) {
        if (directAmount !== undefined && directAmount !== null) {
          const newAmount = Number(directAmount);
          form.setFieldsValue({ Amount: newAmount });
          if (editingContract) {
            editingContract.Amount = newAmount;
            editingContract.ContractedAmount = newAmount;
          }
        }
      }

      // Đồng bộ làm mới danh sách hợp đồng bên ngoài
      onRefreshContracts?.();
    } catch (err: any) {
      const errMsg = err?.message || err?.Message || "Trình duyệt hợp đồng không thành công.";
      message.warning(errMsg);
    } finally {
      setSubmittingApproval(false);
    }
  };

  const [deletingContract, setDeletingContract] = useState(false);

  const handleDeleteCurrentContract = async () => {
    const rawContractId =
      editingContract?.ContractId ??
      editingContract?.ContractID ??
      editingContract?.Id ??
      editingContract?.ID ??
      form.getFieldValue("ContractId");

    const contractId = rawContractId && !isNaN(Number(rawContractId)) ? Number(rawContractId) : rawContractId;

    if (!contractId) {
      message.error("Không tìm thấy thông tin mã hợp đồng để xóa.");
      return;
    }

    setDeletingContract(true);
    try {
      await contractsApi.updateContractInfo(
        {
          ContractId: String(contractId),
          ContractType: "mat_equip",
          WSId: "",
        },
        "delete_contract"
      );
      message.success("Đã xóa hợp đồng thành công!");
      try {
        localStorage.setItem("consims_contract_updated", String(Date.now()));
      } catch (e) {}

      onRefreshContracts?.();

      if (typeof window !== "undefined") {
        if (window.opener) {
          window.close();
        } else {
          window.location.href = "/contracts";
        }
      }
    } catch (e: any) {
      message.error(e?.message || "Xóa hợp đồng thất bại.");
    } finally {
      setDeletingContract(false);
    }
  };

  const refreshWorkflowAndContractData = async () => {
    const rawContractId =
      editingContract?.ContractId ??
      editingContract?.ContractID ??
      editingContract?.Id ??
      editingContract?.ID ??
      form.getFieldValue("ContractId");

    const contractId = rawContractId && !isNaN(Number(rawContractId)) ? Number(rawContractId) : rawContractId;

    if (!contractId) {
      message.error("Không tìm thấy thông tin mã hợp đồng để tải quy trình duyệt.");
      return;
    }

    setLoadingWorkflow(true);
    try {
      // Gọi song song cả API trạng thái quy trình RACI và API thông tin hợp đồng mới nhất (skipCache: true)
      const [resWorkflow, updatedData]: [any, any] = await Promise.all([
        contractsApi.getContractStatus({ ContractId: contractId }).catch((err) => {
          console.error("Lỗi tải quy trình duyệt hợp đồng:", err);
          return null;
        }),
        contractsApi.getContracts(
          {
            DisplayMode: "mat_equip",
            ContractId: contractId,
          },
          { skipCache: true }
        ).catch((err) => {
          console.error("Lỗi tải thông tin trạng thái hợp đồng mới nhất:", err);
          return null;
        }),
      ]);

      if (resWorkflow) {
        const list = extractApiList(resWorkflow) || resWorkflow?.Data || resWorkflow?.data || [];
        setWorkflowData(Array.isArray(list) ? list : []);
      }

      if (updatedData) {
        const list = extractApiList(updatedData);
        const updatedContract =
          list.find((c: any) => Number(c.ContractId) === Number(contractId)) ||
          list[0];

        if (updatedContract) {
          if (updatedContract.StatusCode !== undefined && updatedContract.StatusCode !== null) {
            setCurrentStatusCode(updatedContract.StatusCode);
          }
          if (updatedContract.StatusName) {
            setCurrentStatusName(updatedContract.StatusName);
          }
          if (editingContract) {
            if (updatedContract.StatusCode !== undefined && updatedContract.StatusCode !== null) {
              editingContract.StatusCode = updatedContract.StatusCode;
            }
            if (updatedContract.StatusName) {
              editingContract.StatusName = updatedContract.StatusName;
            }
            if (updatedContract.Status !== undefined) {
              editingContract.Status = updatedContract.Status;
            }
            if (updatedContract.CurrentAssignee !== undefined) {
              editingContract.CurrentAssignee = updatedContract.CurrentAssignee;
            }
            if (updatedContract.Amount !== undefined && updatedContract.Amount !== null) {
              const newAmount = Number(updatedContract.Amount);
              form.setFieldsValue({ Amount: newAmount });
              editingContract.Amount = newAmount;
              editingContract.ContractedAmount = newAmount;
            }
          }
          onUpdateEditingContract?.(updatedContract);
        }
      }

      // Tự động đồng bộ làm mới bảng danh sách bên ngoài
      onRefreshContracts?.();
    } catch (err: any) {
      console.error("Lỗi cập nhật quy trình duyệt và trạng thái hợp đồng:", err);
    } finally {
      setLoadingWorkflow(false);
    }
  };

  const handleOpenWorkflow = () => {
    setIsWorkflowDrawerOpen(true);
    refreshWorkflowAndContractData();
  };

  const {
    isPriceListSectionExpanded,
    setIsPriceListSectionExpanded,
    assignedPriceLists,
    availablePriceLists,
    loadingAvailable,
    searchAssigned,
    setSearchAssigned,
    filteredAssignedPriceLists,
    viewingPriceList,
    setViewingPriceList,
    materialItems,
    loadingMaterials,
    effectiveClientId,
    effectiveSubconOf,
    effectiveContractId,
    fetchAvailableQuotations,
    handleReconcileItems,
    handleDeleteMaterialItem,
    handleUpdateMaterialItem,
    handleRemoveSingleFromContract,
    handleRefreshMaterials,
  } = useContractMaterialsAndPriceLists(open, editingContract, form);

  // Tự động đồng bộ Contract Value (Amount) bằng tổng thành tiền có VAT của chi tiết vật tư khi chưa trình duyệt
  useEffect(() => {
    if (!open || isTaskAssigned) return;
    if (materialItems && materialItems.length > 0) {
      const sumTotalVat = materialItems.reduce((acc, it) => {
        const q = Number(it.Qnty ?? 0);
        const p = Number(it.UnitPrice ?? 0);
        const amt = Number(it.Amount ?? q * p);
        const rawTaxRate = Number(it.TaxRate) || 0;
        const normalizedTaxRate = rawTaxRate > 1 ? rawTaxRate / 100 : rawTaxRate;
        const taxVal =
          it.TaxAmount !== undefined && it.TaxAmount !== null
            ? Number(it.TaxAmount)
            : amt * normalizedTaxRate;
        return acc + amt + taxVal;
      }, 0);

      const roundedTotal = Math.round(sumTotalVat);
      const currentFormAmount = form.getFieldValue("Amount");
      if (currentFormAmount !== roundedTotal) {
        form.setFieldsValue({ Amount: roundedTotal });
        if (editingContract) {
          editingContract.Amount = roundedTotal;
          editingContract.ContractedAmount = roundedTotal;
        }
      }
    }
  }, [materialItems, isTaskAssigned, open, form, editingContract]);

  const watchedPayTerms = Form.useWatch("PayTerms", form);
  const payTermsOptions = React.useMemo(() => {
    const base = [
      { value: "DK03", label: "DK03 - Thanh toán 100% sau 60 ngày" },
      { value: "DK01", label: "DK01 - Thanh toán ngay khi nhận hàng" },
      { value: "DK02", label: "DK02 - Thanh toán 100% sau 30 ngày" },
      { value: "TM", label: "TM - Tiền mặt" },
      { value: "CK", label: "CK - Chuyển khoản" },
      { value: "CN30", label: "CN30 - Công nợ 30 ngày" },
      { value: "CN60", label: "CN60 - Công nợ 60 ngày" },
      { value: "CN90", label: "CN90 - Công nợ 90 ngày" },
    ];
    if (watchedPayTerms && !base.some((b) => b.value === watchedPayTerms)) {
      base.unshift({ value: watchedPayTerms, label: watchedPayTerms });
    }
    return base;
  }, [watchedPayTerms]);

  if (!open) return null;

  return (
    <div
      style={{
        background: "#ffffff",
        padding: "12px 20px",
        minHeight: "100%",
        width: "100%",
        boxSizing: "border-box",
      }}
    >
      <Form
        form={form}
        layout="vertical"
        initialValues={{ IsVcontract: false }}
        onFinish={(values) => {
          onFinish({
            ...values,
            IsVcontract: values.IsVcontract ? 1 : 0,
          });
        }}
      >
        <Form.Item name="ClientId" style={{ display: "none" }}>
          <Input />
        </Form.Item>
        <Form.Item name="MainContractId" style={{ display: "none" }}>
          <Input />
        </Form.Item>
        <Form.Item name="ParentContractId" style={{ display: "none" }}>
          <Input />
        </Form.Item>
        <Form.Item name="SourceId" style={{ display: "none" }}>
          <Input />
        </Form.Item>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 8,
            paddingBottom: 6,
            borderBottom: "1px solid #dce5e6",
          }}
        >
          <Text strong style={{ fontSize: 13, color: "#008f89", fontWeight: 700, textTransform: "uppercase" }}>
            {t.section.generalInfo}
          </Text>

          <Space size={8}>
            {isEditing && (
              <>
                {!isTaskAssigned && (
                  <Popconfirm
                    title={t.contract.submitApprovalConfirm}
                    onConfirm={handleSubmitApproval}
                    okText={t.common.confirm}
                    cancelText={t.common.cancel}
                    okButtonProps={{ loading: submittingApproval }}
                  >
                    <Button
                      type="primary"
                      icon={<IconSend size={15} strokeWidth={1.8} />}
                      loading={submittingApproval}
                      style={{
                        background: "#008f89",
                        borderColor: "#008f89",
                        height: 32,
                        fontSize: 13,
                        fontWeight: 500,
                        borderRadius: 6,
                        color: "#FFFFFF",
                        boxShadow: "0 2px 4px rgba(0, 143, 137, 0.2)",
                      }}
                    >
                      {t.contract.submitApproval}
                    </Button>
                  </Popconfirm>
                )}

                {isTaskAssigned && (
                  <Button
                    icon={<IconGitBranch size={15} strokeWidth={1.8} style={{ color: "#008f89" }} />}
                    onClick={handleOpenWorkflow}
                    style={{
                      height: 32,
                      fontSize: 13,
                      fontWeight: 500,
                      borderRadius: 6,
                      borderColor: "#dce5e6",
                      background: "#FFFFFF",
                      color: "#334155",
                    }}
                  >
                    {t.contract.approvalWorkflow}
                  </Button>
                )}
              </>
            )}

            {hasContractId && (
              <Button
                icon={<IconPaperclip size={16} strokeWidth={1.8} style={{ color: "#008f89" }} />}
                onClick={() => setIsAttachmentModalOpen(true)}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  fontSize: 13,
                  fontWeight: 500,
                  height: 32,
                  borderRadius: 6,
                  borderColor: "#dce5e6",
                  background: "#FFFFFF",
                  color: "#334155",
                }}
              >
                {t.contract.attachments}
                {attachments.length > 0 && (
                  <span
                    style={{
                      background: "#dce5e6",
                      color: "#008f89",
                      borderRadius: 10,
                      padding: "1px 7px",
                      fontSize: 11,
                      fontWeight: 600,
                      marginLeft: 5,
                    }}
                  >
                    {attachments.length}
                  </span>
                )}
              </Button>
            )}
            <Button
              icon={<IconX size={15} strokeWidth={1.8} style={{ color: "#718894" }} />}
              onClick={onClose}
              style={{
                height: 32,
                fontSize: 13,
                fontWeight: 500,
                borderRadius: 6,
                borderColor: "#dce5e6",
                background: "#FFFFFF",
                color: "#334155",
              }}
            >
              {t.common.close}
            </Button>
            {/* Chỉ hiển thị button Xóa khi hợp đồng có StatusCode === 0 (Bản nháp) */}
            {isEditing && isDraft && (
              <Popconfirm
                title={t.contract.deleteContract}
                description={t.common.confirmDelete}
                onConfirm={handleDeleteCurrentContract}
                okText={t.common.delete}
                cancelText={t.common.cancel}
                okButtonProps={{ danger: true, loading: deletingContract }}
              >
                <Button
                  danger
                  icon={<IconTrash size={15} strokeWidth={1.8} />}
                  loading={deletingContract}
                  style={{
                    height: 32,
                    fontSize: 13,
                    fontWeight: 500,
                    borderRadius: 6,
                    display: "inline-flex",
                    alignItems: "center",
                  }}
                >
                  {t.common.delete}
                </Button>
              </Popconfirm>
            )}
            {!(isEditing && (assignedPriceLists.length > 0 || materialItems.length > 0)) && (
              <Button
                type="primary"
                icon={<IconDeviceFloppy size={16} strokeWidth={2} />}
                loading={submitting}
                onClick={() => form.submit()}
                style={{
                  background: "#008f89",
                  borderColor: "#008f89",
                  height: 32,
                  fontSize: 13,
                  fontWeight: 500,
                  borderRadius: 6,
                  color: "#FFFFFF",
                  boxShadow: "0 2px 4px rgba(0, 143, 137, 0.2)",
                }}
              >
                {isEditing ? t.contract.updateContract : t.contract.saveContract}
              </Button>
            )}
          </Space>
        </div>

        <div className="erp-general-info-card">
          {/* Hàng 1: 5 Cột */}
          <Row gutter={[0, 0]} align="middle">
            {/* Cột 1: HĐ chủ đầu tư */}
            <Col span={5} className="erp-info-cell">
              <span className="erp-info-label">
                {t.contract.mainContract} {!isEditing && <span style={{ color: "#ff4d4f" }}>*</span>}
              </span>
              <div
                onClick={!isEditing ? onOpenMainContractLov : undefined}
                className="erp-info-value mono"
                style={{
                  cursor: isEditing ? "default" : "pointer",
                  color: selectedMainContractDisplay ? "#1e293b" : "#94A3B8",
                  justifyContent: "space-between",
                }}
                title={selectedMainContractDisplay}
              >
                <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {selectedMainContractDisplay || t.contract.selectMainContract}
                </span>
                {!isEditing && selectedMainContractDisplay && (
                  <IconCircleX
                    size={14}
                    strokeWidth={1.8}
                    style={{ color: "#94A3B8", cursor: "pointer", marginLeft: 4 }}
                    onClick={(e) => {
                      e.stopPropagation();
                      onClearMainContract();
                    }}
                  />
                )}
              </div>
            </Col>

            {/* Cột 2: Đối tượng (NCC) */}
            <Col span={6} className="erp-info-cell">
              <span className="erp-info-label">
                {t.contract.vendor} {!isEditing && <span style={{ color: "#ff4d4f" }}>*</span>}
              </span>
              <div
                onClick={!isEditing ? onOpenClientLov : undefined}
                className="erp-info-value"
                style={{
                  cursor: isEditing ? "default" : "pointer",
                  color: selectedClientDisplay ? "#1e293b" : "#94A3B8",
                  justifyContent: "space-between",
                }}
                title={selectedClientDisplay}
              >
                <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {selectedClientDisplay || t.contract.selectVendor}
                </span>
                {!isEditing && selectedClientDisplay && (
                  <IconCircleX
                    size={14}
                    strokeWidth={1.8}
                    style={{ color: "#94A3B8", cursor: "pointer", marginLeft: 4 }}
                    onClick={(e) => {
                      e.stopPropagation();
                      onClearClient();
                    }}
                  />
                )}
              </div>
            </Col>

            {/* Cột 3: Số hợp đồng NCC */}
            <Col span={4} className="erp-info-cell">
              <span className="erp-info-label">
                {t.contract.code}
              </span>
              <Form.Item name="ContractCode" style={{ margin: 0 }}>
                <Input
                  variant="borderless"
                  disabled={isEditing}
                  placeholder={isEditing ? "" : "(Auto-generated)"}
                  style={{
                    padding: 0,
                    fontWeight: 400,
                    fontSize: 12.5,
                    lineHeight: "16px",
                    color: "#1e293b",
                    fontFamily: "monospace",
                  }}
                />
              </Form.Item>
            </Col>

            {/* Cột 4: PLHĐ của */}
            <Col span={3} className="erp-info-cell">
              <span className="erp-info-label">
                {t.contract.addendumOf}
              </span>
              <Form.Item name="ParentContractCode" style={{ margin: 0 }}>
                <Input
                  variant="borderless"
                  disabled={isEditing}
                  placeholder={isEditing ? "" : t.contract.originalContractPlaceholder}
                  allowClear={!isEditing}
                  style={{ padding: 0, fontWeight: 400, fontSize: 12.5, lineHeight: "16px", color: "#1e293b" }}
                  onChange={(e) => {
                    if (!isEditing && !e.target.value) {
                      form.setFieldsValue({ ParentContractId: undefined });
                    }
                  }}
                />
              </Form.Item>
            </Col>

            {/* Cột 5: Diễn giải hợp đồng */}
            <Col span={6} className="erp-info-cell">
              <span className="erp-info-label">
                {t.contract.description} <span style={{ color: "#ff4d4f" }}>*</span>
              </span>
              <Form.Item
                name="Description"
                style={{ margin: 0 }}
                rules={[{ required: true, message: t.contract.descriptionRequired }]}
              >
                <Input
                  variant="borderless"
                  placeholder={t.contract.descriptionPlaceholder}
                  style={{ padding: 0, fontWeight: 400, fontSize: 12.5, lineHeight: "16px", color: "#1e293b" }}
                />
              </Form.Item>
            </Col>
          </Row>

          <div className="erp-info-divider" />

          {/* Hàng 2: 9 Cột */}
          <Row gutter={[0, 0]} align="middle">
            {/* Cột 1: Ngày ký */}
            <Col span={3} className="erp-info-cell">
              <span className="erp-info-label">
                {t.contract.signDate}
              </span>
              <Form.Item name="SignDate" style={{ margin: 0 }}>
                <DatePicker
                  variant="borderless"
                  format="DD-MM-YYYY"
                  placeholder="DD-MM-YYYY"
                  style={{ padding: 0, width: "100%", fontWeight: 400, fontSize: 12.5, color: "#1e293b" }}
                />
              </Form.Item>
            </Col>

            {/* Cột 2: Ngày bắt đầu */}
            <Col span={2} className="erp-info-cell">
              <span className="erp-info-label">
                {t.contract.startDate}
              </span>
              <Form.Item name="FromDate" style={{ margin: 0 }}>
                <DatePicker
                  variant="borderless"
                  format="DD-MM-YYYY"
                  placeholder="DD-MM-YYYY"
                  style={{ padding: 0, width: "100%", fontWeight: 400, fontSize: 12.5, color: "#1e293b" }}
                />
              </Form.Item>
            </Col>

            {/* Cột 3: Ngày kết thúc */}
            <Col span={2} className="erp-info-cell">
              <span className="erp-info-label">
                {t.contract.endDate}
              </span>
              <Form.Item name="ToDate" style={{ margin: 0 }}>
                <DatePicker
                  variant="borderless"
                  format="DD-MM-YYYY"
                  placeholder="DD-MM-YYYY"
                  allowClear
                  style={{ padding: 0, width: "100%", fontWeight: 400, fontSize: 12.5, color: "#1e293b" }}
                />
              </Form.Item>
            </Col>

            {/* Cột 4: Điều khoản TT */}
            <Col span={4} className="erp-info-cell">
              <span className="erp-info-label">
                {t.contract.paymentTerm}
              </span>
              <Form.Item name="PayTerms" style={{ margin: 0 }}>
                <Select
                  variant="borderless"
                  showSearch
                  allowClear
                  suffixIcon={<CaretDownOutlined style={{ fontSize: 10, color: "#94a3b8" }} />}
                  placeholder={t.contract.selectPaymentTerm}
                  style={{ padding: 0, width: "100%", fontWeight: 400, fontSize: 12.5, color: "#1e293b" }}
                  options={payTermsOptions}
                />
              </Form.Item>
            </Col>

            {/* Cột 5: Giá trị hợp đồng */}
            <Col span={3} className="erp-info-cell">
              <span className="erp-info-label">
                {t.contract.amount}
              </span>
              <Form.Item name="Amount" style={{ margin: 0 }}>
                <InputNumber
                  variant="borderless"
                  className="erp-amount-input"
                  style={{ padding: 0, width: "100%", fontWeight: 700, fontSize: 12.5, color: "#008f89" }}
                  min={0}
                  placeholder="0"
                  formatter={(val) => String(val || "").replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
                  parser={(val) => Number(val ? val.replace(/\$\s?|(,*)/g, "") : 0) as any}
                />
              </Form.Item>
            </Col>

            {/* Cột 6: Loại tiền */}
            <Col span={2} className="erp-info-cell">
              <span className="erp-info-label">
                {t.contract.currency}
              </span>
              <Form.Item name="Currency" style={{ margin: 0 }}>
                <Select
                  variant="borderless"
                  suffixIcon={<CaretDownOutlined style={{ fontSize: 10, color: "#94a3b8" }} />}
                  style={{ padding: 0, width: "100%", fontWeight: 400, fontSize: 12.5, color: "#1e293b" }}
                  options={[
                    { value: "VND", label: "VND" },
                    { value: "USD", label: "USD" },
                  ]}
                />
              </Form.Item>
            </Col>

            {/* Cột 7: Loại HĐ */}
            <Col span={2} className="erp-info-cell">
              <span className="erp-info-label">
                {t.contract.contractCategory} <span style={{ color: "#ff4d4f" }}>*</span>
              </span>
              <Form.Item
                name="S_Type"
                style={{ margin: 0 }}
                rules={[{ required: true, message: t.contract.contractCategoryRequired }]}
              >
                <Select
                  variant="borderless"
                  allowClear
                  suffixIcon={<CaretDownOutlined style={{ fontSize: 10, color: "#94a3b8" }} />}
                  placeholder={t.contract.contractCategory}
                  style={{ padding: 0, width: "100%", fontWeight: 400, fontSize: 12.5, color: "#1e293b" }}
                  options={[
                    { value: "XD", label: "XD" },
                    { value: "MEP", label: "MEP" },
                  ]}
                />
              </Form.Item>
            </Col>

            {/* Cột 8: Trạng thái (đặt trước cột Type) */}
            <Col span={3} className="erp-info-cell">
              <span className="erp-info-label">
                {t.table.status}
              </span>
              <div style={{ display: "flex", alignItems: "center", height: 24, paddingLeft: 8 }}>
                <ApprovalBadge
                  val={currentStatusName ?? editingContract?.StatusName ?? editingContract?.Status ?? (isDraft ? "Draft" : "Chờ duyệt")}
                  record={editingContract}
                />
              </div>
            </Col>

            {/* Cột 9: E-Contract (Type) */}
            <Col span={3} className="erp-info-cell" style={{ borderRight: "none" }}>
              <span className="erp-info-label">
                {t.contract.contractType}
              </span>
              <Form.Item
                name="IsVcontract"
                valuePropName="checked"
                style={{ margin: 0, minHeight: 18, display: "flex", alignItems: "center" }}
              >
                <Checkbox>
                  <span style={{ color: "#008f89", fontSize: 12, fontWeight: 500 }}>
                    {t.contract.vcontract}
                  </span>
                </Checkbox>
              </Form.Item>
            </Col>
          </Row>
        </div>
      </Form>

      {/* SECTION II: CHI TIẾT VẬT TƯ */}
      <ContractPriceListsSection
        isPriceListSectionExpanded={isPriceListSectionExpanded}
        setIsPriceListSectionExpanded={setIsPriceListSectionExpanded}
        searchAssigned={searchAssigned}
        setSearchAssigned={setSearchAssigned}
        filteredAssignedPriceLists={filteredAssignedPriceLists}
        availablePriceLists={availablePriceLists}
        loadingAvailable={loadingAvailable}
        effectiveClientId={effectiveClientId}
        effectiveSubconOf={effectiveSubconOf}
        effectiveContractId={effectiveContractId}
        contractDescription={editingContract?.Description || form.getFieldValue("Description")}
        fetchAvailableQuotations={fetchAvailableQuotations}
        handleReconcileItems={handleReconcileItems}
        handleRemoveSingle={handleRemoveSingleFromContract}
        viewingPriceList={viewingPriceList}
        setViewingPriceList={setViewingPriceList}
        isEditing={isEditing}
        isTaskAssigned={isTaskAssigned}
        materialItems={materialItems}
        loadingMaterials={loadingMaterials}
        onDeleteMaterialItem={handleDeleteMaterialItem}
        onUpdateMaterialItem={handleUpdateMaterialItem}
        onRefreshMaterials={handleRefreshMaterials}
      />

      {/* POPUP MODAL TỆP ĐÍNH KÈM */}
      <ContractAttachmentsModal
        open={isAttachmentModalOpen}
        onCancel={() => setIsAttachmentModalOpen(false)}
        attachments={attachments}
        selectedAttachmentKeys={selectedAttachmentKeys}
        setSelectedAttachmentKeys={setSelectedAttachmentKeys}
        onUploadAttachment={onUploadAttachment}
        onDeleteAttachment={onDeleteAttachment}
        onBatchDeleteAttachments={onBatchDeleteAttachments}
        onToggleClientDoc={onToggleClientDoc}
      />

      {/* POPUP DRAWER QUY TRÌNH DUYỆT */}
      <ContractWorkflowDrawer
        open={isWorkflowDrawerOpen}
        onClose={() => {
          setIsWorkflowDrawerOpen(false);
          refreshWorkflowAndContractData();
        }}
        contract={editingContract}
        workflowData={workflowData}
        loading={loadingWorkflow}
        onRefresh={refreshWorkflowAndContractData}
      />
    </div>
  );
}