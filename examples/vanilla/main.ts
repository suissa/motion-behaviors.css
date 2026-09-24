import { animate, MotionBehaviors } from "../../motion-behaviors/index";

const runtime = animate({
  in: "zoomInDown",
  out: "zoomOutDown",
  start: ["page-loaded"],
  wait: "1.5s",
  finish: "hidden",
  lastFinish: "visible",
});

document.querySelector("#replay")?.addEventListener("click", () => {
  runtime.reset();
  void runtime.run();
});

const remove = new MotionBehaviors({
  in: "lightSpeedInRight",
  out: "hinge",
  wait: "800ms",
  selector: '[data-motion-group="remove"]',
});

document.querySelector("#run-remove")?.addEventListener("click", () => void remove.run("remove"));
