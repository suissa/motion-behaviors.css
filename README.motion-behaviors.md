# motion-behaviors.css

This fork keeps Animate.css as the animation engine and adds a declarative orchestration layer.

See [motion-behaviors/README.md](motion-behaviors/README.md).

Examples:
- [All possibilities](examples/all-possibilities.html)
- [Pure TypeScript](examples/vanilla/main.ts)
- [React](examples/react/App.tsx)
- [Elm](motion-behaviors/elm/src/Main.elm)

```txt
DSL / data-behavior
      ↓
MotionBehaviors runtime
      ↓
Animate.css classes + browser events
```

No animation is reimplemented in JavaScript. The runtime coordinates triggers, sequence, waits, lifecycle events and final element state.
