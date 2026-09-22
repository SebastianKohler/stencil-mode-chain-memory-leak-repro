import { setMode } from '@stencil/core';

export default function globalScript(): void {
  setMode(() => 'md');
}
