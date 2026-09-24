import React, { useMemo } from "react";
import { MotionRoot, motionProps } from "../../motion-behaviors/react";

export default function App() {
  const config = useMemo(() => ({
    in: "zoomInDown",
    out: "zoomOutDown",
    start: ["page-loaded"] as const,
    wait: "1.5s",
    finish: "hidden" as const,
    lastFinish: "visible" as const,
  }), []);

  return (
    <MotionRoot config={config}>
      <h1>React</h1>
      <img src="/logo1.png" {...motionProps({ exit: "zoomOutDown" })} />
      <div {...motionProps({ enter: "fadeInUp", exit: "fadeOutDown" })}>Second</div>
      <button {...motionProps({ enter: "bounceIn", last: true, finish: "visible" })}>Final</button>
    </MotionRoot>
  );
}
