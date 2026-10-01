# MONSTER REALMS — PERSISTENT CHARACTER ASSETS POLICY

## ABSOLUTE RULE: PROTECT CHARACTER PNG ASSETS FROM FUTURE UPDATES

All character PNG assets located under:
```
public/assets/characters/
```
and portrait assets under:
```
public/assets/portraits/
```
are **PERMANENT GAME CONTENT ASSETS**, NOT generated code, placeholders, or disposable cache.

### STRICT DIRECTIVES FOR ALL FUTURE UPDATES:
1. **NEVER DELETE** any character PNG files or portrait PNG files.
2. **NEVER OVERWRITE** existing character portrait or combat sprite files with blanks, lower quality, or other monsters' art.
3. **NEVER REMOVE** portrait references or reset portrait paths.
4. **NEVER REPLACE** portrait or sprite paths with placeholders or generated SVGs when PNG assets exist.
5. **NEVER REGENERATE** existing character assets unless the user explicitly requests: `"Delete the character assets."`
6. **NEVER CHANGE** the canonical character asset directory:
   - Canonical directory: `public/assets/characters/`
   - Canonical portraits: `public/assets/portraits/`
   - Do NOT create competing directories (such as `public/characters/`, `src/assets/characters/`, `assets/characters/`).
7. **DO NOT PERFORM AUTOMATIC "CLEANUP"** of character files based on whether a file appears unused. Character files are intentional game content used across Combat, Party, Codex, and Summon screens.
8. **DO NOT EMBED** character assets as giant base64 inline strings in code. Monster data definitions and manifests must reference permanent asset paths.
9. **MANIFEST INTEGRITY**: The authoritative character manifest resides in `src/services/character2d/monsterAssetManifest.ts` and `src/services/character2d/monster2DRegistry.ts`. Do not reset or wipe these paths during UI, combat, XP, skill, or engine updates.
10. **ELEMENTAL VARIANTS**: Monsters with Fire/Water/Grass/Light/Dark variants maintain independent asset paths (e.g. `public/assets/characters/variants/var_nekohime_grass/` vs `public/assets/characters/variants/var_pyrosaur_fire/`). Do NOT let one variant overwrite another.
