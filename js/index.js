// Simple frontend for the demo API

const $ = (sel, ctx = document) => ctx.querySelector(sel);
const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));

const api = async (path, opts = {}) => {
	const res = await fetch(path, {
		headers: { 'Content-Type': 'application/json', ...(opts.headers || {}) },
		...opts,
	});
	if (!res.ok) {
		let msg = `${res.status} ${res.statusText}`;
		try {
			const j = await res.json();
			if (j && j.error) msg = j.error;
		} catch {}
		throw new Error(msg);
	}
	return res.json();
};

const fmt = {
	money(n) {
		const v = Number(n) || 0;
		return new Intl.NumberFormat(undefined, { style: 'currency', currency: 'USD' }).format(v);
	},
	pct(a, b) {
		if (!b) return 0;
		return Math.max(0, Math.min(100, Math.round((a / b) * 100)));
	},
};

const state = {
	user: null,
	projects: [],
};

function loadUser() {
	try {
		const raw = localStorage.getItem('koleka_user');
		state.user = raw ? JSON.parse(raw) : null;
	} catch {
		state.user = null;
	}
}

function saveUser(user) {
	state.user = user;
	localStorage.setItem('koleka_user', JSON.stringify(user));
}

function renderUserBadge() {
	const el = document.getElementById('userBadge');
	if (!el) return;
	if (state.user) {
		el.textContent = `Signed in (demo): ${state.user.name}`;
	} else {
		el.textContent = 'Not signed up';
	}
}

async function loadProjects() {
	const { projects } = await api('/api/projects');
	state.projects = projects;
	renderProjects();
}

function projectCard(p) {
	const percent = fmt.pct(p.raised, p.goal);
	const id = `fund-${p.id}`;
	return `
		<div class="project" data-id="${p.id}">
			<h3>${p.title}</h3>
			<p>${p.description}</p>
			<div class="meta">
				<span>Goal: <strong>${fmt.money(p.goal)}</strong></span>
				<span>Raised: <strong>${fmt.money(p.raised)}</strong></span>
				<span>${percent}% funded</span>
			</div>
			<div class="progress"><div class="bar" style="width:${percent}%"></div></div>
			<div class="actions">
				<button class="secondary view-btn" data-id="${p.id}">View</button>
				<button class="fund-btn" data-id="${p.id}">Fund this project</button>
			</div>
			<div class="details hidden"></div>
			<div id="${id}" class="fund-box hidden">
				<form class="fund-form">
					<div class="row">
						<input name="phone" placeholder="MTN MoMo number" required />
						<input name="amount" type="number" min="1" step="0.01" placeholder="Amount" required />
					</div>
					<div class="row">
						<button type="submit">Pay with MTN MoMo (demo)</button>
						<button type="button" class="secondary cancel-fund">Cancel</button>
					</div>
				</form>
				<div class="notice hidden"></div>
			</div>
		</div>
	`;
}

