// Minimal browser and Home Assistant doubles for oven-card unit tests.
export function installCardDom() {
  const definitions = new Map();

  globalThis.HTMLElement = class {
    attachShadow() {
      this.shadowRoot = {
        innerHTML: "",
        querySelectorAll: () => [],
        querySelector: () => null,
        getElementById: () => null,
      };
      return this.shadowRoot;
    }

    dispatchEvent(event) {
      this.lastDispatchedEvent = event;
      return true;
    }
  };

  globalThis.customElements = {
    define: (name, constructor) => definitions.set(name, constructor),
    get: (name) => definitions.get(name),
  };

  globalThis.CustomEvent = class {
    constructor(type, options = {}) {
      this.type = type;
      Object.assign(this, options);
    }
  };

  globalThis.window = { customCards: [], confirm: () => true };
  return definitions;
}

export const entityState = (state, attributes = {}) => ({
  state: String(state),
  attributes,
});

export const createHass = (states = {}, language = "de") => ({
  states,
  locale: { language },
  callService: async () => undefined,
  callWS: async () => [],
});
