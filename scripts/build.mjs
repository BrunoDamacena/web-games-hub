import { cp, mkdir, readFile, writeFile } from 'node:fs/promises';
import { basename, dirname, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const source = fileURLToPath(new URL('../src/', import.meta.url));
const output = fileURLToPath(new URL('../build/', import.meta.url));
const layout = await readFile(new URL('../src/layout.html', import.meta.url), 'utf8');

const pages = [
  {
    directory: '',
    title: 'Central de Jogos',
    description: 'Escolha um jogo e divirta-se no navegador com a Central de Jogos.',
  },
  {
    directory: 'games/ring-sort',
    title: 'Anéis por Cor · Central de Jogos',
    description: 'Separe os anéis por cor no seu ritmo na Central de Jogos.',
  },
  {
    directory: 'games/palavra',
    title: 'Palavra · Central de Jogos',
    description: 'Adivinhe uma palavra de cinco letras em até seis tentativas e jogue quantas vezes quiser.',
  },
];

await cp(source, output, {
  recursive: true,
  filter: path => basename(path) !== 'page.html' && relative(source, path) !== 'layout.html',
});

for (const { directory, title, description } of pages) {
  const isGame = directory !== '';
  const root = isGame ? '../'.repeat(directory.split('/').length) : './';
  const pagePath = directory ? `${directory}/` : '';
  const content = await readFile(new URL(`../src/${pagePath}page.html`, import.meta.url), 'utf8');
  const fields = {
    title,
    description,
    root,
    allGames: isGame ? `      <a class="nav-link" href="${root}">Todos os jogos</a>\n` : '',
    content,
    gameScript: isGame ? '  <script type="module" src="./game.mjs"></script>\n' : '',
  };
  const html = layout.replace(/{{(\w+)}}/g, (_, name) => fields[name]);
  const target = new URL(`../build/${pagePath}index.html`, import.meta.url);
  await mkdir(dirname(fileURLToPath(target)), { recursive: true });
  await writeFile(target, html);
}
