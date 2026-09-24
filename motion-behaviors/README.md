# motion-behaviors.css runtime

A declarative behavior/orchestration layer for Animate.css.

```ts
const animate = {
  in: "zoomInDown",
  out: "zoomOutDown",
  start: ["page-loaded"],
  wait: "10s",
  finish: "hidden",
  lastFinish: "visible"
}
```

```html
<img data-behavior="animate el-in el-out" src="logo1.png">
<img data-behavior="animate el-in el-out" src="logo2.png">
<input data-behavior="animate el-in el-out">
<input type="submit" data-behavior="animate el-in last">
```

The runtime only orchestrates. Animate.css remains responsible for animation implementation.

Triggers: `page-loaded`, `click:#selector`, `visible:#selector`, `event:Event.Name`, `after:#element-id`.

Per-element attributes: `data-motion-group`, `data-motion-in`, `data-motion-out`, `data-motion-wait`, `data-motion-finish`.

Lifecycle events: `motion:start`, `motion:enter`, `motion:entered`, `motion:wait`, `motion:exit`, `motion:exited`, `motion:finish`.

Adapters:
- Pure TypeScript: `index.ts`
- React: `react.tsx`
- Elm: `elm/src/MotionBehaviors.elm`

Elm emits the same declarative data contract; TypeScript performs the browser side effects.
