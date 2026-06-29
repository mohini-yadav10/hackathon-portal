-- Hackathon Registration & Team Formation Portal Schema Upgrades v3
-- Detailed Team-level Judge Assignments, Multi-Criteria Evaluations, Views, and Procedures

USE hackathon_portal;

SET FOREIGN_KEY_CHECKS = 0;

-- 1. Recreate Judge_Assignments Table mapping a Judge to a specific Team
DROP TABLE IF EXISTS Judge_Assignments;
CREATE TABLE Judge_Assignments (
    assignment_id INT AUTO_INCREMENT PRIMARY KEY,
    judge_id INT NOT NULL,
    hackathon_id INT NOT NULL,
    team_id INT NOT NULL,
    assigned_by INT NOT NULL, -- manager user_id
    assigned_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status ENUM('Active', 'Inactive') NOT NULL DEFAULT 'Active',
    UNIQUE KEY unique_judge_team_hackathon (judge_id, team_id, hackathon_id),
    FOREIGN KEY (judge_id) REFERENCES Judges(judge_id) ON DELETE CASCADE,
    FOREIGN KEY (hackathon_id) REFERENCES Hackathons(hackathon_id) ON DELETE CASCADE,
    FOREIGN KEY (team_id) REFERENCES Teams(team_id) ON DELETE CASCADE,
    FOREIGN KEY (assigned_by) REFERENCES Users(user_id) ON DELETE CASCADE
);

-- 2. Recreate Evaluations Table with multi-criteria scoring parameters
DROP TABLE IF EXISTS Evaluations;
CREATE TABLE Evaluations (
    evaluation_id INT AUTO_INCREMENT PRIMARY KEY,
    judge_id INT NOT NULL,
    submission_id INT NOT NULL,
    innovation INT NOT NULL CHECK (innovation BETWEEN 0 AND 20),
    technical_complexity INT NOT NULL CHECK (technical_complexity BETWEEN 0 AND 20),
    ui_ux INT NOT NULL CHECK (ui_ux BETWEEN 0 AND 15),
    database_design INT NOT NULL CHECK (database_design BETWEEN 0 AND 15),
    presentation INT NOT NULL CHECK (presentation BETWEEN 0 AND 15),
    documentation INT NOT NULL CHECK (documentation BETWEEN 0 AND 15),
    marks INT NOT NULL DEFAULT 0, -- Sum of above criteria (calculated automatically)
    feedback TEXT NOT NULL,
    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY unique_judge_evaluation (judge_id, submission_id),
    FOREIGN KEY (judge_id) REFERENCES Judges(judge_id) ON DELETE CASCADE,
    FOREIGN KEY (submission_id) REFERENCES Submissions(submission_id) ON DELETE CASCADE
);

SET FOREIGN_KEY_CHECKS = 1;

-- =========================================================================
-- DATABASE VIEWS (3NF)
-- =========================================================================

-- View 1: Team_Registration_View (Aggregates all teammate properties and project files)
CREATE OR REPLACE VIEW Team_Registration_View AS
SELECT 
    t.team_id,
    t.team_name,
    t.team_size,
    t.status AS team_status,
    h.hackathon_id,
    h.title AS hackathon_title,
    r.registration_id,
    r.status AS registration_status,
    r.submitted_at AS registration_date,
    ul.user_id AS leader_id,
    ul.name AS leader_name,
    ul.email AS leader_email,
    s.submission_id,
    s.project_title,
    s.description AS project_desc,
    s.github_url AS github_repo,
    s.ppt_url AS ppt_link,
    s.demo_video_url AS video_link,
    s.problem_statement,
    s.solution
FROM Teams t
JOIN Hackathons h ON t.hackathon_id = h.hackathon_id
LEFT JOIN Registrations r ON t.team_id = r.team_id
LEFT JOIN Users ul ON t.leader_id = ul.user_id
LEFT JOIN Submissions s ON t.team_id = s.team_id;

-- View 2: Manager_Dashboard_View (Managers view of pending teams and assigned judges stats)
CREATE OR REPLACE VIEW Manager_Dashboard_View AS
SELECT 
    tr.*,
    hm.user_id AS manager_user_id,
    (SELECT COUNT(*) FROM Judge_Assignments ja WHERE ja.team_id = tr.team_id AND ja.status = 'Active') AS assigned_judges_count
