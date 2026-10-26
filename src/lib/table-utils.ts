import { useCallback, useEffect, useMemo, useState } from "react";

interface ResizableColumn {
  key?: React.Key;
  dataIndex?: string;
  width?: number;
}

interface ResizeEvent {
  size: { width: number };
}

export function usePersistedColumnWidths<T extends ResizableColumn>(initialColumns: T[], storageKey: string) {
  const [columnWidths, setColumnWidths] = useState<Record<string, number>>(() => {
    if (typeof window === "undefined") return {};
    try {
      const savedWidthsString = localStorage.getItem(storageKey);
      if (savedWidthsString) {
        return JSON.parse(savedWidthsString);
      }
    } catch (error) {
      console.error("Lỗi đọc cấu hình kích thước cột từ localStorage:", error);
    }
    return {};
  });

  useEffect(() => {
    try {
      const savedWidthsString = localStorage.getItem(storageKey);
      if (savedWidthsString) {
        const savedWidths: Record<string, number> = JSON.parse(savedWidthsString);
        setColumnWidths(savedWidths);
      }
    } catch (error) {
      console.error("Lỗi đọc cấu hình kích thước cột từ localStorage:", error);
    }
  }, [storageKey]);

  const handleResizeColumn = useCallback((index: number) => (_: unknown, { size }: ResizeEvent) => {
    const targetCol = initialColumns[index];
    const key = String(targetCol?.key ?? targetCol?.dataIndex ?? index);
    setColumnWidths((previous) => {
      const next = { ...previous, [key]: Math.max(size.width, 60) };
      try {
        localStorage.setItem(storageKey, JSON.stringify(next));
      } catch (error) {
        console.error("Lỗi lưu kích thước cột:", error);
      }
      return next;
    });
  }, [initialColumns, storageKey]);

  const columns = useMemo(() => {
    return initialColumns.map((column, index) => {
      const key = String(column.key ?? column.dataIndex ?? index);
      return {
        ...column,
        width: columnWidths[key] ?? column.width,
      };
    });
  }, [initialColumns, columnWidths]);

  return { columns, handleResizeColumn };
}

export interface ColumnFilterState {
  [key: string]: string;
}

interface ColumnFilteringOptions<T> {
  rows: T[];
  fields: Record<string, string[]>;
  searchKeyword: string;
  getSearchValues: (row: T) => unknown[];
  excludePlaceholderDateFromFilters?: boolean;
}

export function useColumnFiltering<T extends Record<string, any>>({
  rows,
  fields,
  searchKeyword,
  getSearchValues,
  excludePlaceholderDateFromFilters = false,
}: ColumnFilteringOptions<T>) {
  const [columnFilters, setColumnFilters] = useState<ColumnFilterState>({});

  const columnSuggestions = useMemo(() => {
    const map: Record<string, string[]> = {};
    for (const [columnKey, columnFields] of Object.entries(fields)) {
      const suggestions = new Set<string>();
      rows.forEach((row) => columnFields.forEach((field) => {
        const value = (row as Record<string, unknown>)[field];
        if (value !== null && value !== undefined && value !== "" && value !== "---" && value !== "01-01-1900") {
          const suggestion = String(value).trim();
          if (suggestion && suggestion !== "01-01-1900") suggestions.add(suggestion);
        }
      }));
      map[columnKey] = Array.from(suggestions);
    }
    return map;
  }, [rows, fields]);

  const filteredRows = useMemo(() => {
    const keyword = searchKeyword.trim().toLowerCase();
    return rows.filter((row) => {
      if (keyword && !getSearchValues(row).some((value) => String(value ?? "").toLowerCase().includes(keyword))) {
        return false;
      }
      for (const [columnKey, columnFields] of Object.entries(fields)) {
        const filterValue = columnFilters[columnKey]?.trim().toLowerCase();
        if (filterValue && !columnFields.some((field) => {
          const value = (row as Record<string, unknown>)[field];
          return value !== null && value !== undefined &&
            !(excludePlaceholderDateFromFilters && value === "01-01-1900") &&
            String(value).toLowerCase().includes(filterValue);
        })) return false;
      }
      return true;
    });
  }, [rows, fields, searchKeyword, columnFilters, getSearchValues, excludePlaceholderDateFromFilters]);

  const isFiltering = useMemo(
    () => !!searchKeyword.trim() || Object.values(columnFilters).some((value) => value && value.trim()),
    [searchKeyword, columnFilters]
  );

  return { columnFilters, setColumnFilters, columnSuggestions, filteredRows, isFiltering };
}
