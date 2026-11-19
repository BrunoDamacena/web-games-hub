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

Run `npm run deploy:check` to verify the game logic before publishing. Then publish the contents of `dist/` with your static hosting provider. Set the publish directory to `dist` and leave the build command blank if your provider asks for those settings.
