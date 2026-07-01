# Daphne Fishing

Daphne Fishing is a browser-based fishing game prototype.

The game now opens directly from the repository root:

```txt
index.html
```

## Play Locally

Open `index.html` in a browser.

Some browsers may restrict network module imports when opened from a local file. If the 3D rod does not load locally, use a small local web server or GitHub Pages.

## Project Structure

```txt
index.html    Game entry point
css/          Styles
js/           Game logic
fonts/        Font assets
images/       Image assets
bgm/          Audio assets placeholder
```

## GitHub Pages

Use the repository root as the Pages source. The game should open directly from the Pages top URL.

## Notes

- `.agents/` is local Codex workspace data and is not needed in GitHub.
- `.git/` is Git's internal repository data and should never be uploaded manually.
- `rod_three_prototype/` is an old 3D rod experiment. The current game already has the Three.js rod work integrated in `js/rod.js`, so the prototype folder is excluded from Git by default.
- Source art files such as `.psd` are excluded by default. Exported game assets should stay in `images/`.
