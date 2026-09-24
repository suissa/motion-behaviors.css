# motion-behaviors.css

Declarative motion orchestration for the web, powered by Animate.css.

`motion-behaviors.css` does not reimplement animations. Animate.css remains the animation engine. This project adds a small behavior runtime that decides **when**, **in which order**, and **under which conditions** animations run.

The same behavior model is available for:

- pure TypeScript;
- browser ESM without a build step;
- React;
- Elm.

## Why

CSS animation libraries solve the animation itself:

```txt
fadeIn
zoomInDown
bounceOut
hinge
...
```

What they normally do not solve is orchestration:

```txt
page loaded
    ↓
element 1 enters
    ↓
wait 2s
    ↓
element 1 exits
    ↓
element 2 enters
    ↓
wait
    ↓
...
    ↓
last element remains visible
```

That is the responsibility of `motion-behaviors.css`.

## Core idea

The DOM declares behavior:

```html
<img
  src="logo1.png"
  data-behavior="animate el-in el-out"
/>

<img
  src="logo2.png"
  data-behavior="animate el-in el-out"
/>

<input
  type="text"
  data-behavior="animate el-in el-out"
/>

<input
  type="submit"
  data-behavior="animate el-in last"
/>
```

The runtime declares the orchestration:

```ts
const motion = {
  in: "zoomInDown",
  out: "zoomOutDown",

  start: ["page-loaded"],
  wait: "10s",

  finish: "hidden",
  lastFinish: "visible"
}
```

Animate.css remains responsible only for the CSS animation classes.

## Architecture

```txt
                 declarative behavior
                         │
                         ▼
              data-behavior / config
                         │
                         ▼
                Motion Orchestrator
                         │
          ┌──────────────┼──────────────┐
          │              │              │
          ▼              ▼              ▼
       trigger         state          timing
          │              │              │
          └──────────────┼──────────────┘
                         ▼
                    Animate.css
```

The orchestrator handles:

- triggers;
- sequences;
- enter/exit phases;
- waits;
- groups;
- final states;
- lifecycle events;
- replay/reset.

It does not contain animation implementations.

## TypeScript

```ts
import { animate } from "./motion-behaviors/index";

const runtime = animate({
  in: "zoomInDown",
  out: "zoomOutDown",
  start: ["page-loaded"],
  wait: "1.5s",
  finish: "hidden",
  lastFinish: "visible"
});
```

Replay the sequence:

```ts
runtime.reset();
await runtime.run();
```

Run only a group:

```ts
await runtime.run("hero");
```

## Browser without build

A browser-ready ES module is available at:

```txt
motion-behaviors/browser.js
```

Usage:

```html
<link rel="stylesheet" href="./animate.min.css" />

<script type="module">
  import { MotionBehaviors } from "./motion-behaviors/browser.js";

  new MotionBehaviors({
    in: "zoomInDown",
    out: "zoomOutDown",
    start: ["page-loaded"],
    wait: "2s",
    lastFinish: "visible"
  }).init();
</script>
```

## React

React uses the same declarative contract.

```tsx
import { MotionRoot, motionProps } from "./motion-behaviors/react";

const config = {
  in: "zoomInDown",
  out: "zoomOutDown",
  start: ["page-loaded"],
  wait: "1.5s",
  finish: "hidden",
  lastFinish: "visible"
} as const;

export function App() {
  return (
    <MotionRoot config={config}>
      <img
        src="/logo1.png"
        {...motionProps({
          exit: "zoomOutDown"
        })}
      />

      <div
        {...motionProps({
          enter: "fadeInUp",
          exit: "fadeOutDown"
        })}
      >
        Second element
      </div>

      <button
        {...motionProps({
          enter: "bounceIn",
          last: true,
          finish: "visible"
        })}
      >
        Continue
      </button>
    </MotionRoot>
  );
}
```

React is only an adapter over the same behavior semantics used by the TypeScript runtime.

## Elm

Elm has its own native orchestrator.

It is not only an HTML attribute adapter.

The Elm runtime owns:

- the sequence state;
- current element;
- enter/wait/exit phases;
- timers through `Process.sleep`;
- `animationend`;
- `last` semantics;
- final state;
- replay/reset.

State machine:

```txt
Idle
  ↓
Entering
  ↓
Waiting
  ↓
Exiting
  ↓
next element
  ↓
Entering
  ↓
...
  ↓
Finished
```

Example item:

```elm
{ id = "logo"
, enter = "zoomInDown"
, exit = Just "zoomOutDown"
, waitMs = 1200
, finish = Motion.Hidden
, last = False
}
```

Last element:

```elm
{ id = "submit"
, enter = "bounceIn"
, exit = Nothing
, waitMs = 0
, finish = Motion.Visible
, last = True
}
```

Initialize the sequence:

```elm
( motion, _ ) =
    Motion.init items

( startedMotion, cmd ) =
    Motion.start motion
```

The Animate.css classes are applied by Elm according to the current state.

For Elm-owned UI interactions, click triggers can be normal Elm messages. External browser/system events can be connected through ports without moving orchestration logic out of Elm.

