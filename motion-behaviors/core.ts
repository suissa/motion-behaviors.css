export type FinishState = "visible" | "hidden" | "remove";
export type StartTrigger =
  | "page-loaded"
  | `click:${string}`
  | `visible:${string}`
  | `event:${string}`
  | `after:${string}`;

export interface MotionBehaviorConfig {
  name?: string;
  in: string;
  out?: string;
  start?: StartTrigger[];
  wait?: string | number;
  finish?: FinishState;
  lastFinish?: FinishState;
  selector?: string;
  groupAttribute?: string;
}

export interface MotionEventDetail {
  element: HTMLElement;
  index: number;
  group: string;
  phase: "start" | "enter" | "entered" | "wait" | "exit" | "exited" | "finish";
}

const token = (el: HTMLElement, value: string) =>
  (el.dataset.behavior || "").split(/\s+/).includes(value);

export const durationToMs = (value: string | number | undefined): number => {
  if (typeof value === "number") return Math.max(0, value);
  if (!value) return 0;
  const match = /^([0-9]*\.?[0-9]+)(ms|s)$/.exec(value.trim());
  if (!match) throw new Error(`Invalid duration: ${value}`);
  return Number(match[1]) * (match[2] === "s" ? 1000 : 1);
};

const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

export class MotionBehaviors {
  private readonly selector: string;
  private readonly groupAttribute: string;
  private started = new WeakSet<HTMLElement>();

  constructor(
    public readonly config: MotionBehaviorConfig,
    private readonly root: ParentNode = document,
  ) {
    this.selector = config.selector || '[data-behavior~="animate"]';
    this.groupAttribute = config.groupAttribute || "motionGroup";
  }

  init(): this {
    const triggers = this.config.start ?? ["page-loaded"];
    for (const trigger of triggers) this.bindTrigger(trigger);
    return this;
  }

  emit(name: string, detail?: unknown): void {
    window.dispatchEvent(new CustomEvent(name, { detail }));
  }

  async run(group = "default"): Promise<void> {
    const elements = this.elements(group);
    for (let index = 0; index < elements.length; index++) {
      await this.runElement(elements[index], index, elements.length, group);
    }
  }

  async runElement(
    element: HTMLElement,
    index = 0,
    total = 1,
    group = element.dataset.motionGroup || "default",
  ): Promise<void> {
    if (this.started.has(element)) return;
    this.started.add(element);

    this.dispatch("start", element, index, group);

    if (token(element, "el-in")) {
      this.dispatch("enter", element, index, group);
      await this.animate(element, element.dataset.motionIn || this.config.in);
      this.dispatch("entered", element, index, group);
    }

    const isLast = token(element, "last") || index === total - 1;
    const waitMs = durationToMs(element.dataset.motionWait ?? this.config.wait);

    if (!isLast && token(element, "el-out")) {
      if (waitMs > 0) {
        this.dispatch("wait", element, index, group);
        await wait(waitMs);
      }
      this.dispatch("exit", element, index, group);
      await this.animate(element, element.dataset.motionOut || this.config.out || this.config.in);
      this.dispatch("exited", element, index, group);
    }

    const finish = (element.dataset.motionFinish as FinishState | undefined)
      || (isLast ? this.config.lastFinish : this.config.finish)
      || (isLast ? "visible" : "hidden");

    this.applyFinish(element, finish);
    this.dispatch("finish", element, index, group);
    this.emit(`motion:finished:${element.id || index}`, { element, index, group });
  }

  reset(group?: string): void {
    for (const el of this.elements(group)) {
      this.started.delete(el);
      el.style.removeProperty("visibility");
      el.style.removeProperty("display");
    }
  }

  private elements(group?: string): HTMLElement[] {
    return Array.from(this.root.querySelectorAll<HTMLElement>(this.selector))
      .filter((el) => !group || (el.dataset[this.groupAttribute] || "default") === group);
  }

  private bindTrigger(trigger: StartTrigger): void {
    if (trigger === "page-loaded") {
      const start = () => void this.run();
      if (document.readyState === "complete") queueMicrotask(start);
      else window.addEventListener("load", start, { once: true });
      return;
    }

    const [kind, value] = trigger.split(/:(.+)/) as [string, string];

    if (kind === "click") {
      document.addEventListener("click", (event) => {
        const target = event.target as Element | null;
        if (target?.closest(value)) void this.run();
      });
      return;
    }

    if (kind === "event") {
      window.addEventListener(value, () => void this.run());
      return;
    }

    if (kind === "after") {
      window.addEventListener(`motion:finished:${value.replace(/^#/, "")}`, () => void this.run());
      return;
    }

    if (kind === "visible") {
      const target = document.querySelector(value);
      if (!target) return;
      const observer = new IntersectionObserver((entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          void this.run();
          observer.disconnect();
        }
      });
      observer.observe(target);
    }
  }

  private animate(element: HTMLElement, animation: string): Promise<void> {
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return Promise.resolve();

    return new Promise((resolve) => {
      const name = animation.startsWith("animate__") ? animation : `animate__${animation}`;
      element.classList.add("animate__animated", name);
      element.addEventListener("animationend", () => {
        element.classList.remove("animate__animated", name);
        resolve();
      }, { once: true });
    });
  }

  private applyFinish(element: HTMLElement, finish: FinishState): void {
    if (finish === "remove") element.remove();
    else if (finish === "hidden") element.style.visibility = "hidden";
    else element.style.visibility = "visible";
  }

  private dispatch(
    phase: MotionEventDetail["phase"],
    element: HTMLElement,
    index: number,
    group: string,
  ): void {
    const detail: MotionEventDetail = { element, index, group, phase };
    element.dispatchEvent(new CustomEvent(`motion:${phase}`, { detail, bubbles: true }));
  }
}
