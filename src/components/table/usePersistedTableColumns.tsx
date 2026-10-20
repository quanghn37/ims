"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import type { ColumnsType, ColumnType } from "antd/es/table";
import { message } from "antd";
import ColumnSettingsPopover, { ColumnSettingItem } from "./ColumnSettingsPopover";

interface UsePersistedTableColumnsProps<T> {
  tableKey: string;
  columns: (ColumnType<T> & { cannotHide?: boolean })[];
  actionColumnKey?: string;
  minColumnWidth?: number;
  defaultScrollX?: number;
}

export function usePersistedTableColumns<T extends Record<string, any>>({
  tableKey,
  columns: initialColumns,
  actionColumnKey = "action",
  minColumnWidth = 60,
  defaultScrollX = 1200,
}: UsePersistedTableColumnsProps<T>) {
  const configStorageKey = `${tableKey}_columns_config_v1`;
  const widthsStorageKey = `${tableKey}_columns_widths_v1`;

  // Trích xuất cấu hình mặc định ban đầu từ initialColumns
  const defaultConfigs: ColumnSettingItem[] = useMemo(() => {
    return initialColumns.map((col, idx) => {
      const key = String(col.key ?? col.dataIndex ?? `col_${idx}`);
      let titleStr = "Cột";
      if (typeof col.title === "string" && col.title.trim() !== "") {
        titleStr = col.title;
      } else if (typeof col.title === "number") {
        titleStr = String(col.title);
      } else if (key === "stt") {
        titleStr = "STT";
      } else if (key === actionColumnKey) {
        titleStr = "Thao tác";
      }

      return {
        key,
        title: titleStr,
        visible: true,
        cannotHide: Boolean(col.cannotHide || key === actionColumnKey),
        fixed: col.fixed,
      };
    });
  }, [initialColumns, actionColumnKey]);

  const [columnConfigs, setColumnConfigs] = useState<ColumnSettingItem[]>(defaultConfigs);
  const [columnWidths, setColumnWidths] = useState<Record<string, number>>({});

  // 1. Đọc cấu hình từ localStorage khi khởi tạo
  useEffect(() => {
    try {
      const savedConfigStr = localStorage.getItem(configStorageKey);
      if (savedConfigStr) {
        const savedConfigs: { key: string; visible: boolean }[] = JSON.parse(savedConfigStr);
        const reordered: ColumnSettingItem[] = [];

        savedConfigs.forEach((sc) => {
          const found = defaultConfigs.find((d) => d.key === sc.key);
          if (found) {
            reordered.push({
              ...found,
              visible: found.cannotHide ? true : Boolean(sc.visible),
            });
          }
        });

        // Bổ sung các cột mới nếu defaultConfigs có mà trong cache chưa có
        defaultConfigs.forEach((d) => {
          if (!reordered.some((r) => r.key === d.key)) {
            reordered.push(d);
          }
        });

        setColumnConfigs(reordered);
      } else {
        setColumnConfigs(defaultConfigs);
      }

      const savedWidthsStr = localStorage.getItem(widthsStorageKey);
      if (savedWidthsStr) {
        setColumnWidths(JSON.parse(savedWidthsStr));
      }
    } catch (e) {
      console.error(`[${tableKey}] Lỗi đọc cấu hình cột từ localStorage:`, e);
    }
  }, [configStorageKey, widthsStorageKey, defaultConfigs, tableKey]);

  // 2. Lưu cấu hình vào localStorage
  const saveColumnConfigs = useCallback(
    (nextConfigs: ColumnSettingItem[]) => {
      setColumnConfigs(nextConfigs);
      try {
        const toSave = nextConfigs.map(({ key, visible }) => ({ key, visible }));
        localStorage.setItem(configStorageKey, JSON.stringify(toSave));
      } catch (e) {
        console.error(`[${tableKey}] Lỗi lưu cấu hình cột:`, e);
      }
    },
    [configStorageKey, tableKey]
  );

  const handleToggleColumnVisibility = useCallback(
    (key: string) => {
      const next = columnConfigs.map((c) =>
        c.key === key && !c.cannotHide ? { ...c, visible: !c.visible } : c
      );
      saveColumnConfigs(next);
    },
    [columnConfigs, saveColumnConfigs]
  );

  const handleMoveColumnUp = useCallback(
    (index: number) => {
      if (index <= 0) return;
      const next = [...columnConfigs];
      const temp = next[index - 1];
      next[index - 1] = next[index];
      next[index] = temp;
      saveColumnConfigs(next);
    },
    [columnConfigs, saveColumnConfigs]
  );

  const handleMoveColumnDown = useCallback(
    (index: number) => {
      if (index >= columnConfigs.length - 1) return;
      const next = [...columnConfigs];
      const temp = next[index + 1];
      next[index + 1] = next[index];
      next[index] = temp;
      saveColumnConfigs(next);
    },
    [columnConfigs, saveColumnConfigs]
  );

  const handleResetColumns = useCallback(() => {
    setColumnConfigs(defaultConfigs);
    setColumnWidths({});
    try {
      localStorage.removeItem(configStorageKey);
      localStorage.removeItem(widthsStorageKey);
      message.success("Đã khôi phục thứ tự và kích thước cột mặc định!");
    } catch (e) {
      console.error(`[${tableKey}] Lỗi reset cột:`, e);
    }
  }, [defaultConfigs, configStorageKey, widthsStorageKey, tableKey]);

  const handleShowAllColumns = useCallback(() => {
    const next = columnConfigs.map((c) => ({ ...c, visible: true }));
    saveColumnConfigs(next);
  }, [columnConfigs, saveColumnConfigs]);

  const handleResizeColumn = useCallback(
    (columnKey: string) => (_: any, { size }: { size: { width: number } }) => {
      setColumnWidths((prev) => {
        const next = { ...prev, [columnKey]: Math.max(size.width, minColumnWidth) };
        try {
          localStorage.setItem(widthsStorageKey, JSON.stringify(next));
        } catch (e) {
          console.error(`[${tableKey}] Lỗi lưu độ rộng cột:`, e);
        }
        return next;
      });
    },
    [widthsStorageKey, minColumnWidth, tableKey]
  );

  // 3. Tạo Map định nghĩa cột gốc để tra cứu
  const initialColumnsMap = useMemo(() => {
    const map = new Map<string, ColumnType<T>>();
    initialColumns.forEach((col, idx) => {
      const key = String(col.key ?? col.dataIndex ?? `col_${idx}`);
      map.set(key, col);
    });
    return map;
  }, [initialColumns]);

  // 4. Sinh mảng tableColumns đã xử lý thứ tự, ẩn hiện, resize và nhúng icon ⚙️ vào cột Thao tác
  const tableColumns = useMemo(() => {
    return columnConfigs
      .filter((cfg) => cfg.visible)
      .map((cfg) => {
        const colDef = initialColumnsMap.get(cfg.key);
        if (!colDef) return null;

        const currentWidth = columnWidths[cfg.key] ?? colDef.width;
        const isActionCol = cfg.key === actionColumnKey;

        // Nếu là cột thao tác (hoặc actionColumnKey), nhúng icon ⚙️ vào bên cạnh title
        let finalTitle = colDef.title;
        if (isActionCol) {
          const hasTitle = Boolean(
            colDef.title &&
            (typeof colDef.title !== "string" || colDef.title.trim() !== "")
          );
          finalTitle = (
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: colDef.align === "left" ? "flex-start" : colDef.align === "right" ? "flex-end" : "center",
                gap: 6,
                width: "100%",
                userSelect: "none",
              }}
            >
              {hasTitle && (
                <span>
                  {typeof colDef.title === "function"
                    ? (colDef.title as any)({})
                    : (colDef.title as React.ReactNode)}
                </span>
              )}
              <ColumnSettingsPopover
                compact
                columnConfigs={columnConfigs}
                onToggleVisibility={handleToggleColumnVisibility}
                onMoveUp={handleMoveColumnUp}
                onMoveDown={handleMoveColumnDown}
                onReset={handleResetColumns}
                onShowAll={handleShowAllColumns}
              />
            </div>
          );
        }

        return {
          ...colDef,
          title: finalTitle,
          width: currentWidth,
          onHeaderCell: (column: any) => ({
            width: column.width,
            onResize: handleResizeColumn(cfg.key),
          }),
        };
      })
      .filter(Boolean) as ColumnsType<T>;
  }, [
    columnConfigs,
    initialColumnsMap,
    columnWidths,
    actionColumnKey,
    handleToggleColumnVisibility,
    handleMoveColumnUp,
    handleMoveColumnDown,
    handleResetColumns,
    handleShowAllColumns,
    handleResizeColumn,
  ]);

  const scrollX = useMemo(() => {
    const total = tableColumns.reduce((sum, c) => sum + (Number(c.width) || 120), 0);
    return Math.max(total, defaultScrollX);
  }, [tableColumns, defaultScrollX]);

  return {
    tableColumns,
    scrollX,
    columnConfigs,
    resetColumns: handleResetColumns,
  };
}

export default usePersistedTableColumns;
