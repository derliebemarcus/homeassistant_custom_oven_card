@Library('jenkins-shared-library@main') _

ciRepositoryDocumentationContract(
    scm: scm,
    agentLabel: 'klymene',
)

// Classify documentation-only changes before any pipeline profile starts.
if (ciDocumentationOnlyShortcut(
    scm: scm,
    agentLabel: 'klymene',
    repository: [
        owner: 'derliebemarcus',
        name: 'homeassistant_custom_oven_card',
    ],
    github: [
        credentialId: 'github token',
        statusContext: 'Continuous Integration / Jenkins',
        title: 'Oven Card Quality Gates',
    ],
)) {
    return
}

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
    commands: [
        actionlint: '''
            workflow_files="$(
              find .forgejo/workflows -type f -name '*.yml' -print
              find .forgejo/workflows -type f -name '*.yaml' -print
            )"
            test -n "$workflow_files"
            echo "$workflow_files" | while IFS= read -r workflow; do
              podman run --rm -v "$PWD:/repo:z" -w /repo \
                docker.io/rhysd/actionlint:latest -ignore forgejo "$workflow"
            done
        ''',
    ],
    security: [
        gitleaks: [enabled: true],
        trivy: [enabled: true],
        codeql: [
            enabled: true,
            toolName: 'codeql',
            languages: ['javascript-typescript'],
        ],
        osv: [enabled: true],
        actionlint: [enabled: true],
    ],
    repositoryChecks: [
        validateScript: 'tests/validate.mjs',
        lockfileCheck: true,
    ],
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
    repository: [
        owner: 'derliebemarcus',
        name: 'homeassistant_custom_oven_card',
    ],
    asset: 'dist/homeassistant_custom_oven_card.js',
    versionSyncCommand: 'npm run version:sync',
    credentialId: 'github token',
    autoMergePatch: true,
)
