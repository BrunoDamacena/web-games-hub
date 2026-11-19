import { renameSync } from 'node:fs';
import { cp, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { basename, join, relative } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const source = fileURLToPath(new URL('../src/', import.meta.url));
const output = fileURLToPath(new URL('../build', import.meta.url));

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

async function renderSite(destination) {
  const layout = await readFile(new URL('../src/layout.html', import.meta.url), 'utf8');

  await cp(source, destination, {
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
    await writeFile(join(destination, directory, 'index.html'), html);
  }
}

export async function buildSite() {
  const staging = await mkdtemp(fileURLToPath(new URL('../.build-', import.meta.url)));
  const next = join(staging, 'next');
  const previous = join(staging, 'previous');
  let keepBackup = false;

  try {
    await renderSite(next);

    try {
      renameSync(output, previous);
      keepBackup = true;
    } catch (error) {
      if (error.code !== 'ENOENT') throw error;
    }

    try {
      renameSync(next, output);
      keepBackup = false;
    } catch (error) {
      if (keepBackup) {
        renameSync(previous, output);
        keepBackup = false;
      }
      throw error;
    }
  } finally {
    if (!keepBackup) await rm(staging, { recursive: true, force: true });
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  await buildSite();
}
