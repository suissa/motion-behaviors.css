# Elm runtime

This is a real Elm implementation of the motion orchestrator, not only an attribute adapter.

The Elm runtime owns:

- sequence state;
- current item/index;
- enter/wait/exit phases;
- timer scheduling through `Process.sleep`;
- `animationend` handling;
- `last` semantics;
- final states: `Visible`, `Hidden`, `Remove`;
- replay/reset.

Animate.css still owns only the CSS animation implementation.

## State machine

```txt
Idle
  -> Entering
  -> Waiting
  -> Exiting
  -> next item
  -> ...
  -> Finished
```

For a last item or an item without an exit animation:

```txt
Entering
  -> Finished/next
```

The example in `src/Main.elm` starts the sequence at Elm initialization, equivalent to `page-loaded`.

For Elm-owned UIs, click triggers are ordinary Elm messages and do not need JavaScript.

External browser/custom events can be bridged with Elm ports when needed, but the sequence/timing/orchestration itself remains in Elm.