FROM Team_Registration_View tr
JOIN Hackathon_Managers hm ON tr.hackathon_id = hm.hackathon_id;

-- View 3: Judge_Dashboard_View (Assigned projects view for judges)
CREATE OR REPLACE VIEW Judge_Dashboard_View AS
SELECT 
    ja.assignment_id,
    ja.judge_id,
    ja.status AS assignment_status,
    j.user_id AS judge_user_id,
    tr.*,
    e.evaluation_id,
    e.innovation,
    e.technical_complexity,
    e.ui_ux,
    e.database_design,
    e.presentation,
    e.documentation,
    e.marks AS score_awarded,
    e.feedback AS judge_feedback
FROM Judge_Assignments ja
JOIN Judges j ON ja.judge_id = j.judge_id
JOIN Team_Registration_View tr ON ja.team_id = tr.team_id AND ja.hackathon_id = tr.hackathon_id
LEFT JOIN Evaluations e ON tr.submission_id = e.submission_id AND e.judge_id = ja.judge_id;

-- View 4: Evaluation_Summary_View (Leaderboard data and score compilation)
CREATE OR REPLACE VIEW Evaluation_Summary_View AS
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
GROUP BY t.team_id, t.team_name, h.hackathon_id, h.title, s.project_title;


-- =========================================================================
-- STORED PROCEDURES
-- =========================================================================

DELIMITER $$

-- Procedure 1: Assign Judge to a Team
DROP PROCEDURE IF EXISTS AssignJudge$$
CREATE PROCEDURE AssignJudge(
    IN p_judge_id INT,
    IN p_hackathon_id INT,
    IN p_team_id INT,
    IN p_assigned_by INT
)
BEGIN
    DECLARE v_judge_user_id INT;
    DECLARE v_manager_name VARCHAR(100);
    DECLARE v_team_name VARCHAR(100);

    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        RESIGNAL;
    END;

    START TRANSACTION;

    -- Fetch info
    SELECT user_id INTO v_judge_user_id FROM Judges WHERE judge_id = p_judge_id;
    SELECT name INTO v_manager_name FROM Users WHERE user_id = p_assigned_by;
    SELECT team_name INTO v_team_name FROM Teams WHERE team_id = p_team_id;

    -- Insert assignment
    INSERT INTO Judge_Assignments (judge_id, hackathon_id, team_id, assigned_by, status)
    VALUES (p_judge_id, p_hackathon_id, p_team_id, p_assigned_by, 'Active')
    ON DUPLICATE KEY UPDATE status = 'Active';

    -- Insert notification for the judge
    INSERT INTO Notifications (user_id, message)
    VALUES (
        v_judge_user_id,
        CONCAT('Manager ', v_manager_name, ' has assigned you to evaluate team "', v_team_name, '".')
    );

    COMMIT;
END$$

