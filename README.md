# Home Connect Oven Card

A standalone Home Assistant dashboard card for [Home Connect](https://www.home-assistant.io/integrations/home_connect/) ovens.


<picture>
  <img src="docs/images/card-preview.png" height="600" alt="Oven card preview" />
</picture>

## Features

- Automatic Home Connect entity discovery from a Home Assistant `device_id`
- Current temperature, target temperature, operation state, programme, progress and finish time
- Door, connectivity, remote-control, remote-start, local-control and interior-light status
- Programme selection and target-temperature control
- Duration, delayed-start and timer presets
- Fast-preheat, pause and confirmed programme-stop controls
- Responsive layout with reduced-motion support
- German and English labels
- No frontend-card dependencies

Direct power-on and remote-start actions are deliberately not provided.

## Compatibility

This card requires **Home Assistant 2026.7.0 or newer**.

This card has been tested with a **Siemens iQ700 oven** using the Home Connect integration. It should also work with other Home Connect ovens that expose the corresponding standard entities. Available controls and status fields depend on the capabilities and enabled entities of the individual appliance.

## Installation

### HACS

1. Open HACS.
2. Add this repository as a custom repository with category **Dashboard**.
3. Install **Home Connect Oven Card**.
4. Reload the browser.

HACS installs the resource as:

```text
/hacsfiles/homeassistant_custom_oven_card/homeassistant_custom_oven_card.js
```

### Manual

Copy `dist/homeassistant_custom_oven_card.js` to Home Assistant and register it as a JavaScript module.

## Configuration

```yaml
type: custom:oven-card
device_id: 0123456789abcdef0123456789abcdef
title: Backofen
```

The card discovers the Home Connect entities attached to the device. Entity IDs can also be supplied explicitly:

```yaml
type: custom:oven-card
title: Backofen
entities:
  operation: sensor.backofen_operation_state
  currentTemperature: sensor.backofen_current_oven_cavity_temperature
  setpoint: number.backofen_setpoint_temperature
  selectedProgram: select.backofen_selected_program
  progress: sensor.backofen_program_progress
  finish: sensor.backofen_program_finish_time
  door: sensor.backofen_door
  connectivity: binary_sensor.backofen_connectivity
```

Optional settings:

```yaml
type: custom:oven-card
device_id: 0123456789abcdef0123456789abcdef
accent_color: '#f57c00'
show_program: true
show_temperature: true
show_duration: true
show_delay: true
show_timer: true
show_options: true
program_names:
  cooking_oven_program_heating_mode_hot_air: Heißluft
```

## Requirements

- Home Assistant 2026.7.0 or newer with the [Home Connect](https://www.home-assistant.io/integrations/home_connect/) integration configured
- The relevant entities must be enabled in the entity registry

## Development

```bash
npm ci
npm test
npm run build
```

`npm run build` validates the source and writes the HACS distribution file.

## Release process

1. Add a `.changeset/*.md` file with an explicit `patch`, `minor` or `major` release level for every release-relevant change.
2. Merge the change only after Jenkins and the required GitHub-native checks pass.
3. The next green `main` build creates or updates the Changesets version pull request.
4. After the version pull request merges, the following green `main` build creates the tag, uploads the JavaScript asset to a draft GitHub Release and publishes the immutable release.

## Support

Use GitHub Issues for bug reports and feature requests. Security issues should follow [SECURITY.md](SECURITY.md).

## License

MIT
