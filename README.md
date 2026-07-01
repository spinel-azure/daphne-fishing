# Daphne Fishing（ダフューン・フィッシング）

Daphne Fishing は、ブラウザで遊べる釣りゲームのプロトタイプです。

実際のゲーム本体は daphne_fishing/ フォルダ内にあります。

リポジトリ直下の index.html は、GitHub Pagesからゲームを起動するためのリダイレクト用ページです。

# Daphne Fishing

Daphne Fishing is a browser-based fishing game prototype.

The playable game lives in the `daphne_fishing/` directory. The root `index.html` redirects to it so GitHub Pages can open the game from the repository top page.

## ローカルで遊ぶ

ブラウザでリポジトリ直下の index.html を開くか、Windowsでは次のファイルを実行してください。

start_daphne_fishing.bat

このバッチファイルは PowerShell の簡易ローカルサーバーを起動し、自動的にブラウザでゲームを開きます。

## Play Locally

Open the root `index.html` in a browser, or on Windows run:

```bat
start_daphne_fishing.bat
```

The batch file starts a small local PowerShell server and opens the game in your browser.

## Project Structure

```txt
index.html                  Redirect entry for GitHub Pages
start_daphne_fishing.bat    Windows local launcher
tools/                      Local development helper scripts
daphne_fishing/             Game files
  index.html
  css/
  js/
  fonts/
  images/
```

## GitHub Pages

Use the repository root as the Pages source. The root `index.html` will redirect to:

```txt
daphne_fishing/
```

## Notes

- `.agents/` is local Codex workspace data and is not needed in GitHub.
- `.git/` is Git's internal repository data and should never be uploaded manually.
- `rod_three_prototype/` is an old 3D rod experiment. The current game already has the Three.js rod work integrated in `daphne_fishing/js/rod.js`, so the prototype folder is excluded from Git by default.
- Source art files such as `.psd` are excluded by default. Exported game assets should stay in `daphne_fishing/images/`.
