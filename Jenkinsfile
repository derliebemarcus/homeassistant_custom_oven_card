pipeline {
  agent { label 'klymene' }

  options {
    disableConcurrentBuilds()
    skipDefaultCheckout(true)
  }

  stages {
    stage('Bootstrap migration files') {
      steps {
        checkout scm
        withCredentials([
          usernamePassword(
            credentialsId: 'github token',
            usernameVariable: 'GITHUB_RELEASE_USER',
            passwordVariable: 'GH_TOKEN'
          )
        ]) {
          sh '''#!/usr/bin/env bash
            set -euo pipefail

            branch='feat/migrate-shared-card-profile-17'
            repository='derliebemarcus/homeassistant_custom_oven_card'

            git fetch origin "refs/heads/${branch}:refs/remotes/origin/${branch}"
            git checkout -B "$branch" "origin/$branch"

            podman run --rm --pull=never \
              --userns=keep-id \
              --volume "$PWD:/workspace:z" \
              --workdir /workspace \
              registry.home.siczb.de/siczb/homeassistant-card-ci:24 \
              bash -lc '
                set -euo pipefail

                node <<"NODE"
                const fs = require("node:fs");
                const packagePath = "package.json";
                const packageJson = JSON.parse(fs.readFileSync(packagePath, "utf8"));
                packageJson.scripts.check = packageJson.scripts.check.replace(
                  "node --check dist/homeassistant_custom_oven_card.js",
                  "node --check dist/homeassistant_custom_oven_card.js && node --check scripts/sync-version.mjs"
                );
                packageJson.scripts["version:sync"] =
                  "node scripts/sync-version.mjs && npm install --package-lock-only --ignore-scripts && npm run build && node tests/validate.mjs";
                fs.writeFileSync(packagePath, JSON.stringify(packageJson, null, 2) + "\\n");

                const validatePath = "tests/validate.mjs";
                let validate = fs.readFileSync(validatePath, "utf8");
                validate = validate.replace(
                  "const releaseManifest = JSON.parse(await readFile(\".release-please-manifest.json\", \"utf8\"));",
                  "const changesetsConfig = JSON.parse(await readFile(\".changeset/config.json\", \"utf8\"));"
                );
                validate = validate.replace(
                  "assert.equal(releaseManifest[\".\"], packageJson.version, \"Release Please manifest version must match package.json\");",
                  [
                    "assert.equal(changesetsConfig.baseBranch, \"main\");",
                    "assert.equal(changesetsConfig.privatePackages.version, true);",
                    "assert.equal(changesetsConfig.privatePackages.tag, false);",
                    "const versionPattern = /const VERSION = \\\"([^\\\"\\n]+)\\\";/;",
                    "assert.equal(source.match(versionPattern)?.[1], packageJson.version, \"source version must match package.json\");",
                    "assert.equal(distribution.match(versionPattern)?.[1], packageJson.version, \"dist version must match package.json\");",
                    "assert.equal(packageJson.engines.node, \">=24\");"
                  ].join("\\n")
                );
                fs.writeFileSync(validatePath, validate);
                NODE

                cat > .changeset/pipeline-migration.md <<"CHANGESET"
---
"homeassistant_custom_oven_card": patch
---

Migrate card validation and releases to Jenkins.
CHANGESET

                npm install --package-lock-only --ignore-scripts \
                  --registry=https://artifacts.home.siczb.de/repository/npm-proxy/
                node scripts/sync-version.mjs
                npm run build
                node tests/validate.mjs
              '

            git add package.json package-lock.json \
              scripts/sync-version.mjs tests/validate.mjs \
              .changeset/ src/homeassistant_custom_oven_card.js \
              dist/homeassistant_custom_oven_card.js

            if git diff --cached --quiet; then
              echo 'Bootstrap files already generated.'
              exit 0
            fi

            git config user.name 'jenkins-release'
            git config user.email 'jenkins-release@users.noreply.github.com'
            git commit -m 'build: generate locked migration files'
            gh auth setup-git
            git remote set-url origin "https://github.com/${repository}.git"
            git push origin "HEAD:refs/heads/${branch}"
          '''
        }
      }
    }
  }
}
