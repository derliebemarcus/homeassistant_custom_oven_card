const VERSION = "0.4.1";

const SUFFIXES = {
  connectivity: "_connectivity",
  interiorLight: "_interior_illumination_active",
  localControl: "_local_control",
  remoteControl: "_remote_control",
  remoteStart: "_remote_start",
  pause: "_pause_program",
  stop: "_stop_program",
  timer: "_alarm_clock",
  duration: "_duration",
  setpoint: "_setpoint_temperature",
  delay: "_start_in_relative",
  activeProgram: "_active_program",
  selectedProgram: "_selected_program",
  currentTemperature: "_current_oven_cavity_temperature",
  door: "_door",
  operation: "_operation_state",
  finish: "_program_finish_time",
  progress: "_program_progress",
  fastPreheat: "_fast_pre_heat",
};

const PROGRAMS = {
  cooking_oven_program_microwave_90_watt: "Mikrowelle 90 W",
  cooking_oven_program_microwave_180_watt: "Mikrowelle 180 W",
  cooking_oven_program_microwave_360_watt: "Mikrowelle 360 W",
  cooking_oven_program_microwave_600_watt: "Mikrowelle 600 W",
  cooking_oven_program_microwave_max: "Mikrowelle Max",
  cooking_oven_program_heating_mode_hot_air: "Heißluft",
  cooking_oven_program_heating_mode_top_bottom_heating: "Ober-/Unterhitze",
  cooking_oven_program_heating_mode_top_bottom_heating_eco: "Ober-/Unterhitze Eco",
  cooking_oven_program_heating_mode_hot_air_grilling: "Umluftgrill",
  cooking_oven_program_heating_mode_pizza_setting: "Pizzastufe",
  cooking_oven_program_heating_mode_frozen_heatup_special: "Tiefkühl-Spezial",
  cooking_oven_program_heating_mode_intensive_heat: "Intensivhitze",
  cooking_oven_program_heating_mode_slow_cook: "Sanftgaren",
  cooking_oven_program_heating_mode_desiccation: "Dörren",
  cooking_oven_program_heating_mode_bottom_heating: "Unterhitze",
  cooking_oven_program_heating_mode_keep_warm: "Warmhalten",
  cooking_oven_program_heating_mode_preheat_ovenware: "Geschirr vorwärmen",
  cooking_oven_program_heating_mode_pre_heating: "Vorheizen",
};

const TEXT = {
  de: {
    loading: "Backofen wird geladen …", missing: "Keine Home-Connect-Entitäten gefunden.",
    online: "Online", offline: "Offline", current: "Isttemperatur", target: "Solltemperatur",
    finish: "Fertig", progress: "Fortschritt", program: "Programm", duration: "Dauer",
    delay: "Startverzögerung", timer: "Timer", options: "Optionen", now: "Jetzt",
    active: "Aktiv", off: "Aus", pauseAction: "Pausieren", stop: "Programm stoppen",
    confirm: "Laufendes Ofenprogramm wirklich stoppen?", noProgram: "Kein Programm gewählt",
    inactive: "Inaktiv", ready: "Bereit", delayedstart: "Start geplant", run: "Läuft",
    pause: "Pausiert", actionrequired: "Eingriff erforderlich", finished: "Fertig",
    error: "Fehler", aborting: "Wird abgebrochen", unknown: "Status unbekannt",
    fastPreheat: "Schnellaufheizen", remoteControl: "Fernbedienung", localOnly: "Nur lokal",
    remoteStart: "Fernstart möglich", noRemoteStart: "Kein Fernstart", localControl: "Lokale Bedienung",
    lightOn: "Licht an", lightOff: "Licht aus", open: "Tür offen", closed: "Tür geschlossen",
    locked: "Verriegelt", minutes: "Min.",
  },
  en: {
    loading: "Loading oven …", missing: "No Home Connect entities found.",
    online: "Online", offline: "Offline", current: "Current temperature", target: "Target temperature",
    finish: "Finish", progress: "Progress", program: "Program", duration: "Duration",
    delay: "Start delay", timer: "Timer", options: "Options", now: "Now",
    active: "Active", off: "Off", pauseAction: "Pause", stop: "Stop program",
    confirm: "Really stop the running oven program?", noProgram: "No program selected",
    inactive: "Inactive", ready: "Ready", delayedstart: "Scheduled", run: "Running",
    pause: "Paused", actionrequired: "Action required", finished: "Finished",
    error: "Error", aborting: "Aborting", unknown: "Unknown state",
    fastPreheat: "Fast preheat", remoteControl: "Remote control", localOnly: "Local only",
    remoteStart: "Remote start available", noRemoteStart: "No remote start", localControl: "Local control",
    lightOn: "Light on", lightOff: "Light off", open: "Door open", closed: "Door closed",
    locked: "Locked", minutes: "min",
  },
};

