# Changesets

Add one Markdown file for every change that should create a release.

Use `patch`, `minor` or `major` explicitly. CI-only and documentation-only changes do not require a Changeset.

Jenkins consumes pending Changesets into a version pull request and publishes the immutable GitHub Release after the version pull request is merged.
