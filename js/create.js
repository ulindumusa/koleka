import { api, getUser, loadInitialUI, ensureUserPrefill } from './common.js';

loadInitialUI('create');

const form = document.getElementById('create-form');
const message = document.getElementById('create-message');
const ownerInput = document.getElementById('project-owner');
const emailInput = document.getElementById('project-email');

const user = getUser();
ensureUserPrefill(ownerInput);
if (user && emailInput && !emailInput.value) {
  emailInput.value = user.email || '';
}

if (form) {
  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const submitButton = form.querySelector('button[type="submit"]');
    submitButton.disabled = true;

    if (message) {
      message.classList.remove('is-hidden', 'error');
      message.textContent = 'Publishing your demo project…';
    }

    const formData = new FormData(form);
    const payload = Object.fromEntries(formData.entries());
    if (user) {
      if (!payload.ownerName) payload.ownerName = user.name;
      if (!payload.ownerEmail) payload.ownerEmail = user.email;
    }

    try {
      const { project } = await api('/api/projects', {
        method: 'POST',
        body: {
          ...payload,
          goal: payload.goal,
        },
      });

      if (message) {
        message.innerHTML = `Your project <strong>${project.title}</strong> is live in this demo. <a href="/project?id=${project.id}">View it now</a>.`;
      }
      form.reset();
      ensureUserPrefill(ownerInput);
      if (emailInput && user) emailInput.value = user.email || '';
    } catch (error) {
      if (message) {
        message.classList.add('error');
        message.textContent = error.message || 'We could not create that project right now.';
      }
    } finally {
      submitButton.disabled = false;
    }
  });
}
