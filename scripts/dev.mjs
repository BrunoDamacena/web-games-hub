import { spawn } from 'node:child_process';
import { watch } from 'node:fs';
import { buildSite } from './build.mjs';

await buildSite();

let timer;
let build = Promise.resolve();
const watcher = watch(new URL('../src/', import.meta.url), { recursive: true }, () => {
  clearTimeout(timer);
  timer = setTimeout(() => {
    build = build.then(async () => {
      await buildSite();
      console.log('Site rebuilt.');
    }).catch(error => console.error('Rebuild failed:', error));
  }, 100);
});

const server = spawn('serve', ['build', '--listen', 'tcp://127.0.0.1:8000', '--no-port-switching'], {
  stdio: 'inherit',
  shell: process.platform === 'win32',
});

function stopWatching() {
  watcher.close();
  clearTimeout(timer);
}

server.on('error', error => {
  console.error('Could not start the dev server:', error);
  stopWatching();
  process.exitCode = 1;
});
server.on('exit', code => {
  stopWatching();
  process.exitCode ||= code ?? 0;
});
watcher.on('error', error => {
  console.error('Could not watch source files:', error);
  stopWatching();
  server.kill();
  process.exitCode = 1;
});

for (const signal of ['SIGINT', 'SIGTERM']) {
  process.on(signal, () => {
    stopWatching();
    server.kill();
  });
}
