
CREATE TABLE IF NOT EXISTS records (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO records (name, description)
VALUES
('Backup Test', 'Initial disaster recovery test record'),
('Enterprise System', 'Testing database backup and restore');
