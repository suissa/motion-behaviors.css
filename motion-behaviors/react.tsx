import React, { PropsWithChildren, useEffect, useRef } from "react";
import { MotionBehaviors, MotionBehaviorConfig } from "./core";

export function MotionRoot({
  config,
  children,
}: PropsWithChildren<{ config: MotionBehaviorConfig }>) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current) return;
    const runtime = new MotionBehaviors(config, ref.current).init();
    return () => runtime.reset();
  }, [config]);

  return <div ref={ref}>{children}</div>;
}

export type MotionProps = {
  group?: string;
  enter?: string;
  exit?: string;
  wait?: string;
  finish?: "visible" | "hidden" | "remove";
  last?: boolean;
};

export function motionProps({
  group = "default",
  enter,
  exit,
  wait,
  finish,
  last = false,
}: MotionProps = {}) {
  return {
    "data-behavior": `animate el-in${exit ? " el-out" : ""}${last ? " last" : ""}`,
    "data-motion-group": group,
    ...(enter ? { "data-motion-in": enter } : {}),
    ...(exit ? { "data-motion-out": exit } : {}),
    ...(wait ? { "data-motion-wait": wait } : {}),
    ...(finish ? { "data-motion-finish": finish } : {}),
  };
}
