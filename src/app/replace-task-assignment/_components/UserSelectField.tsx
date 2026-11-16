"use client";

import React, { useState, useRef, useEffect, useMemo } from "react";
import { Select, Spin, Tag } from "antd";
import { extractApiList } from "@/lib/api-client";
import { ClientUserItem, replaceTaskAssignmentApi } from "../api";

interface UserSelectFieldProps {
  value?: number | null;
  onChange?: (userId: number | undefined, userObj?: ClientUserItem) => void;
  placeholder?: string;
  selectedUserHint?: ClientUserItem | null;
  disabled?: boolean;
  initialUsers?: ClientUserItem[];
}

export default function UserSelectField({
  value,
  onChange,
  placeholder = "Tìm theo tên, email hoặc tài khoản...",
  selectedUserHint,
  disabled = false,
  initialUsers = [],
}: UserSelectFieldProps) {
  const [users, setUsers] = useState<ClientUserItem[]>(initialUsers);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (initialUsers.length > 0 && users.length === 0) {
      setUsers(initialUsers);
    }
  }, [initialUsers, users.length]);

  const handleSearch = (keyword: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await replaceTaskAssignmentApi.getUsers({
          Keyword: keyword.trim(),
        });
        const list = extractApiList<ClientUserItem>(res);
        setUsers(list);
      } catch (err) {
        console.error("Lỗi tải danh sách người dùng:", err);
      } finally {
        setLoading(false);
      }
    }, 300);
  };

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  const mergedUsers = useMemo(() => {
    const map = new Map<number, ClientUserItem>();
    if (selectedUserHint && selectedUserHint.UserId) {
      map.set(Number(selectedUserHint.UserId), selectedUserHint);
    }
    for (const u of users) {
      if (u && u.UserId) {
        map.set(Number(u.UserId), u);
      }
    }
    return Array.from(map.values());
  }, [users, selectedUserHint]);

  const options = useMemo(
    () =>
      mergedUsers.map((u) => {
        const account = u.Account || u.Email || "";
        const labelText = `${u.FullName || account} (${account}) - #${u.UserId}`;
        return {
          value: Number(u.UserId),
          label: labelText,
          user: u,
        };
      }),
    [mergedUsers]
  );

  return (
    <Select
      showSearch
      allowClear
      disabled={disabled}
      value={value ?? undefined}
      placeholder={placeholder}
      filterOption={false}
      onSearch={handleSearch}
      onDropdownVisibleChange={(open) => {
        if (open && users.length === 0) {
          handleSearch("");
        }
      }}
      onChange={(val, option: any) => {
        if (val === undefined || val === null) {
          onChange?.(undefined, undefined);
        } else {
          onChange?.(Number(val), option?.user);
        }
      }}
      notFoundContent={
        loading ? (
          <div style={{ padding: "8px 12px", textAlign: "center" }}>
            <Spin size="small" /> <span style={{ marginLeft: 8, fontSize: 12 }}>Đang tìm...</span>
          </div>
        ) : (
          <div style={{ padding: "8px 12px", color: "#94a3b8", fontSize: 12 }}>
            Không tìm thấy nhân sự phù hợp
          </div>
        )
      }
      style={{ width: "100%" }}
      optionRender={(oriOption) => {
        const u: ClientUserItem | undefined = (oriOption.data as any)?.user;
        if (!u) return oriOption.label;
        const isInactive = u.IsActive && u.IsActive !== "Yes";
        return (
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={{ fontWeight: 500, fontSize: 12.5, color: "#123443", overflow: "hidden", textOverflow: "ellipsis" }}>
                {u.FullName || u.Account}{" "}
                {isInactive && (
                  <Tag color="default" style={{ fontSize: 10, marginLeft: 4, lineHeight: "14px" }}>
                    Ngưng HĐ
                  </Tag>
                )}
              </div>
              <div style={{ fontSize: 11, color: "#64748b", overflow: "hidden", textOverflow: "ellipsis" }}>
                {u.Account || u.Email}
              </div>
            </div>
            <span
              style={{
                fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
                fontSize: 11,
                color: "#008f89",
                background: "#eef5f4",
                padding: "1px 6px",
                borderRadius: 4,
                flexShrink: 0,
              }}
            >
              #{u.UserId}
            </span>
          </div>
        );
      }}
      options={options}
    />
  );
}
