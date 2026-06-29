-- Hackathon Registration & Team Formation Portal Schema Upgrades v2
-- Relational Normalization, Assigned Managers, and Local Judges

USE hackathon_portal;

SET FOREIGN_KEY_CHECKS = 0;

-- 1. Recreate Team_Members Table fresh with direct member enrollment details
DROP TABLE IF EXISTS Team_Members;
CREATE TABLE Team_Members (
    member_id INT AUTO_INCREMENT PRIMARY KEY,
    team_id INT NOT NULL,
    user_id INT NOT NULL,
    enrollment_number VARCHAR(50) NOT NULL,
    phone_number VARCHAR(20) NOT NULL,
    github_url VARCHAR(255) NULL,
    branch VARCHAR(100) NOT NULL,
    year INT NOT NULL CHECK (year BETWEEN 1 AND 5),
    role VARCHAR(50) NOT NULL DEFAULT 'Developer',
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (team_id) REFERENCES Teams(team_id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES Users(user_id) ON DELETE CASCADE,
    CONSTRAINT unique_team_member UNIQUE (team_id, user_id),
    CONSTRAINT unique_enrollment_in_team UNIQUE (team_id, enrollment_number)
);

-- 2. Create Hackathon_Managers Table (Assigned Managers, not global)
DROP TABLE IF EXISTS Hackathon_Managers;
CREATE TABLE Hackathon_Managers (
    manager_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    hackathon_id INT NOT NULL,
    assigned_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status ENUM('Active', 'Inactive') NOT NULL DEFAULT 'Active',
    UNIQUE KEY unique_manager_assignment (user_id, hackathon_id),
    FOREIGN KEY (user_id) REFERENCES Users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (hackathon_id) REFERENCES Hackathons(hackathon_id) ON DELETE CASCADE
);

-- 3. Create Judges Table
DROP TABLE IF EXISTS Judges;
CREATE TABLE Judges (
    judge_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL UNIQUE,
    specialization VARCHAR(150) NOT NULL,
    organization VARCHAR(150) NOT NULL,
    experience INT NOT NULL CHECK (experience >= 0),
    status ENUM('Active', 'Inactive') NOT NULL DEFAULT 'Active',
    FOREIGN KEY (user_id) REFERENCES Users(user_id) ON DELETE CASCADE
);

-- 4. Create Judge_Assignments Table (Local assignments per hackathon)
DROP TABLE IF EXISTS Judge_Assignments;
CREATE TABLE Judge_Assignments (
    assignment_id INT AUTO_INCREMENT PRIMARY KEY,
    judge_id INT NOT NULL,
    hackathon_id INT NOT NULL,
    assigned_by INT NULL,
    assigned_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status ENUM('Active', 'Inactive') NOT NULL DEFAULT 'Active',
    UNIQUE KEY unique_judge_hackathon (judge_id, hackathon_id),
    FOREIGN KEY (judge_id) REFERENCES Judges(judge_id) ON DELETE CASCADE,
    FOREIGN KEY (hackathon_id) REFERENCES Hackathons(hackathon_id) ON DELETE CASCADE,
    FOREIGN KEY (assigned_by) REFERENCES Users(user_id) ON DELETE SET NULL
);

-- 5. Drop old unused invitations tables/relations to keep db optimized
DROP TABLE IF EXISTS Invitations;

-- 6. Recreate Evaluations Table fresh referencing Judges table PK
DROP TABLE IF EXISTS Evaluations;
CREATE TABLE Evaluations (
    evaluation_id INT AUTO_INCREMENT PRIMARY KEY,
    judge_id INT NOT NULL,
    submission_id INT NOT NULL,
    marks INT NOT NULL CHECK (marks BETWEEN 0 AND 100),
    feedback TEXT NOT NULL,
    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY unique_judge_evaluation (judge_id, submission_id),
    FOREIGN KEY (judge_id) REFERENCES Judges(judge_id) ON DELETE CASCADE,
    FOREIGN KEY (submission_id) REFERENCES Submissions(submission_id) ON DELETE CASCADE
);

SET FOREIGN_KEY_CHECKS = 1;

-- =========================================================================
-- LEADERBOARD VIEW
-- =========================================================================

-- Re-create Leaderboard_View to compute dynamic average scores from multiple judges
CREATE OR REPLACE VIEW Leaderboard_View AS
SELECT 
    t.team_id,
    t.team_name,
    h.hackathon_id,
    h.title AS hackathon_title,
    s.project_title,
    ROUND(AVG(e.marks), 2) AS average_score,
    COUNT(e.evaluation_id) AS total_evaluations
FROM Teams t
JOIN Hackathons h ON t.hackathon_id = h.hackathon_id
JOIN Submissions s ON t.team_id = s.team_id
LEFT JOIN Evaluations e ON s.submission_id = e.submission_id
GROUP BY t.team_id, t.team_name, h.hackathon_id, h.title, s.project_title
ORDER BY average_score DESC;
