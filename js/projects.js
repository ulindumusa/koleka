import { api, format, loadInitialUI } from './common.js';

loadInitialUI('projects');

const searchInput = document.getElementById('projects-search');
const sortSelect = document.getElementById('projects-sort');
const grid = document.getElementById('projects-grid');
const emptyState = document.getElementById('projects-empty');

const state = {
  projects: [],
  filtered: [],
};

function projectCard(project) {
  const percent = format.percent(project.raised, project.goal);
  return `
    <article class="project-card">
      <div class="meta-bar">
        <span>${percent}% funded</span>
        <span>${format.money(project.goal)} goal</span>
      </div>
      <h3>${project.title}</h3>
      <p>${project.description}</p>
      <div class="progress">
        <div class="progress-bar" data-progress="${percent}"></div>
      </div>
      <div class="meta-bar">
        <span>${format.money(project.raised)} raised</span>
        <span>Campaign owner: ${project.ownerName}</span>
      </div>
      <div class="hero-cta">
        <a class="btn btn-primary" href="/project?id=${project.id}">View campaign</a>
        <a class="btn btn-ghost" href="/project?id=${project.id}#fund">Back this idea</a>
      </div>
    </article>
  `;
}

function applyProgressWidths(container) {
  container.querySelectorAll('.progress-bar[data-progress]').forEach((bar) => {
    const value = Number(bar.dataset.progress) || 0;
    bar.style.width = `${value}%`;
  });
}

function render() {
  if (!grid) return;
  if (!state.filtered.length) {
    grid.innerHTML = '';
    emptyState?.classList.remove('is-hidden');
    return;
  }
  emptyState?.classList.add('is-hidden');
  grid.innerHTML = state.filtered.map(projectCard).join('');
  applyProgressWidths(grid);
}

function applyFilters() {
  const query = (searchInput?.value || '').trim().toLowerCase();
  const sort = sortSelect?.value || 'latest';
  const list = state.projects.slice().filter((project) => {
    if (!query) return true;
    return (
      project.title.toLowerCase().includes(query) ||
      project.description.toLowerCase().includes(query) ||
      project.ownerName?.toLowerCase().includes(query)
    );
  });

  list.sort((a, b) => {
    if (sort === 'progress') {
      return format.percent(b.raised, b.goal) - format.percent(a.raised, a.goal);
    }
    if (sort === 'goal') {
      return (Number(b.goal) || 0) - (Number(a.goal) || 0);
    }
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  state.filtered = list;
  render();
}

async function loadProjects() {
  try {
    const { projects } = await api('/api/projects');
    state.projects = projects;
    applyFilters();
  } catch (error) {
    console.error(error);
    if (emptyState) {
      emptyState.textContent = 'We could not load projects right now. Please refresh to try again.';
      emptyState.classList.remove('is-hidden');
    }
  }
}

if (searchInput) searchInput.addEventListener('input', applyFilters);
if (sortSelect) sortSelect.addEventListener('change', applyFilters);

loadProjects();
