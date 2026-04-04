# Bunny Catching Carrots

A browser-based 2D side-scrolling bunny platformer built with Phaser, TypeScript, and Vite.

## Features

- Keyboard and Xbox-style controller support
- Procedurally varied one-minute runs with platforms and no pits
- Upper-right HUD with score, high score, and timer state
- Session-scoped high score persistence
- Finish-line feast that auto-collects every remaining carrot
- GitHub Actions workflow for test/build and GitHub Pages deployment

## Controls

- Move: `A` / `D` or `Left Arrow` / `Right Arrow`
- Jump: `Space`, `W`, `Z`, or `Up Arrow`
- Pause: `Escape`
- Start or restart: `Enter`
- Xbox controller: left stick or D-pad to move, `A` to jump, `Start` to pause or restart

## Local Development

```bash
nvm use
npm install
npm run dev
```

This repo targets Node 24. Use the checked-in [.nvmrc](/Users/rharrington/src/personal/bunny-catching-carrots/.nvmrc) or another equivalent version manager setting before installing dependencies.

## Verification

```bash
npm run lint
npm test
npm run test:integration
npx playwright install chromium
npm run test:e2e
npm run build
```

## Deployment

The site is built and deployed to GitHub Pages from GitHub Actions whenever `main` is updated. The Vite base path is derived automatically from the `GITHUB_REPOSITORY` environment variable inside CI.

## Test Layers

- `npm test`: unit and integration coverage through Vitest
- `npm run test:integration`: integration-focused bridge and UI coverage
- `npm run test:e2e`: Playwright browser coverage against the built preview server
