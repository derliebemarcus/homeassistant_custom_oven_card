# Changesets

Add one Markdown file in this directory for every release-relevant change.

```markdown
---
"homeassistant_custom_oven_card": patch
---

Describe the user-visible change.
```

Use `patch`, `minor` or `major`. CI-only and documentation-only changes do not require a Changeset.

Jenkins consumes pending Changesets into a version pull request. After that pull request is merged, Jenkins creates the tag, uploads the card asset to a draft GitHub Release and publishes the immutable release.
