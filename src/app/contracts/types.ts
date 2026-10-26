import type React from "react";
import type { Dayjs } from "dayjs";
import dayjs from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat";
import type { UpsertMatequipSubmissionParams } from "@/types/api";

dayjs.extend(customParseFormat);

export type { UpsertMatequipSubmissionParams };

export interface AttachmentFile {
  id: string;
  fileName: string;
  fileUrl: string;
  uploadedBy: string;
  uploadingDate: string;
  isClientDoc: boolean;
  hasSign?: boolean;
}

export interface PriceListItem {
  id: string | number;
  code: string;
  name: string;
  signDate?: string;
  status?: string;
  amount?: number;
  supplierName?: string;
  raw?: any;
}

export interface ContractMaterialItem {
  id: string | number;
  uniqueKey: string;
  SubmissionId?: number | string;
  LocalId?: number | string;
  ContractId?: number | string;
  ContractCode?: string;
  MaterialId?: number | string;
  ItemId?: number | string;
  ItemName?: string;
  Description?: string;
  SystemCode?: string;
  ItemCode?: string;
  Unit?: string;
  Qnty: number;
  UnitPrice: number;
  Amount: number;
  TaxRate: number;
  TaxAmount?: number;
  ItemDate?: string;
  signDate?: string;
  StartDate?: string;
  FromDate?: string;
  EndDate?: string;
  Enddate?: string;
  Remarks?: string;
  PriceListId?: string | number;
  PriceListCode?: string;
  QuotationCode?: string;
  SourceId?: string | number;
  PriceListName?: string;
  Editable?: number | boolean;
  CreatedBy?: number | string;
  CreatedDate?: string;
  raw?: any;
  rawItem?: any;
}

export interface TreeRowItem {
  key: React.Key;
  isParent: boolean;
  id: string | number;
  code?: string;
  name?: string;
  parentId?: string | number;
  parentCode?: string;
  parentName?: string;
  signDate?: string;
  amount?: number;
  itemCount?: number;
  MaterialId?: string | number;
  ItemId?: string | number;
  SubmissionId?: string | number;
  SourceId?: string | number;
  ItemName?: string;
  ItemCode?: string;
  Description?: string;
  Unit?: string;
  Qnty?: number;
  UnitPrice?: number;
  Amount?: number;
  TaxRate?: number;
  TaxAmount?: number;
  EndDate?: string;
  Remarks?: string;
  ContractQnty?: number;
  rawItem?: any;
  uniqueKey?: string;
  children?: TreeRowItem[];
}

export function parseDateSafe(dateStr?: string): Dayjs | null {
  if (!dateStr || dateStr === "01-01-1900" || dateStr === "1900-01-01" || dateStr === "") return null;
  const formats = ["DD-MM-YYYY", "DD/MM/YYYY", "YYYY-MM-DD", "YYYY/MM/DD"];
  for (const fmt of formats) {
    const d = dayjs(dateStr, fmt, true);
    if (d.isValid()) return d;
  }
  const d = dayjs(dateStr);
  return d.isValid() ? d : null;
}

export function debounce<T extends (...args: any[]) => any>(func: T, wait: number) {
  let timeout: NodeJS.Timeout;
  return function (...args: Parameters<T>) {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

export function getCleanPriceListName(code?: string, name?: string) {
  if (!name) return "";
  let clean = name.trim();
  if (code && clean.toLowerCase().startsWith(code.toLowerCase())) {
    clean = clean.slice(code.length).replace(/^[\s\-:_]+/, "").trim();
  }
  return clean;
}
