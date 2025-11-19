import { api, format, loadInitialUI } from './common.js';

loadInitialUI('projects');

const page = document.getElementById('project-page');
const titleEl = document.getElementById('project-title');
const summaryEl = document.getElementById('project-summary');
const ownerEl = document.getElementById('project-owner');
const descriptionEl = document.getElementById('project-description');
const progressText = document.getElementById('project-progress-text');
const progressBar = document.getElementById('project-progress-bar');
const goalEl = document.getElementById('project-goal');
const milestonesEl = document.getElementById('project-milestones');
const pledgesList = document.getElementById('pledge-list');
const pledgesEmpty = document.getElementById('pledge-empty');
const fundForm = document.getElementById('fund-form');
const fundMessage = document.getElementById('fund-message');

const params = new URLSearchParams(window.location.search);
const projectId = params.get('id');

if (!projectId) {
  if (summaryEl) summaryEl.textContent = 'We need a project ID to load this page. Go back to explore other campaigns.';
  if (fundForm) fundForm.classList.add('is-hidden');
  throw new Error('Missing project id');
}

async function loadProject() {
  try {
    const data = await api(`/api/projects/${projectId}`);
    const { project, pledges } = data;
    if (!project) throw new Error('Project not found');

    if (page) page.dataset.projectId = project.id;
    document.title = `${project.title} • Koleka`;
  if (titleEl) titleEl.textContent = project.title;
  if (summaryEl) summaryEl.textContent = `A project by ${project.ownerName} seeking ${format.money(project.goal)}.`;
  if (ownerEl) ownerEl.textContent = `Creator · ${project.ownerName}`;
  if (descriptionEl) descriptionEl.textContent = project.description;
  if (goalEl) goalEl.textContent = `Goal: ${format.money(project.goal)}`;

  const percent = format.percent(project.raised, project.goal);
  if (progressText) progressText.textContent = `${percent}% funded · ${format.money(project.raised)} raised`;
  if (progressBar) progressBar.style.width = `${percent}%`;

    if (milestonesEl) {
      const items = [
        {
          title: 'Campaign launched',
          body: `Live since ${new Date(project.createdAt).toLocaleDateString()}.`,
        },
        {
          title: 'Stretch goals',
          body: 'Add stretch goals as you reach milestones to keep backers energised.',
        },
      ];
      milestonesEl.innerHTML = items
        .map(
          (item) => `
            <div class="timeline-item">
              <strong>${item.title}</strong>
              <p>${item.body}</p>
            </div>
          `
        )
        .join('');
    }

    if (pledges && pledges.length) {
      pledgesEmpty?.classList.add('is-hidden');
      if (pledgesList) {
        pledgesList.innerHTML = pledges
          .slice()
          .reverse()
          .map(
            (pledge) => `
              <li>
                <span>${format.preciseMoney(pledge.amount)}</span>
                <span>${new Date(pledge.timestamp).toLocaleString()}</span>
              </li>
            `
          )
          .join('');
      }
    } else {
      if (pledgesList) pledgesList.innerHTML = '';
      pledgesEmpty?.classList.remove('is-hidden');
    }
  } catch (error) {
    console.error(error);
    const message = error.message || 'We could not load this campaign.';
    if (summaryEl) summaryEl.textContent = message;
    if (fundForm) fundForm.classList.add('is-hidden');
    if (pledgesEmpty) pledgesEmpty.textContent = 'Campaign unavailable.';
  }
}

if (fundForm) {
  fundForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const submitButton = fundForm.querySelector('button[type="submit"]');
    submitButton.disabled = true;
    const payload = {
      amount: fundForm.amount.value,
      phone: fundForm.phone.value,
    };

    if (fundMessage) {
      fundMessage.classList.remove('is-hidden', 'error');
      fundMessage.textContent = 'Processing your pledge (demo)…';
    }

    try {
      await api(`/api/projects/${projectId}/fund`, {
        method: 'POST',
        body: payload,
      });
      if (fundMessage) {
        fundMessage.textContent = 'Thank you! Your demo pledge was recorded. The totals just updated.';
      }
      fundForm.reset();
      await loadProject();
    } catch (error) {
      if (fundMessage) {
        fundMessage.classList.add('error');
        fundMessage.textContent = error.message || 'We could not process that pledge right now.';
      }
    } finally {
      submitButton.disabled = false;
    }
  });
}

loadProject();
