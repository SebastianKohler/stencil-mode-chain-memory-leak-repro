import { Component, h } from '@stencil/core';

@Component({
  tag: 'mode-leak-repro',
  styleUrls: {
    md: 'mode-leak-repro.md.css'
  },
  shadow: true
})
export class ModeLeakRepro {
  render() {
    return <p>Stencil SSR mode-chain leak reproduction</p>;
  }
}
