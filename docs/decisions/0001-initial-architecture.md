# 0001: Keep the oven card as a standalone JavaScript module.

## Status

Accepted

## Date

2026-07-04

## Context

Standalone Home Assistant dashboard card for Home Connect ovens with device-based entity discovery and appliance controls.

## Decision drivers

- Accurate representation of appliance state and capability
- Responsive and accessible rendering
- Safe confirmation for disruptive controls

## Considered options

1. Retain the established architecture
2. Replace it with a tightly coupled alternative
3. Defer the architectural boundary to deployment-specific code

## Decision

Keep the oven card as a standalone JavaScript module.

## Rationale

A standalone module minimizes installation steps and compatibility coupling to unrelated custom cards.

## Consequences

- The documented building blocks and interfaces remain explicit contracts.
- Changes to the decision require a superseding ADR.

## Risks

- Entity availability differs between Home Connect oven models.
- Home Assistant frontend APIs can change across releases.

## References

- maintenance issue #37
