# Web Games Hub

Web Games Hub is a browser games hub. Its first game, Ring Sort, is a color-sorting puzzle.

## Frontend stack

The frontend uses plain HTML, CSS, and vanilla JavaScript with native ES modules. There is no frontend framework or build step. The only npm development dependency is the local static server. The `dist/` directory contains the site's editable files and can be served directly.

## Run locally

With Node.js 20 or newer and npm installed, run these commands from the repository root:

```sh
npm ci
npm run dev
```

Open [Web Games Hub locally](http://127.0.0.1:8000) and select **Ring Sort** from the games menu. `npm start` also starts the local server. Refresh the page after making edits, and press **Ctrl+C** in the terminal to stop the server.

## Project layout

- `dist/index.html` is the games menu.
- `dist/style.css` contains the shared styles.
- `dist/games/ring-sort/` contains the game page, rules, and puzzle generator.

## Run the tests

Run the Ring Sort unit tests from the repository root:

```sh
npm test
```

The Ring Sort tests use Node's built-in test runner and can run before installing the local static server.

## Deployment

In the `web-games-hub` repository, open **Settings → Pages** and select **GitHub Actions** as the source under **Build and deployment**.

The deployment workflow runs on pushes to `main`. It runs `npm run deploy:check`, packages `dist/` as-is, and publishes it to [Web Games Hub](https://brunodamacena.github.io/web-games-hub/) when the checks pass. To redeploy the current `main` manually, open **Actions → Deploy to GitHub Pages → Run workflow** and select `main`.

### Require deployment checks before merging

The **Deployment readiness** job runs `npm run deploy:check` on pull requests targeting `main`. After the check passes on GitHub for the first time, open **Settings → Branches** and add or edit the protection rule for `main`. Enable **Require status checks to pass before merging** and select **Deployment readiness** from GitHub Actions. Enable **Require branches to be up to date before merging** to check against the latest `main`. Enable **Do not allow bypassing the above settings** to apply the rule to administrators as well.
