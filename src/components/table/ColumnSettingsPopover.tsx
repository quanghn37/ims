"use client";

import React from "react";
import { Popover, Button, Checkbox, Space, Typography, Tooltip, Divider, Tag } from "antd";
import {
  IconSettings,
  IconArrowUp,
  IconArrowDown,
  IconRefresh,
  IconCheck,
  IconEye,
} from "@tabler/icons-react";
import { useTranslation } from "@/locales/LanguageContext";

const { Text } = Typography;

export interface ColumnSettingItem {
  key: string;
  title: string;
  visible: boolean;
  fixed?: boolean | "left" | "right";
  cannotHide?: boolean;
}

interface ColumnSettingsPopoverProps {
  columnConfigs: ColumnSettingItem[];
  onToggleVisibility: (key: string) => void;
  onMoveUp: (index: number) => void;
  onMoveDown: (index: number) => void;
  onReset: () => void;
  onShowAll?: () => void;
  compact?: boolean;
}

export const ColumnSettingsPopover: React.FC<ColumnSettingsPopoverProps> = ({
  columnConfigs,
  onToggleVisibility,
  onMoveUp,
  onMoveDown,
  onReset,
  onShowAll,
  compact = false,
}) => {
  const { t, language } = useTranslation();
  const visibleCount = columnConfigs.filter((c) => c.visible).length;

  const content = (
    <div style={{ width: 330, maxHeight: 460, display: "flex", flexDirection: "column" }}>
      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          paddingBottom: 8,
          borderBottom: "1px solid #f0f0f0",
        }}
      >
        <Space size={6}>
          <Text strong style={{ fontSize: 13 }}>
            {language === "en" ? "Column Order & Visibility" : "Thứ tự & Ẩn/Hiện cột"}
          </Text>
          <Tag color="purple" style={{ fontSize: 11, borderRadius: 10, padding: "0 6px" }}>
            {visibleCount}/{columnConfigs.length}
          </Tag>
        </Space>

        <Tooltip title={language === "en" ? "Reset column order and width to default" : "Khôi phục thứ tự và độ rộng cột mặc định"}>
          <Button
            type="link"
            size="small"
            icon={<IconRefresh size={14} strokeWidth={1.8} />}
            onClick={onReset}
            style={{ padding: 0, fontSize: 12, color: "#7C3AED" }}
          >
            {language === "en" ? "Default" : "Mặc định"}
          </Button>
        </Tooltip>
      </div>

      <div style={{ padding: "6px 0 8px 0" }}>
        <Text type="secondary" style={{ fontSize: 11, lineHeight: "14px", display: "block" }}>
          {language === "en"
            ? "Click ↑ ↓ to reorder columns, uncheck to hide. Settings are saved automatically."
            : "Nhấn ↑ ↓ để đổi thứ tự cột, bỏ chọn để ẩn. Cấu hình được lưu tự động trên máy này."}
        </Text>
      </div>

      {/* List items with scroll */}
      <div
        style={{
          overflowY: "auto",
          maxHeight: 300,
          paddingRight: 4,
          display: "flex",
          flexDirection: "column",
          gap: 4,
        }}
      >
        {columnConfigs.map((item, index) => {
          const isFirst = index === 0;
          const isLast = index === columnConfigs.length - 1;

          return (
            <div
              key={item.key}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "6px 10px",
                borderRadius: 6,
                backgroundColor: item.visible ? "#fafafa" : "#f5f5f5",
                border: "1px solid",
                borderColor: item.visible ? "#e8e8e8" : "#f0f0f0",
                opacity: item.visible ? 1 : 0.6,
                transition: "all 0.2s ease",
              }}
            >
              <Checkbox
                checked={item.visible}
                disabled={item.cannotHide}
                onChange={() => onToggleVisibility(item.key)}
                style={{ flex: 1, userSelect: "none" }}
              >
                <span
                  style={{
                    fontSize: 13,
                    fontWeight: item.visible ? 500 : 400,
                    color: item.visible ? "#262626" : "#8c8c8c",
                  }}
                >
                  {item.title}
                </span>
                {item.cannotHide && (
                  <Text type="secondary" style={{ fontSize: 11, marginLeft: 4 }}>
                    {language === "en" ? "(fixed)" : "(cố định)"}
                  </Text>
                )}
              </Checkbox>

              <Space size={4}>
                <Tooltip title={isFirst ? (language === "en" ? "Already at top" : "Đang ở vị trí đầu") : (language === "en" ? "Move up" : "Di chuyển lên trước")}>
                  <Button
                    size="small"
                    type="text"
                    icon={<IconArrowUp size={13} strokeWidth={2} />}
                    disabled={isFirst}
                    onClick={() => onMoveUp(index)}
                    style={{
                      width: 24,
                      height: 24,
                      color: isFirst ? "#d9d9d9" : "#595959",
                    }}
                  />
                </Tooltip>

                <Tooltip title={isLast ? (language === "en" ? "Already at bottom" : "Đang ở vị trí cuối") : (language === "en" ? "Move down" : "Di chuyển xuống sau")}>
                  <Button
                    size="small"
                    type="text"
                    icon={<IconArrowDown size={13} strokeWidth={2} />}
                    disabled={isLast}
                    onClick={() => onMoveDown(index)}
                    style={{
                      width: 24,
                      height: 24,
                      color: isLast ? "#d9d9d9" : "#595959",
                    }}
                  />
                </Tooltip>
              </Space>
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <Divider style={{ margin: "8px 0" }} />
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          paddingTop: 2,
        }}
      >
        {onShowAll && (
          <Button
            type="text"
            size="small"
            icon={<IconEye size={14} strokeWidth={1.8} />}
            onClick={onShowAll}
            style={{ fontSize: 12, color: "#7C3AED" }}
          >
            {language === "en" ? "Show All" : "Hiện tất cả"}
          </Button>
        )}
        <div style={{ marginLeft: "auto" }}>
          <Tag color="success" icon={<IconCheck size={12} strokeWidth={2} style={{ verticalAlign: -1 }} />} style={{ margin: 0, fontSize: 11 }}>
            {language === "en" ? "Auto-saved" : "Tự động lưu"}
          </Tag>
        </div>
      </div>
    </div>
  );

  return (
    <Popover
      content={content}
      trigger="click"
      placement="bottomRight"
      arrow={{ pointAtCenter: true }}
    >
      {compact ? (
        <Tooltip title={language === "en" ? "Customize column order & visibility" : "Tùy chỉnh thứ tự & ẩn/hiện cột"}>
          <span
            onClick={(e) => e.stopPropagation()}
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              padding: "2px 4px",
              borderRadius: 4,
              color: "#7C3AED",
              transition: "all 0.2s ease",
            }}
          >
            <IconSettings size={15} strokeWidth={1.8} />
          </span>
        </Tooltip>
      ) : (
        <Tooltip title={language === "en" ? "Customize table column order & visibility" : "Tùy chỉnh thứ tự và ẩn/hiện các cột trong bảng"}>
          <Button icon={<IconSettings size={16} strokeWidth={1.8} style={{ color: "#7C3AED" }} />}>
            {language === "en" ? "Columns" : "Tùy chỉnh cột"}
          </Button>
        </Tooltip>
      )}
    </Popover>
  );
};

export default ColumnSettingsPopover;