class OvenCard extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this._entities = null;
    this._signature = "";
    this._discovering = false;
  }

  static getStubConfig() { return { type: "custom:oven-card", device_id: "", title: "Backofen" }; }
  getCardSize() { return 6; }
  getGridOptions() { return { columns: 12, min_columns: 6, rows: 6, min_rows: 4 }; }

  setConfig(config) {
    if (!config?.device_id && !config?.entities) throw new Error("oven-card requires device_id or entities");
    this._config = {
      title: "Backofen", show_program: true, show_temperature: true, show_duration: true,
      show_delay: true, show_timer: true, show_options: true, ...config,
    };
    this._entities = config.entities ? { ...config.entities } : null;
    this._signature = "";
    this._render();
  }

  set hass(hass) {
    this._hass = hass;
    if (!this._entities && !this._discovering && this._config?.device_id) void this._discover();
    const signature = this._stateSignature();
    if (signature !== this._signature) { this._signature = signature; this._render(); }
  }

  get _language() {
    const value = this._hass?.locale?.language || this._hass?.language || "de";
    return String(value).toLowerCase().startsWith("de") ? "de" : "en";
  }
  get _text() { return TEXT[this._language]; }

  async _discover() {
    this._discovering = true;
    this._render();
    try {
      const result = await this._hass.callWS({ type: "config/entity_registry/list_for_display" });
      const registry = Array.isArray(result) ? result : result?.entities || [];
      const ids = registry.filter((entry) => {
        const device = entry.di || entry.device_id;
        const platform = entry.pl || entry.platform;
        return device === this._config.device_id && (!platform || platform === "home_connect");
      }).map((entry) => entry.ei || entry.entity_id).filter(Boolean);
      this._entities = {};
      for (const [key, suffix] of Object.entries(SUFFIXES)) {
        const id = ids.find((candidate) => candidate.endsWith(suffix));
        if (id) this._entities[key] = id;
      }
    } catch (error) {
      console.error("oven-card discovery failed", error);
      this._entities = {};
    } finally {
      this._discovering = false;
      this._signature = "";
      this._render();
    }
  }

  _stateSignature() {
    if (!this._hass || !this._entities) return "";
    return JSON.stringify(Object.fromEntries(Object.entries(this._entities).map(([key, id]) => {
      const state = this._hass.states[id];
      return [key, state ? [state.state, state.attributes?.options, state.attributes?.min, state.attributes?.max, state.attributes?.step] : null];
    })));
  }

  _state(key) { const id = this._entities?.[key]; return id ? this._hass?.states?.[id] : undefined; }
  _available(key) { const state = this._state(key); return Boolean(state && !["unknown", "unavailable"].includes(state.state)); }
  _on(key) { return this._state(key)?.state === "on"; }
  _operation() { return this._state("operation")?.state || "unknown"; }
  _running() { return ["run", "pause", "delayedstart", "aborting"].includes(this._operation()); }
  _number(key) { const value = Number(this._state(key)?.state); return Number.isFinite(value) ? value : null; }
  _progress() { const value = this._number("progress"); return value === null ? null : Math.max(0, Math.min(100, value)); }

  _program() {
    const invalid = ["", "unknown", "unavailable", "none"];
    const active = this._state("activeProgram")?.state || "";
    if (!invalid.includes(active)) return active;
    const selected = this._state("selectedProgram")?.state || "";
    return invalid.includes(selected) ? "" : selected;
  }

  _programLabel(value) {
    if (!value) return this._text.noProgram;
    return { ...PROGRAMS, ...(this._config.program_names || {}) }[value]
      || value.replace(/^cooking_oven_program_/, "").replaceAll("_", " ");
  }

  _finish() {
    const value = this._state("finish")?.state;
    if (!value || ["unknown", "unavailable", "none"].includes(value)) return "";
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? "" : date.toLocaleTimeString(this._language === "de" ? "de-CH" : "en-GB", { hour: "2-digit", minute: "2-digit" });
  }

  _door() {
    const state = this._state("door")?.state;
    if (state === "open") return { label: this._text.open, icon: "mdi:door-open", tone: "warning" };
    if (state === "locked") return { label: this._text.locked, icon: "mdi:door-closed-lock", tone: "good" };
    return { label: this._text.closed, icon: "mdi:door-closed", tone: "muted" };
  }

  _formatSeconds(value) {
    if (!Number.isFinite(value) || value <= 0) return this._text.now;
    const hours = Math.floor(value / 3600);
    const minutes = Math.round((value % 3600) / 60);
    return hours ? `${hours} h${minutes ? ` ${minutes} ${this._text.minutes}` : ""}` : `${minutes} ${this._text.minutes}`;
  }

  _escape(value) {
    return String(value ?? "").replaceAll("&", "&amp;").replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#039;");
  }

  _render() {
    if (!this.shadowRoot || !this._config) return;
    if (!this._hass || this._discovering) {
      this.shadowRoot.innerHTML = this._frame(`<div class="message"><span class="spinner"></span>${this._text.loading}</div>`);
      return;
    }
    if (!this._entities || !Object.keys(this._entities).length) {
      this.shadowRoot.innerHTML = this._frame(`<div class="message error"><ha-icon icon="mdi:alert-circle-outline"></ha-icon>${this._text.missing}</div>`);
      return;
    }

    const t = this._text;
    const operation = this._operation();
    const running = this._running();
    const current = this._number("currentTemperature");
    const setpoint = this._number("setpoint");
    const progress = this._progress();
    const maximum = setpoint && setpoint > 0 ? setpoint : Number(this._state("setpoint")?.attributes?.max) || 300;
    const percentage = current === null ? 0 : Math.max(0, Math.min(100, current / maximum * 100));
    const circumference = 2 * Math.PI * 58;
    const offset = circumference * (1 - percentage / 100);
    const program = this._program();
    const finish = this._finish();
    const door = this._door();
    const online = this._on("connectivity");

    this.shadowRoot.innerHTML = this._frame(`
      <div class="card" style="--accent:${this._escape(this._config.accent_color || "#f57c00")}">
        <header><div><div class="title">${this._escape(this._config.title)}</div><div class="subtitle">${this._escape(this._programLabel(program))}</div></div>
          ${this._state("connectivity") ? `<button class="status ${online ? "good" : "bad"}" data-info="connectivity"><span></span>${online ? t.online : t.offline}</button>` : ""}
        </header>
        <div class="hero">
          <div class="visual ${operation === "run" ? "heating" : ""}">
            <svg viewBox="0 0 140 140"><circle class="track" cx="70" cy="70" r="58"></circle><circle class="value" cx="70" cy="70" r="58" style="stroke-dasharray:${circumference};stroke-dashoffset:${offset}"></circle></svg>
            <div class="oven"><div class="heat"><i></i><i></i><i></i></div><ha-icon icon="mdi:stove"></ha-icon><div class="glow"></div></div>
            <div class="temperature"><b>${current === null ? "—" : Math.round(current)}°</b><small>${t.current}</small></div>
          </div>
          <div class="summary"><div class="operation ${this._escape(operation)}">${this._escape(t[operation] || t.unknown)}</div><div class="program">${this._escape(this._programLabel(program))}</div>
            <div class="facts">
              ${setpoint !== null ? `<div><ha-icon icon="mdi:thermometer-check"></ha-icon><span><small>${t.target}</small>${Math.round(setpoint)} °C</span></div>` : ""}
              ${finish ? `<div><ha-icon icon="mdi:clock-check-outline"></ha-icon><span><small>${t.finish}</small>${this._escape(finish)}</span></div>` : ""}
              ${progress !== null ? `<div><ha-icon icon="mdi:progress-clock"></ha-icon><span><small>${t.progress}</small>${Math.round(progress)} %</span></div>` : ""}
              ${this._state("door") ? `<div><ha-icon icon="${door.icon}"></ha-icon><span><small>${t.program}</small>${this._escape(door.label)}</span></div>` : ""}
            </div>
          </div>
        </div>
        ${this._statusPills(door)}
        ${this._programControl(running)}
        ${this._temperatureControl()}
        ${this._timeControl("duration", t.duration, "mdi:timer-sand", [[1800, `30 ${t.minutes}`], [3600, `60 ${t.minutes}`], [5400, `90 ${t.minutes}`]], running)}
        ${this._timeControl("delay", t.delay, "mdi:clock-start", [[0, t.now], [3600, "+1 h"], [10800, "+3 h"]], running)}
        ${this._timeControl("timer", t.timer, "mdi:timer-outline", [[0, t.off], [900, `15 ${t.minutes}`], [1800, `30 ${t.minutes}`], [3600, `60 ${t.minutes}`]], false)}
        ${this._optionControls()}
        ${this._actions()}
      </div>`);
    this._bind();
  }

  _statusPills(door) {
    const t = this._text;
    const values = [];
    if (this._state("door")) values.push(`<button class="pill ${door.tone}" data-info="door"><ha-icon icon="${door.icon}"></ha-icon>${door.label}</button>`);
    if (this._state("remoteControl")) values.push(`<button class="pill ${this._on("remoteControl") ? "good" : "muted"}" data-info="remoteControl"><ha-icon icon="mdi:remote"></ha-icon>${this._on("remoteControl") ? t.remoteControl : t.localOnly}</button>`);
    if (this._state("remoteStart")) values.push(`<button class="pill ${this._on("remoteStart") ? "good" : "muted"}" data-info="remoteStart"><ha-icon icon="mdi:play-network"></ha-icon>${this._on("remoteStart") ? t.remoteStart : t.noRemoteStart}</button>`);
    if (this._state("localControl") && this._on("localControl")) values.push(`<button class="pill warning" data-info="localControl"><ha-icon icon="mdi:account-hand"></ha-icon>${t.localControl}</button>`);
    if (this._state("interiorLight")) values.push(`<button class="pill ${this._on("interiorLight") ? "warning" : "muted"}" data-info="interiorLight"><ha-icon icon="mdi:lightbulb-outline"></ha-icon>${this._on("interiorLight") ? t.lightOn : t.lightOff}</button>`);
    return values.length ? `<div class="pills">${values.join("")}</div>` : "";
  }

  _programControl(running) {
    if (!this._config.show_program || !this._available("selectedProgram")) return "";
    const state = this._state("selectedProgram");
    const options = state.attributes?.options || [];
    if (!options.length) return "";
    const html = options.map((value) => `<option value="${this._escape(value)}" ${value === state.state ? "selected" : ""}>${this._escape(this._programLabel(value))}</option>`).join("");
    return `<section><label><ha-icon icon="mdi:playlist-check"></ha-icon>${this._text.program}</label><div class="select"><select id="program" ${running ? "disabled" : ""}>${html}</select><ha-icon icon="mdi:chevron-down"></ha-icon></div></section>`;
  }

  _temperatureControl() {
    if (!this._config.show_temperature || !this._available("setpoint")) return "";
    const state = this._state("setpoint");
    const value = Number(state.state);
    const min = Number(state.attributes?.min ?? 30);
    const max = Number(state.attributes?.max ?? 300);
    const step = Number(state.attributes?.step ?? 5);
    if (![value, min, max, step].every(Number.isFinite)) return "";
    return `<section><label><ha-icon icon="mdi:thermometer-chevron-up"></ha-icon>${this._text.target}</label><div class="range"><input id="temperature" type="range" min="${min}" max="${max}" step="${step}" value="${value}"><output id="temperature-value">${Math.round(value)} °C</output></div></section>`;
  }

  _timeControl(key, label, icon, presets, disabled) {
    if (!this._config[`show_${key}`] || !this._available(key) || disabled) return "";
    const value = this._number(key) || 0;
    const buttons = presets.map(([seconds, text]) => `<button data-${key}="${seconds}">${text}</button>`).join("");
    return `<section><label><ha-icon icon="${icon}"></ha-icon>${label}<span class="section-value">${this._formatSeconds(value)}</span></label><div class="segments ${presets.length === 4 ? "four" : ""}">${buttons}</div></section>`;
  }

  _optionControls() {
    if (!this._config.show_options || !this._available("fastPreheat")) return "";
    const active = this._on("fastPreheat");
    return `<section><label><ha-icon icon="mdi:tune-variant"></ha-icon>${this._text.options}</label><button class="option ${active ? "active" : ""}" data-toggle="fastPreheat"><ha-icon icon="mdi:heat-wave"></ha-icon><span><b>${this._text.fastPreheat}</b><small>${active ? this._text.active : this._text.off}</small></span></button></section>`;
  }

  _actions() {
    const pause = Boolean(this._state("pause")) && this._operation() === "run";
    const stop = Boolean(this._state("stop")) && this._running();
    if (!pause && !stop) return "";
    return `<footer>${pause ? `<button class="action" data-action="pause"><ha-icon icon="mdi:pause"></ha-icon>${this._text.pauseAction}</button>` : ""}${stop ? `<button class="action danger" data-action="stop"><ha-icon icon="mdi:stop-circle-outline"></ha-icon>${this._text.stop}</button>` : ""}</footer>`;
  }

  _bind() {
    this.shadowRoot.querySelectorAll("[data-info]").forEach((element) => element.addEventListener("click", () => this._moreInfo(element.dataset.info)));
    this.shadowRoot.querySelectorAll("[data-toggle]").forEach((element) => element.addEventListener("click", () => this._service("homeassistant", "toggle", { entity_id: this._entities[element.dataset.toggle] })));
    for (const key of ["duration", "delay", "timer"]) {
      this.shadowRoot.querySelectorAll(`[data-${key}]`).forEach((element) => element.addEventListener("click", () => this._service("number", "set_value", { entity_id: this._entities[key], value: Number(element.dataset[key]) })));
    }
    this.shadowRoot.getElementById("program")?.addEventListener("change", (event) => this._service("select", "select_option", { entity_id: this._entities.selectedProgram, option: event.target.value }));
    const temperature = this.shadowRoot.getElementById("temperature");
    temperature?.addEventListener("input", (event) => { const output = this.shadowRoot.getElementById("temperature-value"); if (output) output.value = `${event.target.value} °C`; });
    temperature?.addEventListener("change", (event) => this._service("number", "set_value", { entity_id: this._entities.setpoint, value: Number(event.target.value) }));
    this.shadowRoot.querySelector('[data-action="pause"]')?.addEventListener("click", () => this._service("button", "press", { entity_id: this._entities.pause }));
    this.shadowRoot.querySelector('[data-action="stop"]')?.addEventListener("click", () => { if (globalThis.confirm(this._text.confirm)) this._service("button", "press", { entity_id: this._entities.stop }); });
  }

  _moreInfo(key) {
    const entityId = this._entities[key];
    if (entityId) this.dispatchEvent(new CustomEvent("hass-more-info", { detail: { entityId }, bubbles: true, composed: true }));
  }

  async _service(domain, service, data) {
    try { await this._hass.callService(domain, service, data); }
    catch (error) { console.error(`oven-card ${domain}.${service} failed`, error); }
  }

  _frame(content) {
    return `<style>
      :host{display:block;container-type:inline-size}ha-card{overflow:hidden}.card{padding:20px;color:var(--primary-text-color)}header{display:flex;justify-content:space-between;gap:16px;margin-bottom:12px}.title{font-size:1.25rem;font-weight:700}.subtitle,.program{color:var(--secondary-text-color);margin-top:3px}.status,.pill{border:0;border-radius:999px;background:var(--secondary-background-color);padding:7px 10px;display:inline-flex;align-items:center;gap:6px;cursor:pointer;color:inherit;white-space:nowrap}.status span{width:7px;height:7px;border-radius:50%;background:currentColor}.good{color:var(--success-color,#43a047)}.bad{color:var(--error-color,#db4437)}.warning{color:var(--warning-color,#f9a825)}.muted{color:var(--secondary-text-color)}
      .hero{display:grid;grid-template-columns:180px 1fr;align-items:center;gap:20px;padding:4px 0 16px}.visual{width:168px;height:168px;position:relative;display:grid;place-items:center;margin:auto}.visual svg{position:absolute;inset:0;width:100%;height:100%;transform:rotate(-90deg)}circle{fill:none;stroke-width:8}.track{stroke:var(--divider-color)}.value{stroke:var(--accent);stroke-linecap:round;transition:stroke-dashoffset .4s}.oven{width:88px;height:88px;border-radius:24px;display:grid;place-items:center;background:var(--secondary-background-color);color:var(--accent);position:relative;box-shadow:inset 0 0 0 1px var(--divider-color)}.oven ha-icon{--mdc-icon-size:54px;z-index:2}.glow{position:absolute;inset:13px;border-radius:17px;background:radial-gradient(circle,color-mix(in srgb,var(--accent) 35%,transparent),transparent 68%);opacity:0}.heating .glow{opacity:1;animation:glow 2s ease-in-out infinite}.heat{position:absolute;top:-27px;display:flex;gap:6px;opacity:0}.heating .heat{opacity:1}.heat i{width:5px;height:22px;border-left:2px solid var(--accent);animation:heat 1.7s ease-in-out infinite}.heat i:nth-child(2){animation-delay:.35s}.heat i:nth-child(3){animation-delay:.7s}.temperature{position:absolute;bottom:-2px;background:var(--ha-card-background,var(--card-background-color));padding:2px 8px;border-radius:99px;display:flex;gap:4px;align-items:baseline}.temperature small{color:var(--secondary-text-color)}.operation{font-size:1.7rem;font-weight:750}.operation.run{color:var(--accent)}.operation.pause,.operation.delayedstart{color:var(--warning-color,#f9a825)}.operation.error{color:var(--error-color,#db4437)}.facts{display:grid;grid-template-columns:repeat(2,1fr);gap:10px;margin-top:18px}.facts>div{display:flex;gap:8px;align-items:center}.facts ha-icon,section>label ha-icon{color:var(--accent)}.facts span{display:flex;flex-direction:column}.facts small{color:var(--secondary-text-color)}
      .pills{display:flex;flex-wrap:wrap;gap:7px;margin-bottom:14px}.pill ha-icon{--mdc-icon-size:17px}section{border-top:1px solid var(--divider-color);padding-top:14px;margin-top:14px}section>label{display:flex;align-items:center;gap:7px;color:var(--secondary-text-color);font-size:.8rem;font-weight:650;margin-bottom:9px}.section-value{margin-left:auto;color:var(--primary-text-color)}.select{position:relative}.select select{width:100%;appearance:none;border:1px solid var(--divider-color);border-radius:12px;padding:12px 42px 12px 13px;background:var(--secondary-background-color);color:var(--primary-text-color)}.select>ha-icon{position:absolute;right:12px;top:50%;transform:translateY(-50%);pointer-events:none}.range{display:grid;grid-template-columns:1fr auto;gap:12px;align-items:center}.range input{accent-color:var(--accent);width:100%}.segments{display:grid;grid-template-columns:repeat(3,1fr);gap:7px}.segments.four{grid-template-columns:repeat(4,1fr)}.segments button,.option{border:1px solid var(--divider-color);border-radius:11px;background:var(--secondary-background-color);color:inherit;cursor:pointer;padding:9px}.option{display:flex;align-items:center;gap:10px;text-align:left}.option span{display:flex;flex-direction:column}.option small{color:var(--secondary-text-color)}.option.active{border-color:var(--accent);background:color-mix(in srgb,var(--accent) 12%,var(--secondary-background-color))}footer{display:flex;gap:9px;margin-top:18px}.action{flex:1;border:0;border-radius:12px;min-height:44px;display:flex;align-items:center;justify-content:center;gap:8px;font-weight:700;cursor:pointer;background:var(--secondary-background-color);color:inherit}.danger{color:var(--error-color,#db4437)}.message{min-height:120px;padding:24px;display:flex;align-items:center;justify-content:center;gap:10px;color:var(--secondary-text-color)}.error{color:var(--error-color,#db4437)}.spinner{width:24px;height:24px;border:3px solid var(--divider-color);border-top-color:var(--primary-color);border-radius:50%;animation:spin .8s linear infinite}
      @keyframes spin{to{transform:rotate(360deg)}}@keyframes heat{0%,100%{transform:translateY(4px);opacity:.2}50%{transform:translateY(-4px);opacity:1}}@keyframes glow{50%{transform:scale(1.08);opacity:.65}}
      @container(max-width:460px){.card{padding:16px}.hero{grid-template-columns:1fr;gap:8px}.visual{width:150px;height:150px}.summary{text-align:center}.operation{font-size:1.45rem}.facts{justify-content:center}.pills{justify-content:center}}@container(max-width:340px){.facts{grid-template-columns:1fr}.segments.four{grid-template-columns:repeat(2,1fr)}footer{flex-direction:column}}@media(prefers-reduced-motion:reduce){*{animation-duration:.01ms!important;transition-duration:.01ms!important}}
    </style><ha-card>${content}</ha-card>`;
  }
}

if (!customElements.get("oven-card")) customElements.define("oven-card", OvenCard);
globalThis.customCards = globalThis.customCards || [];
const matchesEntity = (entity, terms) => {
  const entityId = String(entity?.entity_id || entity || "").toLowerCase();
  const name = String(entity?.attributes?.friendly_name || entity?.name || "").toLowerCase();
  return terms.some((term) => entityId.includes(term) || name.includes(term));
};

globalThis.customCards.push({
  type: "oven-card",
  name: "Home Connect Oven Card",
  description: "Home Connect oven control card",
  preview: true,
  getEntitySuggestion: (hass, entityId) => {
    if (!matchesEntity(hass.states?.[entityId], ["oven", "backofen", "current_oven_cavity_temperature", "cooking_oven"])) return null;
    return {
      config: {
        type: "custom:oven-card",
        entity: entityId,
      },
    };
  },
});
console.info(`%c OVEN-CARD %c ${VERSION} `, "color:#fff;background:#f57c00;font-weight:700", "color:#f57c00;background:#fff;font-weight:700");
