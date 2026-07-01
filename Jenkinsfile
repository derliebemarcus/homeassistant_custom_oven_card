pipeline {
  agent { label 'klymene' }

  options {
    disableConcurrentBuilds()
    skipDefaultCheckout(true)
  }

  stages {
    stage('Finalize migration metadata') {
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

                npm pkg set "scripts.check=node --check src/homeassistant_custom_oven_card.js && node --check dist/homeassistant_custom_oven_card.js && node --check scripts/sync-version.mjs && node --check tests/unit/test-helpers.mjs && node --check tests/unit/card.test.mjs && node --check tests/unit/lifecycle.test.mjs"
                npm pkg set "scripts.version:sync=node scripts/sync-version.mjs && npm install --package-lock-only --ignore-scripts && npm run build && node tests/validate.mjs"

                node <<"NODE"
                const fs = require("node:fs");
                const path = "tests/validate.mjs";
                let text = fs.readFileSync(path, "utf8");
                text = text.replace(
                  "const releaseManifest = JSON.parse(await readFile(\".release-please-manifest.json\", \"utf8\"));",
                  "const changesetsConfig = JSON.parse(await readFile(\".changeset/config.json\", \"utf8\"));"
                );
                text = text.replace(
                  "assert.equal(releaseManifest[\".\"], packageJson.version, \"Release Please manifest version must match package.json\");",
                  "assert.equal(changesetsConfig.baseBranch, \"main\");\\nassert.equal(changesetsConfig.privatePackages.version, true);\\nassert.equal(changesetsConfig.privatePackages.tag, false);\\nconst versionPattern = /const VERSION = \\\"([^\\\"\\\\n]+)\\\";/;\\nassert.equal(source.match(versionPattern)?.[1], packageJson.version, \"source version must match package.json\");\\nassert.equal(distribution.match(versionPattern)?.[1], packageJson.version, \"dist version must match package.json\");\\nassert.equal(packageJson.engines.node, \">=24\");"
                );
                fs.writeFileSync(path, text);
                NODE

                printf "%s\\n" \
                  "---" \
                  "\\\"homeassistant_custom_oven_card\\\": patch" \
                  "---" \
                  "" \
                  "Migrate card validation and releases to Jenkins." \
                  > .changeset/pipeline-migration.md

                node tests/validate.mjs
              '

            git add package.json tests/validate.mjs .changeset/

            if git diff --cached --quiet; then
              echo 'Migration metadata already finalized.'
              exit 0
            fi

            git config user.name 'jenkins-release'
            git config user.email 'jenkins-release@users.noreply.github.com'
            git commit -m 'add: configure Changesets release metadata'
            gh auth setup-git
            git remote set-url origin "https://github.com/${repository}.git"
            git push origin "HEAD:refs/heads/${branch}"
          '''
        }
      }
    }
  }
}
