const USER_KEY = 'koleka_user';

const state = {
  user: null,
};

function readUser() {
  try {
    const raw = window.localStorage.getItem(USER_KEY);
    state.user = raw ? JSON.parse(raw) : null;
  } catch (err) {
    console.warn('Unable to read user from storage', err);
    state.user = null;
  }
}

function persistUser(user) {
  try {
    if (!user) {
      window.localStorage.removeItem(USER_KEY);
    } else {
      window.localStorage.setItem(USER_KEY, JSON.stringify(user));
    }
  } catch (err) {
    console.warn('Unable to write user to storage', err);
  }
}

export function getUser() {
  if (state.user === null) readUser();
  return state.user;
}

export function setUser(user) {
  state.user = user;
  persistUser(user);
  syncAuthUI();
}

export function clearUser() {
  state.user = null;
  persistUser(null);
  syncAuthUI();
}

export function api(path, { method = 'GET', body, headers } = {}) {
  return fetch(path, {
    method,
    body: body ? JSON.stringify(body) : undefined,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
  }).then(async (res) => {
    if (!res.ok) {
      let message = `${res.status} ${res.statusText}`;
      try {
        const data = await res.json();
        if (data?.error) message = data.error;
      } catch (err) {
        console.warn('Failed to decode error payload', err);
      }
      throw new Error(message);
    }
    return res.json();
  });
}

export const format = {
  money(value) {
    const amount = Number(value) || 0;
    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(amount);
  },
  preciseMoney(value) {
    const amount = Number(value) || 0;
    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  },
  percent(raised, goal) {
    if (!goal) return 0;
    return Math.max(0, Math.min(100, Math.round((Number(raised) / Number(goal)) * 100)));
  },
  timeAgo(input) {
    const date = new Date(input);
    if (Number.isNaN(date.getTime())) return '';
    const diff = Date.now() - date.getTime();
    const abs = Math.max(diff, 0);
    const mins = Math.floor(abs / 60000);
    if (mins < 60) return `${mins || 1}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d ago`;
    const weeks = Math.floor(days / 7);
    if (weeks < 5) return `${weeks}w ago`;
    const months = Math.floor(days / 30);
    if (months < 12) return `${months}mo ago`;
    const years = Math.floor(days / 365);
    return `${years}y ago`;
  },
};

function updateFooterYear() {
  const footerYear = document.getElementById('footer-year');
  if (footerYear) footerYear.textContent = String(new Date().getFullYear());
}

function highlightNav(activeKey) {
  const items = document.querySelectorAll('[data-nav]');
  items.forEach((el) => {
    if (el.dataset.nav === activeKey) {
      el.setAttribute('aria-current', 'page');
    } else {
      el.removeAttribute('aria-current');
    }
  });
}

export function syncAuthUI({ navKey } = {}) {
  const user = getUser();
  if (navKey) highlightNav(navKey);
  updateFooterYear();

  const pill = document.querySelector('[data-user-pill]');
  const link = document.querySelector('[data-auth-link]');

  if (pill) {
    if (user) {
      const firstName = user.name?.split(' ')?.[0] || 'Creator';
      pill.textContent = `Hi, ${firstName}`;
      pill.classList.remove('is-hidden');
    } else {
      pill.classList.add('is-hidden');
      pill.textContent = '';
    }
  }

  if (link) {
    link.onclick = null;
    if (user) {
      link.textContent = 'Sign out';
      link.href = '#signout';
      link.onclick = (event) => {
        event.preventDefault();
        clearUser();
      };
    } else {
      link.textContent = 'Sign in';
      link.href = '/signup';
    }
  }
}

export function ensureUserPrefill(input) {
  const user = getUser();
  if (!input || !user) return;
  if (!input.value) input.value = user.name || '';
}

export function loadInitialUI(navKey) {
  syncAuthUI({ navKey });
}
