-- ====================================================================
-- Q3: Subscriber & Usage SQL
-- Compatible with PostgreSQL, MySQL 8+, SQLite, and SQL Server
-- ====================================================================

-- --------------------------------------------------------------------
-- 1. Table Definitions (DDL)
-- --------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS subscribers (
    id VARCHAR(10) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    plan VARCHAR(50) NOT NULL,
    activation_date DATE NOT NULL
);

CREATE TABLE IF NOT EXISTS usage (
    id INTEGER PRIMARY KEY AUTO_INCREMENT, -- SQLite: AUTOINCREMENT
    subscriberId VARCHAR(10) NOT NULL,
    callMinutes INT NOT NULL,
    smsCount INT NOT NULL,
    dataUsageMB INT NOT NULL,
    timestamp TIMESTAMP NOT NULL,
    FOREIGN KEY (subscriberId) REFERENCES subscribers(id) ON DELETE CASCADE
);

-- --------------------------------------------------------------------
-- 2. Initial Data Seeding (Reference Data from Test Spec)
-- --------------------------------------------------------------------

INSERT INTO subscribers (id, name, plan, activation_date) VALUES
('SUB01', 'Amir', 'Basic', '2023-01-12'),
('SUB02', 'Sari', 'Premium', '2022-05-03'),
('SUB03', 'Budi', 'Basic', '2024-09-20'),
('SUB04', 'Dewi', 'Family', '2021-02-15'),
('SUB05', 'Rian', 'Premium', '2023-08-08'),
('SUB06', 'Nia', 'Basic', '2024-11-30');

INSERT INTO usage (subscriberId, callMinutes, smsCount, dataUsageMB, timestamp) VALUES
('SUB01', 40, 10, 1500, '2025-08-01 08:00:00'),
('SUB01', 35, 8,  1200, '2025-08-01 12:00:00'),
('SUB02', 90, 20, 6000, '2025-08-01 08:00:00'),
('SUB02', 85, 18, 5800, '2025-08-01 12:00:00'),
('SUB03', 20, 5,  500,  '2025-08-01 08:00:00'),
('SUB04', 150, 30, 9000, '2025-08-01 08:00:00'),
('SUB05', 70, 15, 5000, '2025-08-01 08:00:00'),
('SUB06', 25, 6,  700,  '2025-08-01 08:00:00');

-- ====================================================================
-- SOLUTIONS TO Q3 QUESTIONS
-- ====================================================================

-- --------------------------------------------------------------------
-- Question 1:
-- Insert a new subscriber named Fajar, Basic plan, activated 24 January 2024.
-- --------------------------------------------------------------------
INSERT INTO subscribers (id, name, plan, activation_date)
VALUES ('SUB07', 'Fajar', 'Basic', '2024-01-24');

-- Verification Query:
-- SELECT * FROM subscribers WHERE name = 'Fajar';


-- --------------------------------------------------------------------
-- Question 2:
-- Update Fajar's plan to Premium.
-- --------------------------------------------------------------------
UPDATE subscribers
SET plan = 'Premium'
WHERE name = 'Fajar';

-- Alternative update using primary key for production safety:
-- UPDATE subscribers SET plan = 'Premium' WHERE id = 'SUB07';

-- Verification Query:
-- SELECT * FROM subscribers WHERE name = 'Fajar';


-- --------------------------------------------------------------------
-- Question 3:
-- Calculate the total data usage (sum of dataUsageMB across all snapshots)
-- for all Premium-plan subscribers.
-- --------------------------------------------------------------------
SELECT 
    SUM(u.dataUsageMB) AS total_premium_data_usage_mb
FROM usage u
JOIN subscribers s ON u.subscriberId = s.id
WHERE s.plan = 'Premium';

-- Breakdown per subscriber for additional transparency:
-- SELECT s.id, s.name, s.plan, SUM(u.dataUsageMB) AS dataUsageMB
-- FROM subscribers s
-- JOIN usage u ON s.id = u.subscriberId
-- WHERE s.plan = 'Premium'
-- GROUP BY s.id, s.name, s.plan;
-- Result:
-- Sari (SUB02): 6000 + 5800 = 11800 MB
-- Rian (SUB05): 5000 MB
-- Total = 16800 MB


-- --------------------------------------------------------------------
-- Question 4:
-- Sort and display the top 3 subscribers by total data usage across all snapshots.
-- --------------------------------------------------------------------
SELECT 
    s.id AS subscriberId,
    s.name,
    s.plan,
    SUM(u.dataUsageMB) AS total_data_usage_mb
FROM subscribers s
JOIN usage u ON s.id = u.subscriberId
GROUP BY s.id, s.name, s.plan
ORDER BY total_data_usage_mb DESC
LIMIT 3;

-- Result:
-- 1. SUB02 | Sari | Premium | 11800 MB
-- 2. SUB04 | Dewi | Family  |  9000 MB
-- 3. SUB05 | Rian | Premium |  5000 MB


-- --------------------------------------------------------------------
-- Question 5:
-- Write a subquery to find subscribers whose average call minutes per snapshot
-- is less than or equal to 30.
-- --------------------------------------------------------------------

-- Method 1: Subquery with IN and HAVING clause (Standard & Idiomatic)
SELECT 
    s.id,
    s.name,
    s.plan,
    s.activation_date
FROM subscribers s
WHERE s.id IN (
    SELECT u.subscriberId
    FROM usage u
    GROUP BY u.subscriberId
    HAVING AVG(u.callMinutes) <= 30
);

-- Method 2 (Alternative): Correlated Subquery with EXISTS
SELECT 
    s.id,
    s.name,
    s.plan,
    s.activation_date
FROM subscribers s
WHERE EXISTS (
    SELECT 1
    FROM usage u
    WHERE u.subscriberId = s.id
    GROUP BY u.subscriberId
    HAVING AVG(u.callMinutes) <= 30
);

-- Result:
-- SUB03 | Budi | Basic | 2024-09-20 (Avg call minutes = 20.00 <= 30)
-- SUB06 | Nia  | Basic | 2024-11-30 (Avg call minutes = 25.00 <= 30)
