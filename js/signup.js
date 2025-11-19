import { api, getUser, setUser, loadInitialUI } from './common.js';

loadInitialUI();

const form = document.getElementById('signup-form');
const message = document.getElementById('signup-message');
const nameInput = document.getElementById('signup-name');
const emailInput = document.getElementById('signup-email');

const existing = getUser();
if (existing) {
  nameInput.value = existing.name || '';
  emailInput.value = existing.email || '';
  if (message) {
    message.classList.remove('is-hidden');
    message.textContent = `Welcome back, ${existing.name}. Update your details or head to your dashboard.`;
  }
}

if (form) {
  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const submitButton = form.querySelector('button[type="submit"]');
    submitButton.disabled = true;
    if (message) {
      message.classList.remove('is-hidden');
      message.classList.remove('error');
      message.textContent = 'Creating your demo profile…';
    }

    const payload = {
      name: nameInput.value.trim(),
      email: emailInput.value.trim(),
    };

    try {
      const { user } = await api('/api/signup', {
        method: 'POST',
        body: payload,
      });
      setUser(user);
      if (message) {
        message.textContent = `You are all set, ${user.name}! Jump into projects or launch your campaign.`;
      }
    } catch (error) {
      if (message) {
        message.textContent = error.message || 'We could not complete the signup. Please try again.';
        message.classList.add('error');
      }
    } finally {
      submitButton.disabled = false;
    }
  });
}
