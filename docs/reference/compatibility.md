# Compatibility

- Home Assistant 2026.7.0 or newer
- Node.js 24 for development and CI
- Current Chrome, Firefox, Edge, and Safari releases
- Home Connect ovens exposing supported standard entities

Dependency compatibility is maintained through npm overrides and the npm lockfile. The
development toolchain pins `qs` to `6.15.3` and resolves `fast-uri` to `3.1.4` for the
current dependency audit. These internal maintenance updates require no Home Assistant
configuration changes.

Breaking compatibility changes require an explicit major release or migration note.
