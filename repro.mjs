import { renderToString } from './hydrate/index.mjs';

if (typeof global.gc !== 'function') {
  throw new Error('Run Node with --expose-gc');
}

const iterations = Number(process.env.ITERATIONS || 500);
const useWorkaround = process.argv.includes('--modes-empty');
const options = {
  fullDocument: true,
  ...(useWorkaround ? { modes: [] } : {})
};
const html = '<!doctype html><html><head></head><body><mode-leak-repro></mode-leak-repro></body></html>';

console.log(`Stencil 4.45.0; modes: ${useWorkaround ? '[]' : 'undefined'}`);
console.log('A full GC is forced after every completed render.');

for (let index = 1; index <= iterations; index++) {
  await renderToString(html, options);
  global.gc();

  if (index === 1 || index % 100 === 0) {
    const { heapUsed, rss } = process.memoryUsage();
    console.log({
      render: index,
      heapUsedMiB: Number((heapUsed / 1048576).toFixed(2)),
      rssMiB: Number((rss / 1048576).toFixed(2))
    });
  }
}