## Behaviors

The basic behavior declaration is:

```html
data-behavior="animate el-in el-out"
```

Available tokens:

| Token | Meaning |
| --- | --- |
| `animate` | element participates in motion orchestration |
| `el-in` | execute enter animation |
| `el-out` | execute exit animation |
| `last` | final element of the sequence |

Example:

```html
<div data-behavior="animate el-in el-out">
  Step 1
</div>

<div data-behavior="animate el-in last">
  Final step
</div>
```

## Per-element overrides

Any element can override the behavior configuration.

```html
<div
  data-behavior="animate el-in el-out"
  data-motion-in="fadeInUp"
  data-motion-out="fadeOutDown"
  data-motion-wait="800ms"
  data-motion-finish="hidden"
>
  Custom motion
</div>
```

Supported attributes:

| Attribute | Purpose |
| --- | --- |
| `data-motion-group` | assigns the element to a sequence/group |
| `data-motion-in` | overrides enter animation |
| `data-motion-out` | overrides exit animation |
| `data-motion-wait` | overrides wait duration |
| `data-motion-finish` | overrides final state |

## Final states

Three final states are supported.

```txt
visible
hidden
remove
```

Example:

```html
<div
  data-behavior="animate el-in last"
  data-motion-finish="visible"
>
  Keep me
</div>
```

Or:

```html
<div
  data-behavior="animate el-in el-out"
  data-motion-finish="remove"
>
  Remove me when finished
</div>
```

## Timing

Durations can use milliseconds or seconds.

```txt
250ms
800ms
1s
1.5s
10s
```

Global:

```ts
{
  wait: "2s"
}
```

Per element:

```html
data-motion-wait="800ms"
```

## Triggers

### Page loaded

```ts
start: ["page-loaded"]
```

### Click

```ts
start: ["click:#login"]
```

### Element becomes visible

```ts
start: ["visible:#pricing"]
```

This uses `IntersectionObserver`.

### Custom event

```ts
start: ["event:User.LoggedIn"]
```

Then:

```ts
window.dispatchEvent(
  new CustomEvent("User.LoggedIn")
);
```

### After another motion

```ts
start: ["after:#logo"]
```

This allows independent sequences to depend on completion of another element.

## Manual execution

Use an empty trigger list:

```ts
const runtime = new MotionBehaviors({
  in: "fadeIn",
  out: "fadeOut",
  start: []
});
```

Then run explicitly:

```ts
await runtime.run();
```

## Groups

Multiple independent sequences can live on the same page.

```html
<div
  data-behavior="animate el-in el-out"
  data-motion-group="hero"
>
  Hero 1
</div>

<div
  data-behavior="animate el-in last"
  data-motion-group="hero"
>
  Hero 2
</div>
```

Run only that sequence:

```ts
runtime.run("hero");
```

## Lifecycle events

The TypeScript/browser runtime emits DOM events during execution.

```txt
motion:start
motion:enter
motion:entered
motion:wait
motion:exit
motion:exited
motion:finish
```

Example:

```ts
document.addEventListener("motion:finish", event => {
  console.log(event.detail);
});
```

The event detail contains:

```ts
{
  element,
  index,
  group,
  phase
}
```

## Execution model

For a normal element:

```txt
start
  ↓
enter
  ↓
entered
  ↓
wait
  ↓
exit
  ↓
exited
  ↓
finish
```

For a `last` element:

```txt
start
  ↓
enter
  ↓
entered
  ↓
finish
```

## Accessibility

Animate.css already supports `prefers-reduced-motion`.

The TypeScript/browser runtime also checks:

```css
prefers-reduced-motion: reduce
```

When reduced motion is requested, animation execution is skipped while the orchestration continues.

## Examples

The repository contains:

```txt
examples/
├── all-possibilities.html
├── vanilla/
│   └── main.ts
└── react/
    └── App.tsx

motion-behaviors/
├── core.ts
├── index.ts
├── browser.js
├── react.tsx
└── elm/
    ├── elm.json
    ├── README.md
    └── src/
        ├── Main.elm
        └── MotionBehaviors.elm
```

`examples/all-possibilities.html` demonstrates:

- page-load sequence;
- enter and exit;
- per-element animation overrides;
- custom waits;
- `last`;
- `visible`;
- `hidden`;
- `remove`;
- click trigger;
- custom event trigger;
- visibility trigger;
- lifecycle events.

## Design principle

The project deliberately separates **motion implementation** from **motion orchestration**.

```txt
Animate.css
    =
how an element moves

motion-behaviors.css
    =
when an element moves
why it moves
what comes before it
what comes after it
when it ends
what state remains
```

This makes animation sequences declarative instead of scattering timers, callbacks and DOM manipulation throughout application code.

## Project status

Current implementation: experimental `0.1.x`.

The DSL and runtime API may still evolve while the behavior model is formalized.

## Credits

This repository builds on top of [Animate.css](https://animate.style/), which remains the CSS animation engine.

The orchestration layer in `motion-behaviors/` is the additional functionality provided by this project.
