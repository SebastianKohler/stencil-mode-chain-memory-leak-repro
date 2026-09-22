# Stencil SSR `modeResolutionChain` memory leak reproduction

This reproduction uses only Stencil. It has no Angular or Ionic dependency.

The component library has a global script that registers a style-mode resolver with `setMode()`. The generated hydrate bundle keeps `modeResolutionChain` at module scope. When `renderToString()` is called without the optional `modes` property, the chain is not cleared before the global script registers another resolver.

## Run

```sh
npm install
npm run build
npm run repro
```

The script performs 500 identical SSR renders and forces a full V8 garbage collection after every render. `heapUsed` grows approximately linearly.

Observed with Node 24 and Stencil 4.45.0:

```text
render 1:   heapUsed 7.38 MiB
render 100: heapUsed 11.99 MiB
render 200: heapUsed 16.31 MiB
render 300: heapUsed 20.65 MiB
render 400: heapUsed 24.94 MiB
render 500: heapUsed 29.24 MiB
```

Then run the workaround control:

```sh
npm run repro:workaround
```

This adds `modes: []` to the same calls. Stencil enters its existing reset branch and memory remains approximately flat.

```text
render 1:   heapUsed 7.52 MiB
render 100: heapUsed 7.77 MiB
render 200: heapUsed 7.81 MiB
render 300: heapUsed 7.88 MiB
render 400: heapUsed 7.89 MiB
render 500: heapUsed 7.92 MiB
```

## Expected fix

In `src/hydrate/runner/render.ts`, clear `modeResolutionChain` before the `Array.isArray(opts.modes)` condition:

```ts
modeResolutionChain.length = 0;
if (Array.isArray(opts.modes)) {
  opts.modes.forEach((mode) => setMode(mode));
}
```

The unconditional reset is appropriate because the existing comment already says each render is expected to use a new environment/document.
