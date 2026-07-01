@Library('jenkins-shared-library@main') _

// BEGIN LOCKFILE BOOTSTRAP
if (env.CHANGE_ID == '23' || env.BRANCH_NAME == 'migration-final-17') {
    node('klymene') {
        deleteDir()
        checkout scm
        withCredentials([string(credentialsId: 'github token', variable: 'GITHUB_TOKEN')]) {
            sh '''
                set -euo pipefail
                git fetch origin migration-final-17
                git checkout -B migration-final-17 origin/migration-final-17

                podman run --rm --pull=always --userns=keep-id \
                  -v "$PWD:/build:z" -w /build \
                  registry.home.siczb.de/siczb/homeassistant-card-ci:24 \
                  /bin/bash -lc 'npm install --package-lock-only --ignore-scripts'

                python3 - <<'PY'
from pathlib import Path
path = Path('Jenkinsfile')
text = path.read_text()
start = text.index('// BEGIN LOCKFILE BOOTSTRAP')
end = text.index('// END LOCKFILE BOOTSTRAP') + len('// END LOCKFILE BOOTSTRAP')
text = text[:start] + text[end:]
path.write_text(text.lstrip())
PY

                rm -f .jenkins/Jenkinsfile.final
                git config user.name 'Jenkins'
                git config user.email 'jenkins@home.siczb.de'
                git add package-lock.json Jenkinsfile
                git add -u .jenkins/Jenkinsfile.final

                if git diff --cached --quiet; then
                    exit 0
                fi

                git commit -m 'fix: align qs override with Dishwasher canary'
                set +x
                git push "https://x-access-token:${GITHUB_TOKEN}@github.com/derliebemarcus/homeassistant_custom_oven_card.git" HEAD:migration-final-17
            '''
        }
    }
}
// END LOCKFILE BOOTSTRAP

ciHomeAssistantCard(
    scm: scm,
    agentLabel: 'klymene',
    mainBranch: 'main',
    repository: [owner: 'derliebemarcus', name: 'homeassistant_custom_oven_card'],
    nodeJsVersion: 24,
    sourceFile: 'src/homeassistant_custom_oven_card.js',
    distributionFile: 'dist/homeassistant_custom_oven_card.js',
    releaseAsset: 'dist/homeassistant_custom_oven_card.js',
    coverageFile: 'coverage/lcov.info',
    junitPattern: 'reports/junit/*.xml',
    coverageFloor: 81,
    reportRoot: 'reports',
    mutation: [artifacts: 'reports/mutation/**'],
    sonar: [
        projectKey: 'homeassistant_custom_oven_card',
        projectName: 'Home Assistant Custom Oven Card',
        server: 'SonarQube',
        timeoutMinutes: 15,
    ],
    coveralls: [credentialId: 'Coveralls'],
    security: [
        gitleaks: [enabled: true],
        trivy: [enabled: true],
        codeql: [enabled: true, toolName: 'codeql', languages: ['javascript-typescript', 'actions']],
        osv: [enabled: true],
        actionlint: [enabled: true],
    ],
    repositoryChecks: [validateScript: 'tests/validate-repository.mjs', lockfileCheck: true],
    github: [
        credentialId: 'github token',
        publishStageChecks: true,
        publishFinalCheck: false,
        statusContext: 'Continuous Integration / Jenkins',
        title: 'Oven Card Quality Gates',
    ],
    homeAssistant: [enabled: true],
)

ciChangesetsRelease(
    scm: scm,
    agentLabel: 'klymene',
    mainBranch: 'main',
    repository: [owner: 'derliebemarcus', name: 'homeassistant_custom_oven_card'],
    asset: 'dist/homeassistant_custom_oven_card.js',
    versionSyncCommand: 'npm run version:sync',
    credentialId: 'github token',
    autoMergePatch: true,
)
