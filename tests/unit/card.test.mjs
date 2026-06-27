import assert from "node:assert/strict";
import test from "node:test";

import {
  createHass,
  entityState,
  installCardDom,
} from "./test-helpers.mjs";

const registry = installCardDom();
await import("../../src/homeassistant_custom_oven_card.js");
const OvenCard = registry.get("oven-card");

function createCard({
  language = "de",
  entities = {},
  states = {},
  config = {},
} = {}) {
  const card = new OvenCard();
  card._config = {
    title: "Backofen",
    show_program: true,
    show_temperature: true,
    show_duration: true,
    show_delay: true,
    show_timer: true,
    show_options: true,
    ...config,
  };
  card._entities = entities;
  card._hass = createHass(states, language);
  return card;
}

test("selects German and English labels", () => {
  assert.equal(createCard({ language: "de-CH" })._language, "de");
  assert.equal(createCard({ language: "en-GB" })._text.current, "Current temperature");
});

test("tracks state availability and running operation states", () => {
  const entities = {
    operation: "sensor.oven_operation",
    connectivity: "binary_sensor.oven_connectivity",
  };
  const states = {
    "sensor.oven_operation": entityState("run"),
    "binary_sensor.oven_connectivity": entityState("on"),
  };
  const card = createCard({ entities, states });

  assert.equal(card._available("operation"), true);
  assert.equal(card._on("connectivity"), true);
  assert.equal(card._operation(), "run");
  assert.equal(card._running(), true);

  for (const state of ["pause", "delayedstart", "aborting"]) {
    card._hass.states["sensor.oven_operation"] = entityState(state);
    assert.equal(card._running(), true);
  }

  card._hass.states["sensor.oven_operation"] = entityState("ready");
  assert.equal(card._running(), false);
  card._hass.states["sensor.oven_operation"] = entityState("unavailable");
  assert.equal(card._available("operation"), false);
});

test("parses numbers and clamps progress", () => {
  const entities = {
    progress: "sensor.oven_progress",
    currentTemperature: "sensor.oven_temperature",
  };
  const card = createCard({
    entities,
    states: {
      "sensor.oven_progress": entityState("120"),
      "sensor.oven_temperature": entityState("182.5"),
    },
  });

  assert.equal(card._number("currentTemperature"), 182.5);
  assert.equal(card._progress(), 100);

  card._hass.states["sensor.oven_progress"] = entityState("-1");
  assert.equal(card._progress(), 0);

  card._hass.states["sensor.oven_progress"] = entityState("unknown");
  assert.equal(card._progress(), null);
});

test("prefers active programs and formats labels", () => {
  const entities = {
    activeProgram: "sensor.oven_active",
    selectedProgram: "select.oven_selected",
  };
  const states = {
    "sensor.oven_active": entityState(
      "cooking_oven_program_heating_mode_hot_air",
    ),
    "select.oven_selected": entityState(
      "cooking_oven_program_heating_mode_top_bottom_heating",
    ),
  };
  const card = createCard({ entities, states });

  assert.equal(
    card._program(),
    "cooking_oven_program_heating_mode_hot_air",
  );
  assert.equal(
    card._programLabel("cooking_oven_program_heating_mode_hot_air"),
    "Heißluft",
  );

  card._hass.states["sensor.oven_active"] = entityState("none");
  assert.equal(
    card._program(),
    "cooking_oven_program_heating_mode_top_bottom_heating",
  );

  card._config.program_names = { custom_program: "Custom program" };
  assert.equal(card._programLabel("custom_program"), "Custom program");
  assert.equal(
    card._programLabel("cooking_oven_program_special_mode"),
    "special mode",
  );
  assert.equal(card._programLabel(""), "Kein Programm gewählt");
});

test("formats valid finish times and rejects invalid values", () => {
  const entities = { finish: "sensor.oven_finish" };
  const card = createCard({
    entities,
    states: { "sensor.oven_finish": entityState("2026-06-25T18:30:00Z") },
  });

  assert.match(card._finish(), /^\d{2}:\d{2}$/);

  for (const value of ["none", "unavailable", "invalid-date"]) {
    card._hass.states["sensor.oven_finish"] = entityState(value);
    assert.equal(card._finish(), "");
  }
});

