"use client";

import React from "react";
import { Resizable } from "react-resizable";

interface ResizableTitleProps {
  onResize?: (e: any, data: any) => void;
  width?: number;
  children: React.ReactNode;
  [key: string]: any;
}

export const ResizableTitle: React.FC<ResizableTitleProps> = (props) => {
  const { onResize, width, children, ...restProps } = props;

  if (!width) {
    return <th {...restProps}>{children}</th>;
  }

  return (
    <Resizable
      width={width}
      height={0}
      handle={
        <span
          className="react-resizable-handle"
          onClick={(e) => e.stopPropagation()}
          style={{
            position: "absolute",
            right: -5,
            bottom: 0,
            top: 0,
            width: 10,
            cursor: "col-resize",
            zIndex: 1,
          }}
        />
      }
      onResize={onResize}
      draggableOpts={{ enableUserSelectHack: false }}
    >
      <th {...restProps} style={{ ...restProps.style, position: restProps.style?.position || "relative" }}>
        {children}
      </th>
    </Resizable>
  );
};

export default ResizableTitle;
