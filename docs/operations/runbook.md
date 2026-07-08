# Runbook

## Routine operation

1. Review health, diagnostics, logs, dependency alerts, and Jenkins results.
2. Apply changes through reviewed pull requests.
3. Run the documented validation before release or deployment.
4. Verify runtime behavior after every operational change.

## Dependency maintenance

Renovate policy is defined directly in `renovate.json` so the hosted Renovate app does not
need access to the private `maintenance` repository. Do not extend
`local>derliebemarcus/maintenance`; mirror applicable shared base and Node.js policy changes
into the local configuration instead. Repository validation prevents the inaccessible
preset from being reintroduced.

## Incident response

1. Stop further releases or deployments.
2. Capture non-sensitive diagnostics and identify the last known-good state.
3. Apply troubleshooting and rollback procedures.
4. Record cause, impact, recovery, and preventive actions.