test("maps door states, formats durations and escapes HTML", () => {
  const entities = { door: "sensor.oven_door" };
  const card = createCard({
    entities,
    states: { "sensor.oven_door": entityState("open") },
  });

  assert.equal(card._door().tone, "warning");
  card._hass.states["sensor.oven_door"] = entityState("locked");
  assert.equal(card._door().tone, "good");
  card._hass.states["sensor.oven_door"] = entityState("closed");
  assert.equal(card._door().tone, "muted");

  assert.equal(card._formatSeconds(0), "Jetzt");
  assert.equal(card._formatSeconds(900), "15 Min.");
  assert.equal(card._formatSeconds(3600), "1 h");
  assert.equal(card._formatSeconds(5400), "1 h 30 Min.");
  assert.equal(card._escape(`<>&"'`), "&lt;&gt;&amp;&quot;&#039;");
});

test("creates a state signature with options and numeric constraints", () => {
  const entities = { setpoint: "number.oven_setpoint" };
  const card = createCard({
    entities,
    states: {
      "number.oven_setpoint": entityState("180", {
        options: ["160", "180"],
        min: 30,
        max: 300,
        step: 5,
      }),
    },
  });

  assert.equal(
    card._stateSignature(),
    JSON.stringify({
      setpoint: ["180", ["160", "180"], 30, 300, 5],
    }),
  );
});

test("renders loading, missing and populated card states", () => {
  const card = new OvenCard();
  card._config = {
    title: "Test oven",
    show_program: true,
    show_temperature: true,
    show_duration: true,
    show_delay: true,
    show_timer: true,
    show_options: true,
  };

  card._render();
  assert.match(card.shadowRoot.innerHTML, /Backofen wird geladen/);

  card._hass = createHass({}, "de");
  card._entities = {};
  card._render();
  assert.match(card.shadowRoot.innerHTML, /Keine Home-Connect-Entitäten gefunden/);

  card._entities = {
    connectivity: "binary_sensor.oven_connectivity",
    operation: "sensor.oven_operation",
    currentTemperature: "sensor.oven_temperature",
    setpoint: "number.oven_setpoint",
    progress: "sensor.oven_progress",
    activeProgram: "sensor.oven_active",
    selectedProgram: "select.oven_selected",
    door: "sensor.oven_door",
    duration: "number.oven_duration",
    delay: "number.oven_delay",
    timer: "number.oven_timer",
    fastPreheat: "switch.oven_fast_preheat",
    pause: "button.oven_pause",
    stop: "button.oven_stop",
  };
  card._hass = createHass({
    "binary_sensor.oven_connectivity": entityState("on"),
    "sensor.oven_operation": entityState("run"),
    "sensor.oven_temperature": entityState("180"),
    "number.oven_setpoint": entityState("200", {
      min: 30,
      max: 300,
      step: 5,
    }),
    "sensor.oven_progress": entityState("70"),
    "sensor.oven_active": entityState(
      "cooking_oven_program_heating_mode_hot_air",
    ),
    "select.oven_selected": entityState(
      "cooking_oven_program_heating_mode_hot_air",
      { options: ["cooking_oven_program_heating_mode_hot_air"] },
    ),
    "sensor.oven_door": entityState("closed"),
    "number.oven_duration": entityState("3600"),
    "number.oven_delay": entityState("0"),
    "number.oven_timer": entityState("900"),
    "switch.oven_fast_preheat": entityState("on"),
    "button.oven_pause": entityState("unknown"),
    "button.oven_stop": entityState("unknown"),
  });
  card._render();

  assert.match(card.shadowRoot.innerHTML, /Test oven/);
  assert.match(card.shadowRoot.innerHTML, /180°/);
  assert.match(card.shadowRoot.innerHTML, /Heißluft/);
  assert.match(card.shadowRoot.innerHTML, /Schnellaufheizen/);
});
