const express = require('express');
const fs = require('fs').promises;
const path = require('path');

const app = express();
const PORT = 3000;
const TASKS_FILE = path.join(__dirname, 'tasks.txt');

app.use(express.json());
app.use(express.static(__dirname));

app.get('/api/tasks', async (req, res) => {
    try {
        const data = await fs.readFile(TASKS_FILE, 'utf-8');
        res.json(JSON.parse(data));
    } catch (error) {
        res.json([]);
    }
});

app.post('/api/tasks', async (req, res) => {
    try {
        const tasks = req.body;
        await fs.writeFile(TASKS_FILE, JSON.stringify(tasks, null, 2));
        res.json({ status: 'ok' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to save tasks' });
    }
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