-- Procedure 2: Submit Evaluation
DROP PROCEDURE IF EXISTS SubmitEvaluation$$
CREATE PROCEDURE SubmitEvaluation(
    IN p_judge_id INT,
    IN p_submission_id INT,
    IN p_innovation INT,
    IN p_tech INT,
    IN p_ui INT,
    IN p_db INT,
    IN p_pres INT,
    IN p_doc INT,
    IN p_feedback TEXT
)
BEGIN
    DECLARE v_total_marks INT;
    DECLARE v_team_id INT;
    DECLARE v_hackathon_id INT;
    DECLARE v_team_name VARCHAR(100);
    DECLARE v_judge_name VARCHAR(100);
    DECLARE v_judge_user_id INT;

    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        RESIGNAL;
    END;

    START TRANSACTION;

    -- Calculate total marks
    SET v_total_marks = p_innovation + p_tech + p_ui + p_db + p_pres + p_doc;

    -- Fetch team and hackathon
    SELECT team_id, hackathon_id INTO v_team_id, v_hackathon_id 
    FROM Submissions WHERE submission_id = p_submission_id;

    SELECT team_name INTO v_team_name FROM Teams WHERE team_id = v_team_id;
    SELECT user_id INTO v_judge_user_id FROM Judges WHERE judge_id = p_judge_id;
    SELECT name INTO v_judge_name FROM Users WHERE user_id = v_judge_user_id;

    -- Insert or Update Evaluation
    INSERT INTO Evaluations (
        judge_id, submission_id, innovation, technical_complexity, ui_ux, 
        database_design, presentation, documentation, marks, feedback
    ) VALUES (
        p_judge_id, p_submission_id, p_innovation, p_tech, p_ui, 
        p_db, p_pres, p_doc, v_total_marks, p_feedback
    )
    ON DUPLICATE KEY UPDATE 
        innovation = p_innovation,
        technical_complexity = p_tech,
        ui_ux = p_ui,
        database_design = p_db,
        presentation = p_pres,
        documentation = p_doc,
        marks = v_total_marks,
        feedback = p_feedback;

    -- Notify Manager of the Hackathon
    INSERT INTO Notifications (user_id, message)
    SELECT hm.user_id, CONCAT('Judge ', v_judge_name, ' has submitted evaluation for team "', v_team_name, '". Score: ', v_total_marks, '/100')
    FROM Hackathon_Managers hm
    WHERE hm.hackathon_id = v_hackathon_id AND hm.status = 'Active';

    COMMIT;
END$$

-- Procedure 3: Calculate Final Score
DROP PROCEDURE IF EXISTS CalculateFinalScore$$
CREATE PROCEDURE CalculateFinalScore(
    IN p_submission_id INT,
    OUT p_avg_score DECIMAL(5,2)
)
BEGIN
    SELECT AVG(marks) INTO p_avg_score
    FROM Evaluations
    WHERE submission_id = p_submission_id;
END$$

-- Procedure 4: Generate Leaderboard
DROP PROCEDURE IF EXISTS GenerateLeaderboard$$
CREATE PROCEDURE GenerateLeaderboard(
    IN p_hackathon_id INT
)
BEGIN
    SELECT * FROM Evaluation_Summary_View 
    WHERE hackathon_id = p_hackathon_id
    ORDER BY average_score DESC;
END$$

DELIMITER ;


-- =========================================================================
-- DATABASE TRIGGERS
-- =========================================================================

DELIMITER $$

-- Trigger to notify Admin when all assigned judges have finished evaluation for a team
DROP TRIGGER IF EXISTS after_evaluation_insert_update$$
CREATE TRIGGER after_evaluation_insert_update
AFTER INSERT ON Evaluations
FOR EACH ROW
BEGIN
    DECLARE v_team_id INT;
    DECLARE v_team_name VARCHAR(100);
    DECLARE v_hackathon_id INT;
    DECLARE v_hackathon_title VARCHAR(150);
    DECLARE v_assigned_judges INT;
    DECLARE v_completed_evaluations INT;

    -- Fetch team and hackathon info
    SELECT team_id, hackathon_id INTO v_team_id, v_hackathon_id 
    FROM Submissions WHERE submission_id = NEW.submission_id;

    SELECT team_name INTO v_team_name FROM Teams WHERE team_id = v_team_id;
    SELECT title INTO v_hackathon_title FROM Hackathons WHERE hackathon_id = v_hackathon_id;

    -- Get total count of assigned judges for this team
    SELECT COUNT(*) INTO v_assigned_judges 
    FROM Judge_Assignments 
    WHERE team_id = v_team_id AND status = 'Active';

    -- Get count of completed evaluations for this project submission
    SELECT COUNT(*) INTO v_completed_evaluations 
    FROM Evaluations 
    WHERE submission_id = NEW.submission_id;

    -- If all assigned judges finished, notify Admin users
    IF v_assigned_judges > 0 AND v_completed_evaluations = v_assigned_judges THEN
        INSERT INTO Notifications (user_id, message)
        SELECT u.user_id, CONCAT('All assigned judges (', v_assigned_judges, ') have completed evaluations for team "', v_team_name, '" in hackathon "', v_hackathon_title, '".')
        FROM Users u
        WHERE u.role = 'Admin';
    END IF;
END$$

DELIMITER ;
