const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const source = fs.readFileSync('js/contact-form.js', 'utf8');

function setup(options = {}) {
  const events = {};
  const fields = {};
  const values = { name: '  Test Person  ', email: 'test@example.com', message: '  Testnachricht  ', company: 'Testfirma', phone: '+43 660 1234567', service: 'SEO & Sichtbarkeit', access_key: 'test-key', subject: 'Test', from_name: 'Leinaro Kontaktformular' };
  if (options.name !== undefined) values.name = options.name;
  if (options.service !== undefined) values.service = options.service;
  for (const [name, value] of Object.entries(values)) {
    fields[name] = { name, value, validityMessage: '', listeners: {}, setCustomValidity(message) { this.validityMessage = message; }, addEventListener(event, handler) { this.listeners[event] = handler; } };
  }
  fields.botcheck = { name: 'botcheck', checked: options.bot ?? false };
  fields.privacy = { name: 'privacy', checked: options.privacy ?? true };
  if (options.blank) fields[options.blank].value = '   ';
  if (options.invalidEmail) fields.email.value = 'not-an-email';
  const button = { textContent: 'Nachricht senden', disabled: true };
  const status = { dataset: {}, hidden: true, textContent: '', focus() { this.focused = true; } };
  const form = {
    action: 'https://api.web3forms.com/submit', attributes: {}, resets: 0,
    elements: { namedItem: (name) => fields[name] },
    querySelector: (selector) => selector.startsWith('button') ? button : status,
    addEventListener: (event, handler) => { events[event] = handler; },
    reportValidity: () => fields.privacy.checked && !['name', 'email', 'message'].some((name) => fields[name].validityMessage) && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fields.email.value),
    setAttribute(name, value) { this.attributes[name] = value; },
    removeAttribute(name) { delete this.attributes[name]; },
    reset() { this.resets++; for (const name of ['name', 'email', 'message', 'company', 'phone', 'service']) fields[name].value = ''; fields.privacy.checked = false; }
  };
  const requests = [];
  let timeoutCallback;
  let cleared = false;
  const context = {
    document: { querySelector: () => options.absent ? null : form, addEventListener: (_event, handler) => handler() },
    window: { setTimeout(callback, duration) { assert.equal(duration, 20000); timeoutCallback = callback; return 1; }, clearTimeout() { cleared = true; } },
    AbortController,
    FormData: class {
      *[Symbol.iterator]() {
        for (const [name, field] of Object.entries(fields)) {
          if (name === 'botcheck') { if (field.checked) yield [name, 'on']; }
          else if (name === 'privacy') { if (field.checked) yield [name, 'accepted']; }
          else yield [name, field.value];
        }
      }
    },
    async fetch(url, config) {
      requests.push({ url, config });
      if (options.networkError) throw Error('Network unavailable');
      if (options.waitForAbort) return new Promise((_resolve, reject) => config.signal.addEventListener('abort', () => { const error = Error('Aborted'); error.name = 'AbortError'; reject(error); }));
      if (options.responseGate) await options.responseGate;
      return { ok: options.ok ?? true, status: options.httpStatus ?? 200, async json() { if (options.badJson) throw Error('Invalid JSON'); return { success: options.success ?? true }; } };
    }
  };
  vm.runInNewContext(source, context);
  return { form, fields, button, status, requests, submit: () => events.submit({ preventDefault() {} }), timeout: () => timeoutCallback(), cleared: () => cleared };
}

(async () => {
  const normal = setup();
  assert.equal(normal.button.disabled, false);
  await normal.submit();
  assert.equal(normal.status.dataset.state, 'success');
  assert.equal(normal.form.resets, 1);
  assert.equal(normal.button.disabled, false);
  assert.equal(normal.button.textContent, 'Nachricht senden');
  assert.equal(normal.status.focused, true);
  assert.equal(normal.cleared(), true);
  const request = normal.requests[0];
  assert.equal(request.url, 'https://api.web3forms.com/submit');
  assert.equal(request.config.headers['Content-Type'], 'application/json');
  const payload = JSON.parse(request.config.body);
  assert.equal(payload.name, 'Test Person');
  assert.equal(payload.message, 'Testnachricht');
  assert.equal(payload.privacy, 'accepted');
  assert.equal(payload.botcheck, false);
  assert.equal(payload.subject, 'Projektanfrage - Person Test SEO & Sichtbarkeit');
  for (const name of ['access_key', 'email', 'company', 'phone', 'service', 'from_name']) assert.equal(payload[name], normal.fields[name].value || ({ company: 'Testfirma', phone: '+43 660 1234567', service: 'SEO & Sichtbarkeit', email: 'test@example.com' })[name]);

  for (const [name, service, expectedSubject] of [
    ['Christoph Leitner', 'Webdesign', 'Projektanfrage - Leitner Christoph Webdesign'],
    ['Anna Maria Leitner', 'Website-Betreuung', 'Projektanfrage - Leitner Anna Maria Website-Betreuung'],
    ['  Christoph   Leitner  ', 'Domain & Hosting', 'Projektanfrage - Leitner Christoph Domain & Hosting'],
    ['Christoph', '', 'Projektanfrage - Christoph Allgemeine Anfrage'],
    ['Christoph\nLeitner', 'Webdesign\r\n', 'Projektanfrage - Leitner Christoph Webdesign']
  ]) {
    const example = setup({ name, service });
    await example.submit();
    assert.equal(JSON.parse(example.requests[0].config.body).subject, expectedSubject);
  }

  for (const options of [{ ok: false, httpStatus: 500 }, { success: false }, { badJson: true }, { networkError: true }, { ok: false, httpStatus: 429 }]) {
    const failed = setup(options);
    await failed.submit();
    assert.equal(failed.status.dataset.state, 'error');
    assert.equal(failed.form.resets, 0);
    assert.equal(failed.fields.message.value, '  Testnachricht  ');
    assert.equal(failed.button.disabled, false);
    assert.equal(failed.button.textContent, 'Nachricht senden');
    assert.equal(failed.form.attributes['aria-busy'], undefined);
    assert.equal(failed.cleared(), true);
  }
  for (const options of [{ blank: 'name' }, { blank: 'message' }, { invalidEmail: true }, { privacy: false }, { bot: true }]) {
    const invalid = setup(options);
    await invalid.submit();
    assert.equal(invalid.requests.length, 0);
    assert.equal(invalid.form.resets, 0);
  }
  let resolveGate;
  const pending = setup({ responseGate: new Promise((resolve) => { resolveGate = resolve; }) });
  const sending = pending.submit();
  assert.equal(pending.button.disabled, true);
  assert.equal(pending.button.textContent, 'Wird gesendet...');
  assert.equal(pending.form.attributes['aria-busy'], 'true');
  await pending.submit();
  assert.equal(pending.requests.length, 1, 'Duplicate submit prevented');
  resolveGate();
  await sending;
  const timedOut = setup({ waitForAbort: true });
  const timeoutRequest = timedOut.submit();
  timedOut.timeout();
  await timeoutRequest;
  assert.equal(timedOut.status.dataset.state, 'error');
  assert.equal(timedOut.button.disabled, false);
  assert.equal(timedOut.form.resets, 0);
  setup({ absent: true });
  console.log('PASS: dynamic subject, payload, success/reset, API/JSON/network errors, timeout, validation, honeypot, duplicate-submit guard and loading state. No real requests sent.');
})().catch((error) => { console.error(error); process.exitCode = 1; });
