# Web Games Hub

Web Games Hub is a browser games hub. Play Ring Sort, a color-sorting puzzle, or Palavra, a Brazilian Portuguese word puzzle.

## Frontend stack

The frontend uses plain HTML, CSS, and vanilla JavaScript with native ES modules. A dependency-free Node.js script combines the shared HTML layout with each page and writes the static site to `build/`. The only npm development dependency is the local static server.

## Run locally

With Node.js 20 or newer and npm installed, run these commands from the repository root:

```sh
npm ci
npm run dev
```

Open [Web Games Hub locally](http://127.0.0.1:8000) and select a game from the menu. `npm start` also starts the local server. The dev server rebuilds automatically when files in `src/` change. Refresh the browser after the rebuild. When finished, press **Ctrl+C** in the terminal to stop the server.

## Project layout

- `src/layout.html` contains the shared document structure, header, theme switch, and footer.
- `src/page.html` contains the home page’s game list.
- `src/games/` contains each game’s page content, logic, and assets.
- `src/style.css` and `src/theme.js` are shared by all pages.
- `scripts/build.mjs` defines each page’s path and metadata and generates the site.

Palavra uses a snapshot of Termo’s single-word game data from the [public game bundle](https://term.ooo/multi.811eb29.js). It includes 10,589 accepted words with Termo’s display spellings and 1,442 possible answers. Palavra selects answers at random. [Termo attributes the word data to its MIT-licensed Brazilian Portuguese lexicon](https://term.ooo/sobre/). The lexicon license is included alongside the word lists.

## Run the tests

Run the unit tests from the repository root:

```sh
npm test
```

The tests use Node's built-in test runner and can run before installing the local static server.

## Deployment

In the `web-games-hub` repository, open **Settings → Pages** and select **GitHub Actions** as the source under **Build and deployment**.

The deployment workflow runs on pushes to `main`. It runs `npm run deploy:check` to test and build the site, then publishes `build/` to [Web Games Hub](https://brunodamacena.github.io/web-games-hub/) when the checks pass. To redeploy the current `main` manually, open **Actions → Deploy to GitHub Pages → Run workflow** and select `main`.

### Require deployment checks before merging

The **Deployment readiness** job runs `npm run deploy:check` on pull requests targeting `main`. After the check passes on GitHub for the first time, open **Settings → Branches** and add or edit the protection rule for `main`. Enable **Require status checks to pass before merging** and select **Deployment readiness** from GitHub Actions. Enable **Require branches to be up to date before merging** to check against the latest `main`. Enable **Do not allow bypassing the above settings** to apply the rule to administrators as well.
