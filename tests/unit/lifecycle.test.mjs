import assert from "node:assert/strict";
import test from "node:test";

import { createHass, installCardDom } from "./test-helpers.mjs";

const registry = installCardDom();
await import("../../src/homeassistant_custom_oven_card.js");
const OvenCard = registry.get("oven-card");

test("validates configuration and exposes layout metadata", () => {
  const card = new OvenCard();

  assert.throws(
    () => card.setConfig({}),
    /oven-card requires device_id or entities/,
  );
  assert.deepEqual(OvenCard.getStubConfig(), {
    type: "custom:oven-card",
    device_id: "",
    title: "Backofen",
  });
  assert.equal(card.getCardSize(), 6);
  assert.deepEqual(card.getGridOptions(), {
    columns: 12,
    min_columns: 6,
    rows: 6,
    min_rows: 4,
  });

  card.setConfig({
    title: "Configured oven",
    entities: { operation: "sensor.oven_operation" },
  });
  assert.deepEqual(card._entities, { operation: "sensor.oven_operation" });
  assert.equal(card._config.show_temperature, true);
  assert.match(card.shadowRoot.innerHTML, /Loading|Backofen wird geladen/);
});

test("discovers matching Home Connect entities and recovers from registry errors", async () => {
  const card = new OvenCard();
  card.setConfig({ device_id: "device-1" });
  card._hass = createHass();
  card._hass.callWS = async () => ({
    entities: [
      {
        di: "device-1",
        pl: "home_connect",
        ei: "sensor.kitchen_operation_state",
      },
      {
        device_id: "device-1",
        entity_id: "number.kitchen_setpoint_temperature",
      },
      {
        device_id: "device-1",
        platform: "home_connect",
        entity_id: "switch.kitchen_fast_pre_heat",
      },
      {
        di: "device-1",
        pl: "lg_thinq",
        ei: "sensor.ignored_program_progress",
      },
      {
        di: "other-device",
        pl: "home_connect",
        ei: "sensor.other_current_oven_cavity_temperature",
      },
    ],
  });

  await card._discover();

  assert.deepEqual(card._entities, {
    operation: "sensor.kitchen_operation_state",
    setpoint: "number.kitchen_setpoint_temperature",
    fastPreheat: "switch.kitchen_fast_pre_heat",
  });
  assert.equal(card._discovering, false);

  const originalError = console.error;
  const errors = [];
  console.error = (...args) => errors.push(args);
  try {
    card._hass.callWS = async () => {
      throw new Error("registry unavailable");
    };
    await card._discover();
  } finally {
    console.error = originalError;
  }

  assert.deepEqual(card._entities, {});
  assert.match(String(errors[0]?.[0]), /discovery failed/);
});

test("dispatches more-info events and isolates service-call failures", async () => {
  const card = new OvenCard();
  card._config = { title: "Oven" };
  card._entities = { door: "sensor.oven_door" };
  card._hass = createHass();

  const calls = [];
  card._hass.callService = async (...args) => calls.push(args);
  await card._service("homeassistant", "toggle", {
    entity_id: "switch.oven_fast_preheat",
  });
  assert.deepEqual(calls, [
    ["homeassistant", "toggle", { entity_id: "switch.oven_fast_preheat" }],
  ]);

  card._moreInfo("door");
  assert.equal(card.lastDispatchedEvent.type, "hass-more-info");
  assert.deepEqual(card.lastDispatchedEvent.detail, {
    entityId: "sensor.oven_door",
  });

  card.lastDispatchedEvent = null;
  card._moreInfo("missing");
  assert.equal(card.lastDispatchedEvent, null);

  const originalError = console.error;
  const errors = [];
  console.error = (...args) => errors.push(args);
  try {
    card._hass.callService = async () => {
      throw new Error("service unavailable");
    };
    await card._service("button", "press", {});
  } finally {
    console.error = originalError;
  }
  assert.match(String(errors[0]?.[0]), /button\.press failed/);
});
