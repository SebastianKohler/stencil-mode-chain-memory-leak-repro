import type { Config } from '@stencil/core';

export const config: Config = {
  namespace: 'modeleakrepro',
  globalScript: 'src/global.ts',
  outputTargets: [
    {
      type: 'dist-hydrate-script',
      dir: 'hydrate'
    }
  ]
};
