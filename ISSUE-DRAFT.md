# Title

bug: hydrate `modeResolutionChain` retains every SSR render when `modes` is omitted

# Description

## Stencil version

`@stencil/core@4.45.0`

The problem is also present in the Stencil hydrate runtimes embedded in Ionic 8.6.0 through Ionic 9.0.4. The last tested non-leaking Ionic bundle uses Stencil Hydrate Platform 4.20.0; the first tested leaking bundle uses 4.33.1.

## Current behavior

Repeated calls to `renderToString()` retain memory when the generated hydrate app has a global script that calls `setMode()` and the caller does not provide the optional `modes` property.

A full V8 garbage collection after every completed render does not reclaim the retained heap. With the attached framework-free reproduction, 500 identical renders grow `heapUsed` from 7.38 MiB to 29.24 MiB.

## Expected behavior

Completed SSR renders should be collectible. Repeated identical renders should not cause approximately linear live-heap growth.

## Minimal reproduction

The attached reproduction uses only Stencil 4.45.0. It contains:

- one mode-aware component;
- one global script that calls `setMode(() => 'md')`;
- a loop calling `renderToString()` 500 times;
- an explicit `global.gc()` after every completed render.

Run:

```sh
npm install
npm run build
npm run repro
```

Observed with Node 24.20.0:

```text
render 1:   heapUsed 7.38 MiB
render 100: heapUsed 11.99 MiB
render 200: heapUsed 16.31 MiB
render 300: heapUsed 20.65 MiB
render 400: heapUsed 24.94 MiB
render 500: heapUsed 29.24 MiB
```

Control:

```sh
npm run repro:workaround
```

The control adds `modes: []` and stays approximately flat:

```text
render 1:   heapUsed 7.52 MiB
render 100: heapUsed 7.77 MiB
render 200: heapUsed 7.81 MiB
render 300: heapUsed 7.88 MiB
render 400: heapUsed 7.89 MiB
render 500: heapUsed 7.92 MiB
```

## Cause

PR [#5953](https://github.com/stenciljs/core/pull/5953) moved `modeResolutionChain` out of the per-render hydrate closure and into module scope so the global runtime and hydrate runtime share it.

The generated global script calls `setMode()` inside each `hydrateFactory()` invocation. However, `src/hydrate/runner/render.ts` resets the module-scoped chain only inside this condition:

```ts
if (Array.isArray(opts.modes)) {
  modeResolutionChain.length = 0;
  opts.modes.forEach((mode) => setMode(mode));
}
```

When `opts.modes` is omitted, every render appends another resolver. That resolver retains the corresponding hydrate closure and its render graph.

## Suggested fix

At minimum, clear the mode chain for every render, as the existing source comment already says each `renderToString()` call is expected to use a new environment/document:

```ts
modeResolutionChain.length = 0;
if (Array.isArray(opts.modes)) {
  opts.modes.forEach((mode) => setMode(mode));
}
```

Applying that one-line change to the generated hydrate bundle keeps the forced-GC heap flat. A more comprehensive design could make the chain render-local, avoiding shared mutable mode state between concurrent SSR renders.

## Regression information

The behavior was introduced by the mode-support work in PR #5953. Current `main` still contains the conditional reset.
