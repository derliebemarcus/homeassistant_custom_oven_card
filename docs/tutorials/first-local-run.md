# First local run

## Goal

Create a verified local or test execution of Home Connect Oven Card.

## Prerequisites

- A checkout of `homeassistant_custom_oven_card`
- Tooling compatible with JavaScript, Home Assistant Lovelace, Home Connect, HACS
- No production secrets in the repository working tree

## Procedure

1. Install the card through HACS as a custom Dashboard repository.
2. For a manual installation, deploy the built JavaScript module from `dist/`.
3. Register the module as a Home Assistant JavaScript resource and reload the browser.

## Verification

```bash
npm ci
npm test
npm run build
```
