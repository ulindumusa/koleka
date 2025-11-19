import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { v4 as uuidv4 } from 'uuid';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;
const htmlDir = path.join(__dirname, 'html');
const jsDir = path.join(__dirname, 'js');

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/js', express.static(jsDir));

// In-memory demo data
const users = [];
const pledges = []; // { id, projectId, amount, phone, timestamp }
const projects = [
	{
		id: uuidv4(),
		title: 'Solar Lanterns for Schools',
		description:
			'Help us bring affordable solar lanterns to rural classrooms to extend study hours.',
		goal: 5000,
		raised: 1200,
		ownerName: 'Amina',
		ownerEmail: 'amina@example.com',
		createdAt: new Date().toISOString(),
	},
	{
		id: uuidv4(),
		title: 'Community Water Well',
		description:
			'Fund the drilling of a clean water well for a village of 300 families.',
		goal: 8000,
		raised: 4200,
		ownerName: 'Thabo',
		ownerEmail: 'thabo@example.com',
		createdAt: new Date().toISOString(),
	},
	{
		id: uuidv4(),
		title: 'Student Robotics Club',
		description:
			'Support equipment and workshops for a high school robotics club.',
		goal: 3000,
		raised: 950,
		ownerName: 'Lerato',
		ownerEmail: 'lerato@example.com',
		createdAt: new Date().toISOString(),
	},
];

// Utilities
const toNumber = (v) => {
	const n = Number(v);
	return Number.isFinite(n) ? n : NaN;
};

const phoneIsValid = (phone) => {
	if (!phone) return false;
	const cleaned = String(phone).replace(/\s|-/g, '');
	// Very loose validation: allow +countrycode or local 0-leading, length 8-15
	return /^(\+?\d{8,15}|0\d{8,14})$/.test(cleaned);
};

// API routes
app.get('/api/health', (_req, res) => {
	res.json({ ok: true, timestamp: Date.now() });
});

app.post('/api/signup', (req, res) => {
	const { name, email } = req.body || {};
	if (!name || !email) {
		return res.status(400).json({ error: 'Name and email are required' });
	}
	const user = { id: uuidv4(), name, email, createdAt: new Date().toISOString() };
	users.push(user);
	// For demo, set a cookie-like id in response body only
	res.json({ user, message: 'Signed up (demo)' });
});

app.get('/api/projects', (_req, res) => {
	res.json({ projects });
});

app.get('/api/projects/:id', (req, res) => {
	const project = projects.find((p) => p.id === req.params.id);
	if (!project) return res.status(404).json({ error: 'Project not found' });
	const projectPledges = pledges
		.filter((pl) => pl.projectId === project.id)
		.map(({ id, amount, timestamp }) => ({ id, amount, timestamp }));
	res.json({ project, pledges: projectPledges });
});

app.post('/api/projects', (req, res) => {
	const { title, description, goal, ownerName, ownerEmail } = req.body || {};
	if (!title || !description) {
		return res.status(400).json({ error: 'Title and description are required' });
	}
	const goalNum = toNumber(goal);
	if (!Number.isFinite(goalNum) || goalNum <= 0) {
		return res.status(400).json({ error: 'Goal must be a positive number' });
	}
	const project = {
		id: uuidv4(),
		title,
		description,
		goal: goalNum,
		raised: 0,
		ownerName: ownerName || 'Anonymous',
		ownerEmail: ownerEmail || 'anonymous@example.com',
		createdAt: new Date().toISOString(),
	};
	projects.unshift(project);
	res.status(201).json({ project, message: 'Project created (demo)' });
});

app.post('/api/projects/:id/fund', (req, res) => {
	const project = projects.find((p) => p.id === req.params.id);
	if (!project) return res.status(404).json({ error: 'Project not found' });

	const { phone, amount } = req.body || {};
	if (!phoneIsValid(phone)) {
		return res.status(400).json({ error: 'Enter a valid mobile number' });
	}
	const amt = toNumber(amount);
	if (!Number.isFinite(amt) || amt <= 0) {
		return res.status(400).json({ error: 'Amount must be a positive number' });
	}

	const pledge = {
		id: uuidv4(),
		projectId: project.id,
		amount: Math.round(amt * 100) / 100,
		phone: String(phone),
		timestamp: new Date().toISOString(),
	};
	pledges.push(pledge);
	project.raised = Math.round((project.raised + pledge.amount) * 100) / 100;

	// Demo-only simulated MoMo transaction
	const transaction = {
		id: 'TX-' + uuidv4().split('-')[0].toUpperCase(),
		provider: 'MTN MoMo (demo)',
		status: 'SUCCESS',
		amount: pledge.amount,
		phone: pledge.phone,
	};
	res.json({ message: 'Payment simulated (demo)', transaction, project });
});

// Page routes
app.get('/', (_req, res) => {
	res.sendFile(path.join(htmlDir, 'index.html'));
});

app.get('/signup', (_req, res) => {
	res.sendFile(path.join(htmlDir, 'signup.html'));
});

app.get('/projects', (_req, res) => {
	res.sendFile(path.join(htmlDir, 'projects.html'));
});

app.get('/project', (_req, res) => {
	res.sendFile(path.join(htmlDir, 'project.html'));
});

app.get('/create', (_req, res) => {
	res.sendFile(path.join(htmlDir, 'create.html'));
});

app.use(express.static(htmlDir));

app.use((_req, res) => {
	res.status(404).sendFile(path.join(htmlDir, '404.html'));
});

app.listen(PORT, () => {
	console.log(`Koleka demo server running on http://localhost:${PORT}`);
});

