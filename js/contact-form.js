// Local Web3Forms integration; no third-party script or page redirect.
document.addEventListener('DOMContentLoaded', () => {
  const form = document.querySelector('.contact-form');
  if (!form) return;

  const button = form.querySelector('button[type="submit"]');
  const status = form.querySelector('.contact-form__status');
  const honeypot = form.elements.namedItem('botcheck');
  const requiredTextFields = ['name', 'email', 'message'].map((name) => form.elements.namedItem(name));
  const originalButtonText = button.textContent;
  let sending = false;

  const makeSubject = (name, service) => {
    const clean = (value) => String(value || '').replace(/[\u0000-\u001f\u007f]/g, ' ').replace(/\s+/g, ' ').trim();
    // The existing name field is entered as "Vorname Nachname".
    const nameParts = clean(name).split(' ');
    const lastName = nameParts.pop();
    const firstNames = nameParts.join(' ');
    const subjectName = [lastName, firstNames].filter(Boolean).join(' ');
    return `Projektanfrage - ${subjectName} ${clean(service) || 'Allgemeine Anfrage'}`;
  };

  const showStatus = (state, message) => {
    status.dataset.state = state;
    status.textContent = message;
    status.hidden = false;
  };
  requiredTextFields.forEach((field) => {
    field.addEventListener('input', () => field.setCustomValidity(''));
  });

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (sending) return;

    requiredTextFields.forEach((field) => {
      field.setCustomValidity(field.value.trim() ? '' : 'Bitte füllen Sie dieses Feld aus.');
    });
    if (!form.reportValidity()) return;
    if (honeypot.checked) {
      showStatus('error', 'Die Nachricht konnte nicht gesendet werden. Bitte laden Sie die Seite neu und versuchen Sie es erneut.');
      status.focus();
      return;
    }

    sending = true;
    button.disabled = true;
    button.textContent = 'Wird gesendet...';
    form.setAttribute('aria-busy', 'true');
    showStatus('pending', 'Ihre Nachricht wird gesendet. Bitte warten Sie einen Moment.');
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 20000);

    try {
      const payload = Object.fromEntries(new FormData(form));
      requiredTextFields.forEach((field) => { payload[field.name] = field.value.trim(); });
      payload.subject = makeSubject(payload.name, payload.service);
      payload.botcheck = false;
      const response = await fetch(form.action, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(payload),
        signal: controller.signal,
        redirect: 'error',
        credentials: 'omit'
      });
      const result = await response.json();
      if (!response.ok || result.success !== true) {
        if (response.status === 429) {
          throw new Error('rate-limit');
        }
        throw new Error('submission-failed');
      }
      form.reset();
      requiredTextFields.forEach((field) => field.setCustomValidity(''));
      showStatus('success', 'Vielen Dank! Ihre Nachricht wurde erfolgreich gesendet. Ich melde mich so bald wie möglich persönlich bei Ihnen zurück.');
    } catch (error) {
      const message = error.name === 'AbortError'
        ? 'Die Verbindung hat zu lange gedauert. Bitte prüfen Sie Ihre Internetverbindung und versuchen Sie es erneut.'
        : error.message === 'rate-limit'
          ? 'Momentan sind zu viele Anfragen eingegangen. Bitte versuchen Sie es in einigen Minuten erneut.'
          : 'Beim Senden ist ein Fehler aufgetreten. Bitte versuchen Sie es erneut oder kontaktieren Sie mich per E-Mail.';
      showStatus('error', message);
    } finally {
      window.clearTimeout(timeout);
      sending = false;
      button.disabled = false;
      button.textContent = originalButtonText;
      form.removeAttribute('aria-busy');
      status.focus();
    }
  });
  // Enable only after the handler is installed: never navigate to the API without JS.
  button.disabled = false;
});
