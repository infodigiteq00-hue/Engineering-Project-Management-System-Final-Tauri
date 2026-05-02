# Tauri Release Steps (Windows + macOS + Linux)

## One-time setup (local machine)

1. Install Rust and Cargo.
2. Install Visual Studio C++ Build Tools (Windows).
3. Verify:
   - `cargo --version`
   - `rustc --version`
4. Run local app once:
   - `npm install`
   - `npm run tauri dev`

## One-time setup (GitHub repo)

1. Push this repository to GitHub.
2. Ensure workflow file exists: `.github/workflows/tauri-release.yml`.
3. Go to GitHub repo -> Settings -> Actions -> General.
4. Confirm Actions are enabled.
5. In repo settings, keep default `GITHUB_TOKEN` permissions as read/write for workflows that create releases.

## Create a release

1. Update version in `src-tauri/tauri.conf.json` (example: `0.1.1`).
2. Commit and push.
3. Create git tag:
   - `git tag v0.1.1`
   - `git push origin v0.1.1`
4. GitHub Action runs automatically for:
   - Windows
   - macOS
   - Linux
5. Wait for all matrix jobs to finish.
6. Open GitHub -> Releases and verify assets are attached.

## If a workflow fails

1. Open the failed job logs in GitHub Actions.
2. Common fixes:
   - Missing Linux libs (already handled in workflow).
   - Rust crate/network timeout: rerun job.
   - Version/tag mismatch: ensure tag format is `vX.Y.Z`.
3. Re-run failed jobs from GitHub Actions UI.

