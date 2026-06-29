-- Hackathon Registration & Team Formation Portal Upgrade Schema
-- DB Migrations & Role Extensions (Student, Leader, Judge, Manager, Admin)

USE hackathon_portal;

-- Disable checks temporarily
SET FOREIGN_KEY_CHECKS = 0;

-- 1. Modify Users table to support 5 distinct roles and password reset fields
ALTER TABLE Users 
    MODIFY COLUMN role ENUM('Student', 'Leader', 'Judge', 'Manager', 'Admin') NOT NULL DEFAULT 'Student',
    ADD COLUMN reset_password_token VARCHAR(255) NULL,
    ADD COLUMN reset_password_expire DATETIME NULL;

-- 2. Modify Student_Profiles to support profile picture
ALTER TABLE Student_Profiles
    ADD COLUMN profile_pic_path VARCHAR(255) NULL;

-- 3. Create Bookmarks Table (Many-to-Many between Student and Hackathons)
CREATE TABLE IF NOT EXISTS Bookmarks (
    user_id INT NOT NULL,
    hackathon_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, hackathon_id),
    FOREIGN KEY (user_id) REFERENCES Users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (hackathon_id) REFERENCES Hackathons(hackathon_id) ON DELETE CASCADE
);

-- 4. Create Refresh_Tokens Table (Security & JWT Token rotation)
CREATE TABLE IF NOT EXISTS Refresh_Tokens (
    token_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    token VARCHAR(255) NOT NULL UNIQUE,
    expires_at DATETIME NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES Users(user_id) ON DELETE CASCADE
);

-- 5. Create Submissions Table (Approved Teams can submit project deliverables)
CREATE TABLE IF NOT EXISTS Submissions (
    submission_id INT AUTO_INCREMENT PRIMARY KEY,
    team_id INT NOT NULL UNIQUE,
    hackathon_id INT NOT NULL,
    project_title VARCHAR(150) NOT NULL,
    description TEXT NOT NULL,
    problem_statement TEXT NOT NULL,
    solution TEXT NOT NULL,
    tech_stack VARCHAR(255) NOT NULL,
    github_url VARCHAR(255) NOT NULL,
    ppt_url VARCHAR(255) NULL,
    demo_video_url VARCHAR(255) NULL,
    project_images VARCHAR(500) NULL, -- comma-separated list of image paths
    project_documents VARCHAR(500) NULL, -- comma-separated list of document paths
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (team_id) REFERENCES Teams(team_id) ON DELETE CASCADE,
    FOREIGN KEY (hackathon_id) REFERENCES Hackathons(hackathon_id) ON DELETE CASCADE
);

-- 6. Create Evaluations Table (Judges evaluate projects)
CREATE TABLE IF NOT EXISTS Evaluations (
    evaluation_id INT AUTO_INCREMENT PRIMARY KEY,
    judge_id INT NOT NULL,
    submission_id INT NOT NULL,
    marks INT NOT NULL CHECK (marks BETWEEN 0 AND 100),
    feedback TEXT NOT NULL,
    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY unique_judge_evaluation (judge_id, submission_id),
    FOREIGN KEY (judge_id) REFERENCES Users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (submission_id) REFERENCES Submissions(submission_id) ON DELETE CASCADE
);

-- 7. Create Judge_Assignments Table (Hackathon Managers assign judges to hackathons)
CREATE TABLE IF NOT EXISTS Judge_Assignments (
    assignment_id INT AUTO_INCREMENT PRIMARY KEY,
    judge_id INT NOT NULL,
    hackathon_id INT NOT NULL,
    assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_judge_assignment (judge_id, hackathon_id),
    FOREIGN KEY (judge_id) REFERENCES Users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (hackathon_id) REFERENCES Hackathons(hackathon_id) ON DELETE CASCADE
);

-- Re-enable checks
SET FOREIGN_KEY_CHECKS = 1;

-- =========================================================================
-- DATABASE VIEWS
-- =========================================================================

-- View 4: Leaderboard View (Rank teams based on average judge score)
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


-- =========================================================================
-- STORED PROCEDURES
-- =========================================================================

-- Stored Procedure to safely submit a project deliverables with checks
DELIMITER $$
DROP PROCEDURE IF EXISTS SubmitProject$$
CREATE PROCEDURE SubmitProject(
    IN p_team_id INT,
    IN p_hackathon_id INT,
    IN p_project_title VARCHAR(150),
    IN p_description TEXT,
    IN p_problem_statement TEXT,
    IN p_solution TEXT,
    IN p_tech_stack VARCHAR(255),
    IN p_github_url VARCHAR(255),
    IN p_ppt_url VARCHAR(255),
    IN p_demo_video_url VARCHAR(255)
)
BEGIN
    DECLARE v_reg_status VARCHAR(20);
    
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        RESIGNAL;
    END;
    
    START TRANSACTION;
    
    -- Verify registration is approved
    SELECT status INTO v_reg_status FROM Registrations WHERE team_id = p_team_id AND hackathon_id = p_hackathon_id;
    
    IF v_reg_status IS NULL OR v_reg_status != 'Approved' THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Only approved registered teams can submit a project.';
    END IF;
    
    -- Insert or Update Project Submission
    INSERT INTO Submissions (team_id, hackathon_id, project_title, description, problem_statement, solution, tech_stack, github_url, ppt_url, demo_video_url)
    VALUES (p_team_id, p_hackathon_id, p_project_title, p_description, p_problem_statement, p_solution, p_tech_stack, p_github_url, p_ppt_url, p_demo_video_url)
    ON DUPLICATE KEY UPDATE
        project_title = p_project_title,
        description = p_description,
        problem_statement = p_problem_statement,
        solution = p_solution,
        tech_stack = p_tech_stack,
        github_url = p_github_url,
        ppt_url = p_ppt_url,
        demo_video_url = p_demo_video_url;
        
    COMMIT;
END$$
DELIMITER ;
