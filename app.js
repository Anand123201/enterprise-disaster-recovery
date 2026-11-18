
const express = require("express");
const { Pool } = require("pg");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

const pool = new Pool({
    host: process.env.DB_HOST || "localhost",
    port: process.env.DB_PORT || 5432,
    user: process.env.DB_USER || "admin",
    password: process.env.DB_PASSWORD || "admin123",
    database: process.env.DB_NAME || "enterprise_db"
});

// Health check
app.get("/health", async (req, res) => {
    try {
        await pool.query("SELECT 1");
        res.status(200).json({
            status: "healthy",
            application: "Enterprise Disaster Recovery",
            database: "connected"
        });
    } catch (error) {
        res.status(503).json({
            status: "unhealthy",
            database: "disconnected"
        });
    }
});

// Home page
app.get("/", (req, res) => {
    res.json({
        message: "Enterprise Disaster Recovery System",
        server: process.env.SERVER_NAME || "Primary Server",
        status: "Running"
    });
});

// Insert records
app.post("/records", async (req, res) => {
    try {
        const { name, description } = req.body;

        const result = await pool.query(
            "INSERT INTO records (name, description) VALUES ($1, $2) RETURNING *",
            [name, description]
        );

        res.status(201).json(result.rows[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Display records
app.get("/records", async (req, res) => {
    try {
        const result = await pool.query(
            "SELECT * FROM records ORDER BY id"
        );
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

if (require.main === module) {
    app.listen(PORT, "0.0.0.0", () => {
        console.log(`Server running on port ${PORT}`);
    });
}

module.exports = { app, pool };