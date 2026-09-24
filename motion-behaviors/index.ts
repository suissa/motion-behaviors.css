export * from "./core";

import { MotionBehaviors, MotionBehaviorConfig } from "./core";

export const defineMotionBehavior = (config: MotionBehaviorConfig, root: ParentNode = document) =>
  new MotionBehaviors(config, root);

export const animate = (config: MotionBehaviorConfig, root: ParentNode = document) =>
  defineMotionBehavior(config, root).init();
