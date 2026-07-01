pipeline {
  agent { label 'klymene' }

  options {
    disableConcurrentBuilds()
    skipDefaultCheckout(true)
  }

  stages {
    stage('Bootstrap locked files') {
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
                npm install --package-lock-only --ignore-scripts \
                  --registry=https://artifacts.home.siczb.de/repository/npm-proxy/
                node scripts/sync-version.mjs
                npm run build
                node tests/validate.mjs
              '

            git add package-lock.json \
              src/homeassistant_custom_oven_card.js \
              dist/homeassistant_custom_oven_card.js

            if git diff --cached --quiet; then
              echo 'Locked files already generated.'
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
