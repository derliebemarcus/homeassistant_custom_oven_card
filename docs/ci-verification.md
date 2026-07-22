# Continuous integration verification

Forgejo is the authoritative SCM provider for this repository. Jenkins loads
`jenkins-shared-library@main` and enters the central `homeassistant-card` profile through
`ciRepositoryPipeline`.

The central profile owns checkout, documentation-only classification, repository documentation
validation, JavaScript quality gates, security scans, SonarQube and Coveralls reporting, Home
Assistant validation, release handling, status publication, cleanup, and final notification.

Stage groups run sequentially by default. Parallel execution is only used where a profile enables
it explicitly.

Active Forgejo workflows are stored under `.forgejo/workflows`. Jenkins validates them with
Actionlint in Forgejo compatibility mode. CodeQL analyses the supported `javascript-typescript`
language; workflow syntax is covered by Actionlint instead of CodeQL's GitHub Actions language.

Release metadata and final CI status are published to `siczb/homeassistant_custom_oven_card` through
the Forgejo API. GitHub remains a downstream mirror and is not used as the Jenkins SCM provider.

A successful protected `main` build is the final acceptance check after the migration PR is merged.
