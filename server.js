const express = require('express');
const cors = require('cors');
const path = require('path');
const db = require('./server/db');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json({ limit: '50mb' }));

app.use(express.static(path.join(__dirname)));


db.initDb().then(() => {
    console.log("Database connected and ready.");
}).catch(err => {
    console.error("Failed to initialize database:", err);
    process.exit(1);
});

app.get('/api/settings/all', async (req, res) => {
    try {
        const rows = await db.runQuery(`SELECT * FROM settings`);
        const settingsObj = {};
        rows.forEach(r => settingsObj[r.key] = r.value);
        res.json(settingsObj);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});


app.get('/api/:table', async (req, res) => {
    try {
        const table = req.params.table;
        if (!/^[a-zA-Z0-9_]+$/.test(table)) return res.status(400).json({ error: 'Invalid table name' });

        const rows = await db.runQuery(`SELECT * FROM ${table}`);
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});


app.get('/api/:table/:id', async (req, res) => {
    try {
        const table = req.params.table;
        if (!/^[a-zA-Z0-9_]+$/.test(table)) return res.status(400).json({ error: 'Invalid table name' });

        const rows = await db.runQuery(`SELECT * FROM ${table} WHERE id = ?`, [req.params.id]);
        if (rows.length > 0) res.json(rows[0]);
        else res.status(404).json({ error: 'Not found' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

function prepareValue(val) {
    if (val === undefined) return null;
    if (typeof val === 'object' && val !== null) return JSON.stringify(val);
    if (typeof val === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(val)) {
        return val.slice(0, 19).replace('T', ' ');
    }
    return val;
}


app.post('/api/:table', async (req, res) => {
    try {
        const table = req.params.table;
        if (!/^[a-zA-Z0-9_]+$/.test(table)) return res.status(400).json({ error: 'Invalid table name' });

        const keys = Object.keys(req.body);
        const values = Object.values(req.body).map(prepareValue);
        if (keys.length === 0) return res.status(400).json({ error: 'Empty body' });

        // Enclose column names in backticks to avoid SQL keyword conflicts (e.g. 'key')
        const placeholders = keys.map(() => '?').join(', ');
        const cols = keys.map(k => `\`${k}\``).join(', ');

        await db.runAction(`INSERT INTO ${table} (${cols}) VALUES (${placeholders})`, values);
        res.json({ success: true, message: 'Record created' });
    } catch (err) {
        console.error(`Error POST /api/${req.params.table}:`, err.message);
        res.status(500).json({ error: err.message });
    }
});

app.put('/api/:table/:id', async (req, res) => {
    try {
        const table = req.params.table;
        if (!/^[a-zA-Z0-9_]+$/.test(table)) return res.status(400).json({ error: 'Invalid table name' });

        // Remove id from body if present so we don't update primary key
        const data = { ...req.body };
        delete data.id;

        const keys = Object.keys(data);
        const values = Object.values(data).map(prepareValue);
        if (keys.length === 0) return res.status(400).json({ error: 'Empty body' });

        const setClause = keys.map(k => `\`${k}\` = ?`).join(', ');
        values.push(req.params.id);

        let idColumn = 'id';
        if (table === 'settings') idColumn = '`key`';

        const result = await db.runAction(`UPDATE ${table} SET ${setClause} WHERE ${idColumn} = ?`, values);
        if (result.affectedRows > 0) res.json({ success: true, message: 'Record updated' });
        else res.status(404).json({ error: 'Not found' });
    } catch (err) {
        console.error(`Error PUT /api/${req.params.table}/${req.params.id}:`, err.message);
        res.status(500).json({ error: err.message });
    }
});

app.delete('/api/:table/:id', async (req, res) => {
    try {
        const table = req.params.table;
        if (!/^[a-zA-Z0-9_]+$/.test(table)) return res.status(400).json({ error: 'Invalid table name' });

        let idColumn = 'id';
        if (table === 'settings') idColumn = '`key`';

        const result = await db.runAction(`DELETE FROM ${table} WHERE ${idColumn} = ?`, [req.params.id]);
        if (result.affectedRows > 0) res.json({ success: true, message: 'Record deleted' });
        else res.status(404).json({ error: 'Not found' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.use((req, res, next) => {
    if (req.method === 'GET' && !req.path.startsWith('/api')) {
        return res.sendFile(path.join(__dirname, 'index.html'));
    }
    next();
});

app.listen(PORT, () => {
    console.log(`MPDO server running at http://localhost:${PORT}`);
    console.log(`Frontend: http://localhost:${PORT}/index.html`);
    console.log(`API:      http://localhost:${PORT}/api/`);
});
