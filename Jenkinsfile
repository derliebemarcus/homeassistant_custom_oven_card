pipeline {
  agent { label 'klymene' }

  options {
    disableConcurrentBuilds()
    skipDefaultCheckout(true)
  }

  stages {
    stage('Finalize Dishwasher canary migration') {
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
            image='registry.home.siczb.de/siczb/homeassistant-card-ci:24'

            git fetch origin "refs/heads/${branch}:refs/remotes/origin/${branch}"
            git checkout -B "$branch" "origin/$branch"

            podman run --rm -i --userns=keep-id \
              -v "$PWD:/workspace:z" \
              -w /workspace \
              "$image" node <<'NODE'
            const fs = require('node:fs');
            const path = 'package.json';
            const pkg = JSON.parse(fs.readFileSync(path, 'utf8'));
            pkg.overrides = { ...(pkg.overrides || {}), qs: '6.15.2' };
            fs.writeFileSync(path, `${JSON.stringify(pkg, null, 2)}\n`);
            NODE

            podman run --rm --userns=keep-id \
              -v "$PWD:/workspace:z" \
              -w /workspace \
              "$image" npm install --package-lock-only --ignore-scripts

            podman run --rm -i --userns=keep-id \
              -v "$PWD:/workspace:z" \
              -w /workspace \
              "$image" node <<'NODE'
            const fs = require('node:fs');
            const lock = JSON.parse(fs.readFileSync('package-lock.json', 'utf8'));
            if (lock.packages['node_modules/@stryker-mutator/core']?.version !== '9.6.1') {
              throw new Error('Expected Stryker 9.6.1 from Dishwasher canary');
            }
            if (lock.packages['node_modules/qs']?.version !== '6.15.2') {
              throw new Error('Expected qs 6.15.2 from Dishwasher canary');
            }
            NODE

            cat > Jenkinsfile <<'JENKINSFILE'
@Library('jenkins-shared-library@main') _

ciHomeAssistantCard(
    scm: scm,
    agentLabel: 'klymene',
    mainBranch: 'main',
    repository: [
        owner: 'derliebemarcus',
        name: 'homeassistant_custom_oven_card',
    ],
    nodeJsVersion: 24,
    sourceFile: 'src/homeassistant_custom_oven_card.js',
    distributionFile: 'dist/homeassistant_custom_oven_card.js',
    releaseAsset: 'dist/homeassistant_custom_oven_card.js',
    coverageFile: 'coverage/lcov.info',
    junitPattern: 'reports/junit/*.xml',
    coverageFloor: 81,
    reportRoot: 'reports',
    mutation: [
        artifacts: 'reports/mutation/**',
    ],
    sonar: [
        projectKey: 'homeassistant_custom_oven_card',
        projectName: 'Home Assistant Custom Oven Card',
        server: 'SonarQube',
        timeoutMinutes: 15,
    ],
    coveralls: [
        credentialId: 'Coveralls',
    ],
    security: [
        gitleaks: [enabled: true],
        trivy: [enabled: true],
        codeql: [
            enabled: true,
            toolName: 'codeql',
            languages: ['javascript-typescript', 'actions'],
        ],
        osv: [enabled: true],
        actionlint: [enabled: true],
    ],
    repositoryChecks: [
        validateScript: 'tests/validate-repository.mjs',
        lockfileCheck: true,
    ],
    github: [
        credentialId: 'github token',
        publishStageChecks: true,
        publishFinalCheck: false,
        statusContext: 'Continuous Integration / Jenkins',
        title: 'Oven Card Quality Gates',
    ],
    homeAssistant: [
        enabled: true,
    ],
)

ciChangesetsRelease(
    scm: scm,
    agentLabel: 'klymene',
    mainBranch: 'main',
    repository: [
        owner: 'derliebemarcus',
        name: 'homeassistant_custom_oven_card',
    ],
    asset: 'dist/homeassistant_custom_oven_card.js',
    versionSyncCommand: 'npm run version:sync',
    credentialId: 'github token',
    autoMergePatch: true,
)
JENKINSFILE

            git add package.json package-lock.json Jenkinsfile
            if git diff --cached --quiet; then
              exit 0
            fi

            git config user.name 'jenkins-release'
            git config user.email 'jenkins-release@users.noreply.github.com'
            git commit -m 'fix: align dependencies with Dishwasher canary'
            gh auth setup-git
            git remote set-url origin "https://github.com/${repository}.git"
            git push origin "HEAD:refs/heads/${branch}"
          '''
        }
      }
    }
  }
}
