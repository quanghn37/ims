"use client";

import React, { useState } from "react";
import { Card, Form, Input, Button, Typography, Space, Select, Modal, message } from "antd";
import {
  IconBuildingCommunity,
  IconUser,
  IconLock,
  IconLogin,
} from "@tabler/icons-react";
import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";
import { erpPost } from "@/lib/api-client";
import { useTranslation } from "@/locales/LanguageContext";

const { Title, Text } = Typography;

export default function LoginPage() {
  const { t, language, setLanguage } = useTranslation();
  const [form] = Form.useForm();
  const [forgotForm] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [isForgotModalOpen, setIsForgotModalOpen] = useState(false);
  const [forgotLoading, setForgotLoading] = useState(false);

  const { login } = useAuth();
  const router = useRouter();

  React.useEffect(() => {
    form.setFieldsValue({ language });
  }, [language, form]);

  const handleLogin = async (values: any) => {
    setLoading(true);
    try {
      const selectedLang = values.language || language || "vi";
      setLanguage(selectedLang);
      const success = await login(values.email, values.password, selectedLang);
      if (success) {
        router.push("/quotations");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (values: any) => {
    setForgotLoading(true);
    try {
      await erpPost("api/upsert-user", {
        LogIn: values.logIn,
        Language: language,
      }, "reset_password");
      message.success(t.login.resetSuccess);
      setIsForgotModalOpen(false);
      forgotForm.resetFields();
    } catch (e: any) {
      message.error(e.message || t.login.resetFailed);
    } finally {
      setForgotLoading(false);
    }
  };

  return (
    <div
      style={{
        display: "flex",
        minHeight: "100vh",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(135deg, #001529 0%, #003a70 50%, #0d47a1 100%)",
        padding: "20px",
      }}
    >
      <Card
        style={{
          width: 440,
          boxShadow: "0 12px 32px rgba(0, 0, 0, 0.25)",
          borderRadius: 8,
          border: "none",
        }}
      >
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <IconBuildingCommunity size={48} strokeWidth={1.5} style={{ color: "#7C3AED", marginBottom: 12 }} />
          <Title level={3} style={{ margin: 0, fontWeight: 700 }}>
            {t.login.systemTitle}
          </Title>
          <Text type="secondary">{t.login.subTitle}</Text>
        </div>

        <Form
          form={form}
          layout="vertical"
          initialValues={{ language }}
          onFinish={handleLogin}
        >
          <Form.Item
            name="email"
            label={t.login.accountLabel}
            rules={[{ required: true, message: t.login.accountRequired }]}
          >
            <Input
              prefix={<IconUser size={18} strokeWidth={1.8} style={{ color: "#94A3B8" }} />}
              placeholder={t.login.accountPlaceholder}
              autoComplete="username"
              size="large"
            />
          </Form.Item>

          <Form.Item
            name="password"
            label={t.login.passwordLabel}
            rules={[{ required: true, message: t.login.passwordRequired }]}
          >
            <Input.Password
              prefix={<IconLock size={18} strokeWidth={1.8} style={{ color: "#94A3B8" }} />}
              placeholder={t.login.passwordPlaceholder}
              autoComplete="current-password"
              size="large"
            />
          </Form.Item>

          <Form.Item name="language" label={t.login.languageLabel}>
            <Select
              size="large"
              value={language}
              onChange={(val) => {
                setLanguage(val);
                form.setFieldsValue({ language: val });
              }}
            >
              <Select.Option value="vi">Tiếng Việt (vi)</Select.Option>
              <Select.Option value="en">English (en)</Select.Option>
            </Select>
          </Form.Item>

          <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 16 }}>
            <Button type="link" style={{ padding: 0 }} onClick={() => setIsForgotModalOpen(true)}>
              {t.login.forgotPassword}
            </Button>
          </div>

          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              size="large"
              block
              loading={loading}
              icon={<IconLogin size={18} strokeWidth={1.8} />}
              style={{
                background: "#7C3AED",
                borderColor: "#7C3AED",
              }}
            >
              {t.login.loginButton}
            </Button>
          </Form.Item>
        </Form>

      </Card>

      <Modal
        title={t.login.resetTitle}
        open={isForgotModalOpen}
        onCancel={() => setIsForgotModalOpen(false)}
        footer={null}
      >
        <Form form={forgotForm} layout="vertical" onFinish={handleForgotPassword}>
          <Form.Item
            name="logIn"
            label={t.login.resetEmailLabel}
            rules={[{ required: true, message: t.login.resetEmailRequired }]}
          >
            <Input placeholder={t.login.resetEmailPlaceholder} />
          </Form.Item>
          <Form.Item>
            <Space style={{ display: "flex", justifyContent: "flex-end" }}>
              <Button onClick={() => setIsForgotModalOpen(false)}>{t.common.cancel}</Button>
              <Button type="primary" htmlType="submit" loading={forgotLoading}>
                {t.login.sendRequest}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
