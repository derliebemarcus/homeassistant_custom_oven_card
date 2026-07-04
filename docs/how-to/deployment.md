# Deployment

1. Jenkins validates source, tests, security checks, and the distribution artifact.
2. Changesets records release intent and creates the version pull request.
3. A tagged release publishes `dist/homeassistant_custom_oven_card.js` for HACS.

Documentation-only changes must never execute deployment or publication stages.
