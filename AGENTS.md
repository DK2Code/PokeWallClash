# PokeWallClash development

- The user wants completed game updates pushed to `DK2Code/PokeWallClash` so GitHub Pages stays current. After appropriate checks pass, commit and push to `main`, then verify the Pages deployment. Do not force-push or overwrite unrelated changes.
- Use repository-local author and committer name `DK`, email `70762577+DK2Code@users.noreply.github.com`, and the saved `DK2Code` GitHub account. Do not change global Git identity.
- Publish with `.github/workflows/deploy-pages.yml`; the public game is https://dk2code.github.io/PokeWallClash/.
- Keep Pokémon Arena reference files read-only. Preserve the imported modules in `dist/arena/` byte-for-byte; make tower-defense adaptations outside that directory.
- Run `npm run check` for gameplay or animation changes. Keep QA artifacts and local hosting metadata out of commits.