function renderProjects() {
	const list = document.getElementById('projects');
	const empty = document.getElementById('projectsEmpty');
	if (!state.projects.length) {
		list.innerHTML = '';
		empty.classList.remove('hidden');
		return;
	}
	empty.classList.add('hidden');
	list.innerHTML = state.projects.map(projectCard).join('');

	// Wire up fund buttons/forms
	$$('.fund-btn', list).forEach((btn) => {
		btn.addEventListener('click', () => {
			const id = btn.getAttribute('data-id');
			const box = document.getElementById(`fund-${id}`);
			if (box) box.classList.remove('hidden');
		});
	});
		// Wire up view buttons
		$$('.view-btn', list).forEach((btn) => {
			btn.addEventListener('click', async () => {
				const id = btn.getAttribute('data-id');
				const card = btn.closest('.project');
				const details = card.querySelector('.details');
				if (!details) return;
				if (!details.classList.contains('hidden')) {
					details.classList.add('hidden');
					details.innerHTML = '';
					return;
				}
				details.classList.remove('hidden');
				details.innerHTML = '<div class="info">Loading details…</div>';
				try {
					const { project, pledges } = await api(`/api/projects/${id}`);
					const rows = pledges
						.slice()
						.reverse()
						.map((pl) => `<li>${fmt.money(pl.amount)} • ${new Date(pl.timestamp).toLocaleString()}</li>`) 
						.join('');
					details.innerHTML = `
						<div class="info">Owner: <strong>${project.ownerName}</strong> · Created: ${new Date(project.createdAt).toLocaleDateString()}</div>
						<div class="info">Recent pledges:</div>
						<ul style="margin:6px 0 0 16px; padding:0;">${rows || '<li>None yet</li>'}</ul>
					`;
				} catch (e) {
					details.innerHTML = `<div class="notice error">${e.message || 'Failed to load details'}</div>`;
				}
			});
		});
	$$('.cancel-fund', list).forEach((b) =>
		b.addEventListener('click', (e) => {
			const box = e.target.closest('.fund-box');
			if (box) box.classList.add('hidden');
		})
	);
	$$('.fund-form', list).forEach((form) => {
		form.addEventListener('submit', async (e) => {
			e.preventDefault();
			const projectEl = e.target.closest('.project');
			const projectId = projectEl?.getAttribute('data-id');
			const phone = form.phone.value.trim();
			const amount = form.amount.value.trim();
			const notice = form.parentElement.querySelector('.notice');
			notice.classList.remove('hidden', 'error');
			notice.textContent = 'Processing payment (demo)…';
			form.querySelector('button[type="submit"]').disabled = true;
			try {
				const res = await api(`/api/projects/${projectId}/fund`, {
					method: 'POST',
					body: JSON.stringify({ phone, amount }),
				});
				notice.textContent = `${res.transaction.status}: ${fmt.money(res.transaction.amount)} from ${res.transaction.phone} (Txn ${res.transaction.id})`;
				await loadProjects();
			} catch (err) {
				notice.textContent = err.message || 'Payment failed (demo).';
				notice.classList.add('error');
			} finally {
				form.querySelector('button[type="submit"]').disabled = false;
			}
		});
	});
}

function wireForms() {
	const signupForm = document.getElementById('signupForm');
	const signupBox = document.getElementById('signupBox');
	signupForm.addEventListener('submit', async (e) => {
		e.preventDefault();
		const data = Object.fromEntries(new FormData(signupForm).entries());
		try {
			const res = await api('/api/signup', { method: 'POST', body: JSON.stringify(data) });
			saveUser(res.user);
			renderUserBadge();
			signupBox.innerHTML = `<div class="notice">Welcome, <strong>${res.user.name}</strong>. You are signed in (demo).</div>`;
			const ownerName = document.querySelector('input[name="ownerName"]');
			if (ownerName && !ownerName.value) ownerName.value = res.user.name;
		} catch (err) {
			alert(err.message || 'Signup failed (demo).');
		}
	});

	const createForm = document.getElementById('createProjectForm');
	const msg = document.getElementById('createProjectMsg');
	createForm.addEventListener('submit', async (e) => {
		e.preventDefault();
		const payload = Object.fromEntries(new FormData(createForm).entries());
		// Fill owner from user if not provided
		if (state.user) {
			payload.ownerName = payload.ownerName || state.user.name;
			payload.ownerEmail = state.user.email;
		}
		msg.classList.remove('hidden', 'error');
		msg.textContent = 'Creating project…';
		try {
			await api('/api/projects', { method: 'POST', body: JSON.stringify(payload) });
			msg.textContent = 'Project created (demo). Scroll to see it.';
			createForm.reset();
			await loadProjects();
		} catch (err) {
			msg.textContent = err.message || 'Could not create project (demo).';
			msg.classList.add('error');
		}
	});
}

async function main() {
	loadUser();
	renderUserBadge();
	wireForms();
	await loadProjects();
}

main().catch((e) => console.error(e));

