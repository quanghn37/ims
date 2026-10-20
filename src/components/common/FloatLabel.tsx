"use client";

import React, { useState } from "react";

export interface FloatLabelProps {
  label: React.ReactNode;
  children: React.ReactElement;
  required?: boolean;
  disabled?: boolean;
  splitSuffix?: boolean;
  value?: any;
  onChange?: any;
  [key: string]: any;
}

export const FloatLabel: React.FC<FloatLabelProps> = ({
  label,
  children,
  required,
  disabled,
  splitSuffix,
  value,
  onChange,
  ...restProps
}) => {
  const [focus, setFocus] = useState(false);

  const childProps = (React.isValidElement(children) ? children.props : {}) as any;

  const finalValue = value !== undefined ? value : childProps.value;
  const finalOnChange = onChange || childProps.onChange;

  return (
    <div
      className={`custom-float-box ${focus ? "focused" : ""} ${disabled ? "disabled-box" : ""} ${
        splitSuffix ? "split-suffix" : ""
      }`}
      onFocus={() => !disabled && setFocus(true)}
      onBlur={() => setFocus(false)}
    >
      <style dangerouslySetInnerHTML={{ __html: `
        .custom-float-box {
          position: relative;
          background: #ffffff;
          border: 1px solid #73b1f5;
          border-radius: 6px;
          padding: 4px 12px 2px 12px;
          transition: all 0.2s ease;
          width: 100%;
          box-sizing: border-box;
          height: 48px !important;
          min-height: 48px !important;
          max-height: 48px !important;
          display: flex;
          flex-direction: column;
          justifyContent: center;
          overflow: hidden;
        }

        .custom-float-box.focused {
          border-color: #722ed1;
          box-shadow: 0 0 0 2px rgba(114, 46, 209, 0.12);
        }

        .custom-float-box.disabled-box {
          background-color: #f5f5f5 !important;
          border-color: #d9d9d9 !important;
          cursor: not-allowed !important;
        }

        .custom-float-box.disabled-box .float-label-text {
          color: rgba(0, 0, 0, 0.45) !important;
        }

        .custom-float-box.disabled-box .ant-input[disabled],
        .custom-float-box.disabled-box .ant-input-affix-wrapper-disabled,
        .custom-float-box.disabled-box .ant-input-affix-wrapper-disabled input {
          color: rgba(0, 0, 0, 0.65) !important;
          -webkit-text-fill-color: rgba(0, 0, 0, 0.65) !important;
          background: transparent !important;
          cursor: not-allowed !allowed;
        }

        .custom-float-box .float-label-text {
          font-size: 11px;
          color: #262626;
          font-weight: 600;
          line-height: 14px;
          display: flex;
          align-items: center;
          gap: 2px;
          margin-bottom: 2px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .custom-float-box .float-label-text.required::after {
          content: "*";
          color: #ff4d4f;
          font-size: 12px;
          font-weight: 700;
          margin-left: 2px;
        }

        .custom-float-box .ant-select {
          height: 22px !important;
          min-height: 22px !important;
          line-height: 22px !important;
        }

        .custom-float-box .ant-input-affix-wrapper,
        .custom-float-box .ant-input,
        .custom-float-box .ant-input-number,
        .custom-float-box .ant-picker,
        .custom-float-box .ant-select,
        .custom-float-box .ant-select-selector {
          background: transparent !important;
          border: none !important;
          box-shadow: none !important;
          padding: 0 !important;
          height: 22px !important;
          min-height: 22px !important;
          font-size: 13px !important;
          font-weight: 400 !important;
          color: #262626 !important;
        }

        .custom-float-box .ant-input-number-input {
          height: 22px !important;
          padding: 0 !important;
          font-size: 13px !important;
          font-weight: 400 !important;
          color: #262626 !important;
        }

        .custom-float-box .ant-input-affix-wrapper input,
        .custom-float-box .ant-input,
        .custom-float-box .ant-input[disabled],
        .custom-float-box .ant-input-affix-wrapper-disabled,
        .custom-float-box .ant-input-affix-wrapper-disabled input {
          font-size: 13px !important;
          font-weight: 400 !important;
          color: #262626 !important;
          -webkit-text-fill-color: #262626 !important;
          background: transparent !important;
          text-overflow: ellipsis !important;
          overflow: hidden !important;
          white-space: nowrap !important;
        }

        .custom-float-box.split-suffix .ant-input-suffix,
        .custom-float-box.split-suffix .ant-picker-suffix,
        .custom-float-box.split-suffix .ant-select-arrow {
          position: absolute !important;
          right: 0px !important;
          top: 0 !important;
          bottom: 0 !important;
          height: 100% !important;
          width: 24px !important;
          margin: 0 !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
          border-left: 1px solid #d9d9d9 !important;
          background: #f7f7f7 !important;
          border-top-right-radius: 5px !important;
          border-bottom-right-radius: 5px !important;
          color: #595959 !important;
          font-size: 11px !important;
        }

        .custom-float-box.split-suffix .ant-input,
        .custom-float-box.split-suffix .ant-select-selection-item,
        .custom-float-box.split-suffix .ant-select-selection-placeholder,
        .custom-float-box.split-suffix .ant-picker-input > input {
          padding-right: 22px !important;
        }

        .custom-float-box:not(.split-suffix) .ant-input-suffix,
        .custom-float-box:not(.split-suffix) .ant-picker-suffix,
        .custom-float-box:not(.split-suffix) .ant-select-arrow {
          position: absolute !important;
          right: 10px !important;
          top: 50% !important;
          transform: translateY(-50%) !important;
          margin: 0 !important;
          display: flex !important;
          align-items: center !important;
          z-index: 2 !important;
          background: #ffffff !important;
        }

        .custom-form-item {
          margin-bottom: 16px !important;
        }
      ` }} />

      <div className={`float-label-text ${required ? "required" : ""}`}>{label}</div>

      {React.isValidElement(children)
        ? React.cloneElement(children as React.ReactElement<any>, {
            ...childProps,
            ...restProps,
            value: finalValue,
            onChange: finalOnChange,
          })
        : children}
    </div>
  );
};

export default FloatLabel;
