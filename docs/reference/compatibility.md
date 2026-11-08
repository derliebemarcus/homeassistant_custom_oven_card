# Compatibility

- Home Assistant 2026.7.0 or newer
- Node.js 24 for development and CI
- Current Chrome, Firefox, Edge, and Safari releases
- Home Connect ovens exposing supported standard entities

Dependency compatibility is maintained through npm overrides and the npm lockfile. The
development toolchain pins `qs` to `6.17.1` and resolves `fast-uri` to `3.1.9` for the
current dependency audit. These internal maintenance updates require no Home Assistant
configuration changes.

Breaking compatibility changes require an explicit major release or migration note.

CI compatibility baseline: Home Assistant Core **2026.11.0** with Node.js 24. The developer-only dependency graph uses Stryker 10.1.1 and targeted npm overrides for `qs` 6.17.1 and `minimatch` 11.0.5. Security exemptions are not used for the npm/OSV findings addressed by this change.
