import { api, format, loadInitialUI } from './common.js';

loadInitialUI();

const trendingContainer = document.getElementById('home-trending');
const trendingEmpty = document.getElementById('home-trending-empty');
const statLive = document.getElementById('home-stat-live');
const statVolume = document.getElementById('home-stat-volume');

function renderTrending(projects) {
  if (!trendingContainer) return;
  if (!projects.length) {
    trendingContainer.innerHTML = '';
    trendingEmpty?.classList.remove('is-hidden');
    return;
  }

  trendingEmpty?.classList.add('is-hidden');

  const cards = projects.slice(0, 3).map((project) => {
    const percent = format.percent(project.raised, project.goal);
    return `
      <article class="project-card">
        <div class="meta-bar">
          <span>${percent}% funded</span>
          <span>${format.money(project.raised)} raised</span>
        </div>
        <h3>${project.title}</h3>
        <p>${project.description}</p>
        <div class="progress">
          <div class="progress-bar" data-progress="${percent}"></div>
        </div>
        <div class="hero-cta">
          <a class="btn btn-primary" href="/project?id=${project.id}">View campaign</a>
          <a class="btn btn-ghost" href="/project?id=${project.id}#fund">Back this idea</a>
        </div>
      </article>
    `;
  });

  trendingContainer.innerHTML = cards.join('');
  trendingContainer
    .querySelectorAll('.progress-bar[data-progress]')
    .forEach((bar) => {
      const value = Number(bar.dataset.progress) || 0;
      bar.style.width = `${value}%`;
    });
}

async function loadTrending() {
  try {
    const { projects } = await api('/api/projects');
    const sorted = projects
      .slice()
      .sort((a, b) => format.percent(b.raised, b.goal) - format.percent(a.raised, a.goal));

    if (statLive) statLive.textContent = String(projects.length);
    if (statVolume) {
      const totalRaised = projects.reduce((sum, proj) => sum + (Number(proj.raised) || 0), 0);
      statVolume.textContent = format.money(totalRaised);
    }

    renderTrending(sorted);
  } catch (error) {
    console.error(error);
    if (trendingEmpty) {
      trendingEmpty.textContent = 'We could not load campaigns right now. Please try again soon.';
      trendingEmpty.classList.remove('is-hidden');
    }
  }
}

loadTrending();
