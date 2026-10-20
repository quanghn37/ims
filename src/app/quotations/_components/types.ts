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
}

export function parseDateSafe(dateStr?: string) {
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
