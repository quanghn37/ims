import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { Form, message } from "antd";
import type { FormInstance } from "antd";
import dayjs from "dayjs";
import {
  parseDateSafe,
  PriceListItem,
  ContractMaterialItem,
  TreeRowItem,
  UpsertMatequipSubmissionParams,
} from "../types";
import { extractApiList } from "@/lib/api-client";
import { contractsApi } from "../api";

export function useContractMaterialsAndPriceLists(
  open: boolean,
  editingContract: any | null,
  form: FormInstance
) {
  const [isPriceListSectionExpanded, setIsPriceListSectionExpanded] = useState(true);
  const [assignedPriceLists, setAssignedPriceLists] = useState<PriceListItem[]>([]);
  const [availablePriceLists, setAvailablePriceLists] = useState<PriceListItem[]>([]);
  const [loadingAvailable, setLoadingAvailable] = useState(false);
  const [searchAssigned, setSearchAssigned] = useState("");
  const [searchAvailable, setSearchAvailable] = useState("");
  const [viewingPriceList, setViewingPriceList] = useState<PriceListItem | null>(null);
  const [materialItems, setMaterialItems] = useState<ContractMaterialItem[]>([]);
  const [loadingMaterials, setLoadingMaterials] = useState(false);

  const formClientId = Form.useWatch("ClientId", form);
  const formMainContractId = Form.useWatch("MainContractId", form);

  const effectiveClientId = formClientId ?? editingContract?.ClientID ?? editingContract?.ClientId;
  const effectiveSubconOf =
    formMainContractId ??
    (editingContract as any)?.SubconOf ??
    editingContract?.MainContractId ??
    (editingContract as any)?.MainId;
  const effectiveContractId = editingContract?.ContractId ? Number(editingContract.ContractId) : "";

  const assignedPriceListsRef = useRef(assignedPriceLists);
  useEffect(() => {
    assignedPriceListsRef.current = assignedPriceLists;
  }, [assignedPriceLists]);

  const fetchMaterialsForContract = useCallback(
    async (contractId?: number, priceLists: PriceListItem[] = []) => {
      setLoadingMaterials(true);
      try {
        let items: any[] = [];
        // 1. Lấy danh sách chi tiết vật tư của Hợp đồng từ api/get-matequipsubmission
        if (contractId) {
          try {
            const res = await contractsApi.getMatequipSubmissions({
              ContractId: Number(contractId),
              WSId: "",
              PageNum: 1,
              PageSize: 1000,
            });

            const list = extractApiList(res);
            if (list.length > 0) {
              items = list.map((it: any, idx: number) => {
                const matchedPl = priceLists.find(
                  (pl) => String(pl.id) === String(it.PriceListId || it.SourceId)
                );
                const subId = it.SubmissionId ?? it.submissionId ?? it.SubmissionID ?? it.LocalId ?? idx;
                return {
                  ...it,
                  SubmissionId: subId,
                  id: subId,
                  uniqueKey: `sub_${subId}`,
                  MaterialId: it.MaterialId ?? it.ItemId,
                  ItemId: it.ItemId ?? it.MaterialId,
                  ItemName: it.Description || it.ItemName || "",
                  Description: it.Description || it.ItemName || "",
                  SystemCode: it.SystemCode || it.ItemCode || "",
                  ItemCode: it.ItemCode || it.SystemCode || "",
                  Unit: it.Unit || "Cái",
                  Qnty: Number(it.Qnty ?? 0),
                  UnitPrice: Number(it.UnitPrice ?? 0),
                  Amount: Number(it.Amount ?? Number(it.UnitPrice || 0) * Number(it.Qnty || 0)),
                  TaxRate: Number(it.TaxRate ?? 0),
                  TaxAmount: it.TaxAmount !== undefined ? Number(it.TaxAmount) : undefined,
                  QuotationCode:
                    it.QuotationCode ||
                    it.PriceListCode ||
                    (matchedPl ? matchedPl.code : priceLists.length === 1 ? priceLists[0].code : ""),
                  PriceListCode:
                    it.QuotationCode ||
                    it.PriceListCode ||
                    (matchedPl ? matchedPl.code : priceLists.length === 1 ? priceLists[0].code : ""),
                  PriceListName:
                    it.PriceListName ||
                    (matchedPl ? matchedPl.name : priceLists.length === 1 ? priceLists[0].name : ""),
                };
              });
            }
          } catch (err) {
            console.error("Lỗi khi tải chi tiết vật tư hợp đồng từ api/get-matequipsubmission:", err);
          }
        }

        // 2. Nếu hợp đồng chưa có submission trực tiếp, fallback lấy từ các bảng giá nguồn đã gán (nếu có)
        if (items.length === 0 && priceLists.length > 0) {
          const results = await Promise.all(
            priceLists.map(async (pl) => {
              try {
                const res = await contractsApi.getSubmissions({
                  ContractType: "quotation",
                  ContractId: Number(pl.id),
                  Stage: "plan",
                  FromDate: "2020-01-01",
                  ToDate: "2030-12-31",
                  LocalId: "",
                  Keyword: "",
                  PageNum: 1,
                  PageSize: 500,
                });
                const list = extractApiList(res);
                return list.map((it: any, idx: number) => ({
                  ...it,
                  id: it.SubmissionId || it.LocalId || `${pl.id}_${it.ItemId || idx}`,
                  uniqueKey: `${pl.id}_${it.SubmissionId || it.LocalId || it.ItemId || idx}`,
                  PriceListId: pl.id,
                  PriceListCode: pl.code,
                  QuotationCode: pl.code,
                  PriceListName: pl.name,
                  MaterialId: it.MaterialId ?? it.ItemId,
                  ItemId: it.ItemId ?? it.MaterialId,
                  ItemName: it.Description || it.ItemName || "",
                  Description: it.Description || it.ItemName || "",
                  SystemCode: it.SystemCode || it.ItemCode || "",
                  ItemCode: it.ItemCode || it.SystemCode || "",
                  Unit: it.Unit || "Cái",
                  Qnty: Number(it.Qnty ?? 0),
                  UnitPrice: Number(it.UnitPrice ?? 0),
                  Amount: Number(it.Amount ?? Number(it.UnitPrice || 0) * Number(it.Qnty || 0)),
                  TaxRate: Number(it.TaxRate ?? 0),
                  TaxAmount: it.TaxAmount !== undefined ? Number(it.TaxAmount) : undefined,
                }));
              } catch (err) {
                console.error(`Lỗi khi tải chi tiết vật tư bảng giá ${pl.code}:`, err);
                return [];
              }
            })
          );
          items = results.flat();
        }

        setMaterialItems(items);
      } catch (err) {
        console.error("Lỗi khi tải chi tiết vật tư hợp đồng:", err);
      } finally {
        setLoadingMaterials(false);
      }
    },
    []
  );

  useEffect(() => {
    if (!open) {
      setAssignedPriceLists([]);
      setAvailablePriceLists([]);
      setSearchAssigned("");
      setSearchAvailable("");
      setMaterialItems([]);
      return;
    }

    const cId = editingContract?.ContractId ? Number(editingContract.ContractId) : undefined;
    if (cId) {
      fetchMaterialsForContract(cId);
    } else {
      const sourceId = editingContract?.SourceId ? Number(editingContract.SourceId) : undefined;
      if (sourceId) {
        const qCode = (editingContract as any).QuotationCode;
        const initialAssigned: PriceListItem = {
          id: sourceId,
          code: qCode || `#${sourceId}`,
          name: editingContract.Description || "",
          raw: editingContract,
        };
        setAssignedPriceLists([initialAssigned]);
        fetchMaterialsForContract(undefined, [initialAssigned]);
      } else {
        setAssignedPriceLists([]);
        setMaterialItems([]);
      }
    }
  }, [open, editingContract, fetchMaterialsForContract]);

  useEffect(() => {
    if (assignedPriceLists.length > 0) {
      const assignedIds = new Set(assignedPriceLists.map((a) => String(a.id)));
      setAvailablePriceLists((prev) => prev.filter((item) => !assignedIds.has(String(item.id))));
    }
  }, [assignedPriceLists]);

  const fetchAvailableQuotations = useCallback(async (cId?: any, sOf?: any, _contractId?: any) => {
    if (!cId || !sOf) {
      setAvailablePriceLists([]);
      return;
    }
    setLoadingAvailable(true);
    try {
      const res = await contractsApi.getQuotations({
        DisplayMode: "quotation_for_contract",
        ClientId: !isNaN(Number(cId)) ? Number(cId) : cId,
        SubconOf: !isNaN(Number(sOf)) ? Number(sOf) : sOf,
        WSId: "",
        PageNum: 1,
        PageSize: 50,
      });
      const list = extractApiList(res);
      const distinctMap = new Map<string, PriceListItem>();
      list.forEach((item: any) => {
        const code = item.ContractCode || (item.ContractId ? `#${item.ContractId}` : "");
        if (code && !distinctMap.has(code)) {
          distinctMap.set(code, {
            id: code,
            code: code,
            name: item.ContractName || item.Description || "",
            signDate: item.ItemDate || item.Contractdate || item.ContractDate || item.SignDate || "",
            supplierName: item.Venname || item.ClientName || "",
            amount: item.TotalAmount || item.Amount,
            status: item.Status || item.Stage || "",
            raw: item,
          });
        }
      });
      const mapped: PriceListItem[] = Array.from(distinctMap.values());

      setAssignedPriceLists((prevAssigned) =>
        prevAssigned.map((assigned) => {
          const match = mapped.find(
            (m) => String(m.id) === String(assigned.id) || String(m.code) === String(assigned.code)
          );
          return match ? { ...assigned, ...match } : assigned;
        })
      );

      const assignedIds = new Set(assignedPriceListsRef.current.map((a) => String(a.id)));
      setAvailablePriceLists(mapped.filter((item) => !assignedIds.has(String(item.id))));
    } catch (err: any) {
      console.error("Lỗi tải bảng giá chưa chọn:", err);
      message.error("Không thể tải danh sách bảng giá khả dụng.");
    } finally {
      setLoadingAvailable(false);
    }
  }, []);

  useEffect(() => {
    if (!effectiveClientId || !effectiveSubconOf) {
      setAvailablePriceLists([]);
    }
  }, [effectiveClientId, effectiveSubconOf]);

  const filteredAssignedPriceLists = useMemo(() => {
    if (!searchAssigned.trim()) return assignedPriceLists;
    const q = searchAssigned.toLowerCase();
    return assignedPriceLists.filter(
      (item) => item.name.toLowerCase().includes(q) || item.code.toLowerCase().includes(q)
    );
  }, [assignedPriceLists, searchAssigned]);

  const filteredAvailablePriceLists = useMemo(() => {
    if (!searchAvailable.trim()) return availablePriceLists;
    const q = searchAvailable.toLowerCase();
    return availablePriceLists.filter(
      (item) => item.name.toLowerCase().includes(q) || item.code.toLowerCase().includes(q)
    );
  }, [availablePriceLists, searchAvailable]);

  const handleReconcileItems = async (selectedItems: TreeRowItem[], selectedPriceLists: PriceListItem[]) => {
    if (!selectedItems || selectedItems.length === 0) return;
    const cId = editingContract?.ContractId ? Number(editingContract.ContractId) : undefined;
    if (!cId) {
      message.warning("Vui lòng lưu thông tin hợp đồng trước khi đối chiếu bảng giá.");
      return;
    }

    try {
      // 1. Gán các bảng giá cha vào hợp đồng nếu chưa có
      const currentAssignedIds = new Set(assignedPriceLists.map((a) => String(a.id)));
      const newParentLists = selectedPriceLists.filter((pl) => !currentAssignedIds.has(String(pl.id)));
      const newParentIds = newParentLists.map((pl) => Number(pl.id));

      if (newParentIds.length > 0) {
        try {
          await contractsApi.updateQuotationInfo(
            {
              ContractId: cId,
              PriceListIds: newParentIds,
              WSId: "",
            },
            "add_pricelist"
          );
        } catch (err: any) {
          console.error("Lỗi khi gán bảng giá vào hợp đồng:", err);
        }
      }

      // 2. Tạo chi tiết vật tư vào database ngay qua api/upsert-matequipsubmission
      const submissionPromises = selectedItems.map(async (it) => {
        const raw = it.rawItem || {};
        const materialId = Number(it.MaterialId ?? it.ItemId ?? raw.MaterialId ?? raw.ItemId ?? 0);
        const itemDateVal = it.signDate || raw.ItemDate || raw.FromDate || raw.StartDate;
        let itemDateFormatted = "";
        if (itemDateVal) {
          const parsed = parseDateSafe(itemDateVal);
          itemDateFormatted = parsed
            ? parsed.format("YYYY-MM-DD")
            : dayjs(itemDateVal).isValid()
              ? dayjs(itemDateVal).format("YYYY-MM-DD")
              : String(itemDateVal);
        } else {
          itemDateFormatted = dayjs().format("YYYY-MM-DD");
        }

        const endDateVal = it.EndDate || raw.EndDate || raw.Enddate || raw.ToDate;
        let endDateFormatted = "";
        if (endDateVal && String(endDateVal).trim() && !String(endDateVal).startsWith("1900")) {
          const parsedEnd = parseDateSafe(endDateVal);
          endDateFormatted = parsedEnd
            ? parsedEnd.format("YYYY-MM-DD")
            : dayjs(endDateVal).isValid()
              ? dayjs(endDateVal).format("YYYY-MM-DD")
              : "";
        }

        const rawTax =
          it.TaxRate !== undefined
            ? Number(it.TaxRate)
            : raw.TaxRate !== undefined
              ? Number(raw.TaxRate)
              : 0.08;
        const taxRate = isNaN(rawTax) ? 0.08 : rawTax > 1 ? rawTax / 100 : rawTax;

        const remarks =
          it.Remarks ||
          raw.Remarks ||
          (editingContract?.Description
            ? `Vật tư ${editingContract.Description}`
            : "Vật tư Hợp đồng NCC đợt 1");

        const rawSourceId = it.SubmissionId ?? raw.SubmissionId ?? it.SourceId ?? raw.SourceId;
        const sourceId =
          rawSourceId !== undefined && rawSourceId !== null && rawSourceId !== "" && !isNaN(Number(rawSourceId))
            ? Number(rawSourceId)
            : rawSourceId;

        const payload: any = {
          UpdateMode: "Create_MatequipSubmission",
          ContractId: cId,
          MaterialId: materialId,
          ...(sourceId !== undefined && sourceId !== null && { SourceId: sourceId }),
          Qnty: Number(it.ContractQnty ?? (Number(it.Qnty) > 0 ? it.Qnty : 1)),
          UnitPrice: Number(it.UnitPrice ?? raw.UnitPrice ?? 0),
          TaxRate: taxRate,
          ItemDate: itemDateFormatted,
          EndDate: endDateFormatted,
          Remarks: remarks,
          WSId: "",
        };

        return contractsApi.upsertMatequipSubmission(payload, "Create_MatequipSubmission");
      });

      const results = await Promise.allSettled(submissionPromises);
      const fulfilledResults = results.filter((r) => r.status === "fulfilled") as PromiseFulfilledResult<any>[];
      const failedCount = results.filter((r) => r.status === "rejected").length;

      if (fulfilledResults.length > 0) {
        message.success(`Đã đối chiếu thành công ${fulfilledResults.length} mặt hàng vào hợp đồng!`);
      }
      if (failedCount > 0) {
        message.warning(`Có ${failedCount} mặt hàng lưu không thành công.`);
      }

      const updatedAssigned = [...assignedPriceLists, ...newParentLists];
      setAssignedPriceLists(updatedAssigned);
      if (updatedAssigned.length > 0) {
        form.setFieldsValue({ SourceId: Number(updatedAssigned[0].id) });
      }

      // 3. Tải lại danh sách mặt hàng của hợp đồng từ database
      await fetchMaterialsForContract(cId, updatedAssigned);

      // Cập nhật lại danh sách bảng giá khả dụng
      if (effectiveClientId && effectiveSubconOf) {
        fetchAvailableQuotations(effectiveClientId, effectiveSubconOf, cId);
      }
    } catch (err: any) {
      console.error("Lỗi khi đối chiếu mặt hàng:", err);
      message.error(err.message || "Đối chiếu mặt hàng thất bại.");
    }
  };

  const handleDeleteMaterialItem = async (record: ContractMaterialItem) => {
    const rawSubId =
      record.SubmissionId ??
      (record as any).submissionId ??
      (record as any).SubmissionID ??
      record.LocalId ??
      record.id;

    if (!rawSubId) {
      message.warning("Không tìm thấy SubmissionId của mặt hàng để xóa!");
      return;
    }

    const subIdNum = Number(rawSubId);
    if (isNaN(subIdNum)) {
      setMaterialItems((prev) =>
        prev.filter((it) => it.uniqueKey !== record.uniqueKey && it.id !== record.id)
      );
      message.success("Đã xóa dòng khỏi danh sách!");
      return;
    }

    try {
      const res: any = await contractsApi.deleteMatequipSubmission(subIdNum);

      const successMsg =
        (Array.isArray(res) ? res[0]?.Message : res?.Message) ||
        "Xóa dòng chi tiết hợp đồng thành công!";
      message.success(successMsg);

      setMaterialItems((prev) =>
        prev.filter(
          (it) =>
            it.uniqueKey !== record.uniqueKey &&
            it.id !== record.id &&
            String(it.SubmissionId ?? (it as any).submissionId ?? it.LocalId ?? it.id) !== String(rawSubId)
        )
      );

      const cId = editingContract?.ContractId ? Number(editingContract.ContractId) : undefined;
      if (cId) {
        fetchMaterialsForContract(cId, assignedPriceLists);
      }
    } catch (err: any) {
      console.error("Lỗi xóa mặt hàng:", err);
      message.error(err.message || "Xóa mặt hàng thất bại.");
    }
  };

  const handleUpdateMaterialItem = async (payload: UpsertMatequipSubmissionParams) => {
    try {
      const res: any = await contractsApi.upsertMatequipSubmission(
        payload,
        "Update_MatequipSubmission"
      );

      message.success(res?.Message || "Cập nhật chi tiết hợp đồng thành công");

      setMaterialItems((prev) =>
        prev.map((it) => {
          if (String(it.SubmissionId ?? it.LocalId ?? it.id) === String(payload.SubmissionId)) {
            const newQnty = Number(payload.Qnty);
            const newPrice = Number(payload.UnitPrice);
            const newTax = Number(payload.TaxRate);
            const newAmount = newQnty * newPrice;
            const newTaxAmount = newAmount * newTax;
            return {
              ...it,
              Qnty: newQnty,
              UnitPrice: newPrice,
              TaxRate: newTax,
              Amount: newAmount,
              TaxAmount: newTaxAmount,
              ItemDate: payload.ItemDate,
              EndDate: payload.EndDate,
              Remarks: payload.Remarks,
            };
          }
          return it;
        })
      );

      const cId = editingContract?.ContractId ? Number(editingContract.ContractId) : undefined;
      if (cId) {
        await fetchMaterialsForContract(cId, assignedPriceLists);
      }
      return true;
    } catch (err: any) {
      console.error("Lỗi khi cập nhật chi tiết hợp đồng:", err);
      message.error(err.message || "Cập nhật chi tiết hợp đồng thất bại");
      return false;
    }
  };

  const handleRemoveSingleFromContract = async (itemToRemove: PriceListItem) => {
    const removedId = Number(itemToRemove.id);
    const cId = editingContract?.ContractId ? Number(editingContract.ContractId) : undefined;

    if (cId) {
      try {
        await contractsApi.updateQuotationInfo(
          {
            ContractId: cId,
            PriceListIds: [removedId],
            WSId: "",
          },
          "remove_pricelist"
        );
      } catch (err: any) {
        console.error("Lỗi khi bỏ bảng giá khỏi hợp đồng:", err);
        message.error(err.message || "Không thể xóa bảng giá khỏi hợp đồng.");
        return;
      }
    }

    const remaining = assignedPriceLists.filter((item) => item.id !== itemToRemove.id);
    setAvailablePriceLists((prev) => [itemToRemove, ...prev]);
    setAssignedPriceLists(remaining);
    form.setFieldsValue({ SourceId: remaining.length > 0 ? Number(remaining[0].id) : undefined });
    await fetchMaterialsForContract(cId, remaining);
    message.info(`Đã bỏ đối chiếu bảng giá ${itemToRemove.code || itemToRemove.name}!`);
  };

  const handleRefreshMaterials = async () => {
    const cId = editingContract?.ContractId ? Number(editingContract.ContractId) : undefined;
    if (cId) {
      await fetchMaterialsForContract(cId, assignedPriceLists);
      message.success("Đã làm mới danh sách chi tiết vật tư");
    } else {
      message.info("Hợp đồng chưa được lưu trên hệ thống");
    }
  };

  return {
    isPriceListSectionExpanded,
    setIsPriceListSectionExpanded,
    assignedPriceLists,
    availablePriceLists,
    loadingAvailable,
    searchAssigned,
    setSearchAssigned,
    filteredAssignedPriceLists,
    filteredAvailablePriceLists,
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
  };
}
