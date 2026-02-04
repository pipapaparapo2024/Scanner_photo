import React from "react";
import { View } from "react-native";
import { Tooltip } from "./Tooltip";
import { useTooltip } from "../lib/tooltips/useTooltip";

interface TooltipWrapperProps {
  tooltipId: string;
  message: string;
  position?: "top" | "bottom" | "left" | "right";
  showOnce?: boolean;
  children: React.ReactNode;
  enabled?: boolean;
}

/**
 * Обертка для элементов с автоматическим показом tooltip
 */
export function TooltipWrapper({
  tooltipId,
  message,
  position = "bottom",
  showOnce = true,
  children,
  enabled = true,
}: TooltipWrapperProps) {
  const { visible, targetRef, hideTooltip } = useTooltip(tooltipId, { showOnce });

  if (!enabled) {
    return <>{children}</>;
  }

  return (
    <>
      <View ref={targetRef} collapsable={false}>
        {children}
      </View>
      <Tooltip
        visible={visible}
        message={message}
        position={position}
        targetRef={targetRef}
        onClose={hideTooltip}
      />
    </>
  );
}
