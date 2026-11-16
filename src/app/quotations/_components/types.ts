import dayjs from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat";

dayjs.extend(customParseFormat);

export interface AttachmentFile {
  id: string;
  fileName: string;
  fileUrl: string;
  uploadedBy: string;
  uploadingDate: string;
  isClientDoc: boolean;
  hasSign?: boolean;
  folder?: "project_docs" | "signing_docs" | "signed_docs" | string;
  fileSize?: string;
}

export function parseDateSafe(dateStr?: any) {
  if (!dateStr || dateStr === "01-01-1900" || dateStr === "1900-01-01" || dateStr === "") return null;
  if (dayjs.isDayjs(dateStr)) return dateStr.isValid() ? dateStr : null;
  const formats = [
    "DD-MM-YYYY",
    "DD/MM/YYYY",
    "YYYY-MM-DD",
    "YYYY/MM/DD",
    "DD-MM-YYYY HH:mm:ss",
    "DD/MM/YYYY HH:mm:ss",
    "YYYY-MM-DDTHH:mm:ss",
    "YYYY-MM-DDTHH:mm:ss.SSS",
    "YYYY-MM-DDTHH:mm:ss.SSSZ",
  ];
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
