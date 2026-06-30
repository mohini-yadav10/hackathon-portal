-- ============================================================
-- HACKATHON PORTAL - RAILWAY DEPLOYMENT SQL
-- Run this entire file on Railway MySQL (database: railway)
-- ============================================================

SET FOREIGN_KEY_CHECKS = 0;

-- Drop all tables if exist (clean slate)
DROP TABLE IF EXISTS Evaluations;
DROP TABLE IF EXISTS Judge_Assignments;
DROP TABLE IF EXISTS Submissions;
DROP TABLE IF EXISTS Judges;
DROP TABLE IF EXISTS Hackathon_Managers;
DROP TABLE IF EXISTS Registration_Logs;
DROP TABLE IF EXISTS Registrations;
DROP TABLE IF EXISTS Invitations;
DROP TABLE IF EXISTS Team_Members;
DROP TABLE IF EXISTS Teams;
DROP TABLE IF EXISTS Bookmarks;
DROP TABLE IF EXISTS Student_Interests;
DROP TABLE IF EXISTS Student_Skills;
DROP TABLE IF EXISTS Student_Profiles;
DROP TABLE IF EXISTS Announcements;
DROP TABLE IF EXISTS Notifications;
DROP TABLE IF EXISTS Hackathons;
DROP TABLE IF EXISTS Users;

SET FOREIGN_KEY_CHECKS = 1;

-- ============================================================
-- TABLES
-- ============================================================

CREATE TABLE Users (
    user_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    college VARCHAR(150),
    branch VARCHAR(100),
    year INT CHECK (year BETWEEN 1 AND 5),
    role ENUM('Student', 'Leader', 'Judge', 'Manager', 'Admin') NOT NULL DEFAULT 'Student',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_users_email ON Users(email);

CREATE TABLE Student_Profiles (
    profile_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL UNIQUE,
    github_url VARCHAR(255),
    linkedin_url VARCHAR(255),
    resume_path VARCHAR(255),
    avatar_path VARCHAR(255),
    bio TEXT,
    phone VARCHAR(20),
    enrollment_no VARCHAR(50),
    FOREIGN KEY (user_id) REFERENCES Users(user_id) ON DELETE CASCADE
);

CREATE TABLE Student_Skills (
    user_id INT NOT NULL,
    skill VARCHAR(50) NOT NULL,
    PRIMARY KEY (user_id, skill),
    FOREIGN KEY (user_id) REFERENCES Users(user_id) ON DELETE CASCADE
);

CREATE TABLE Student_Interests (
    user_id INT NOT NULL,
    interest VARCHAR(50) NOT NULL,
    PRIMARY KEY (user_id, interest),
    FOREIGN KEY (user_id) REFERENCES Users(user_id) ON DELETE CASCADE
);

CREATE TABLE Hackathons (
    hackathon_id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(150) NOT NULL,
    description TEXT,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    location VARCHAR(100) DEFAULT 'Online',
    max_team_size INT NOT NULL DEFAULT 4 CHECK (max_team_size >= 1),
    registration_deadline DATETIME NOT NULL,
    status ENUM('Draft', 'Published', 'Completed') NOT NULL DEFAULT 'Draft',
    prize_pool VARCHAR(100),
    domain VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_hackathons_status_deadline ON Hackathons(status, registration_deadline);

CREATE TABLE Hackathon_Managers (
    hm_id INT AUTO_INCREMENT PRIMARY KEY,
    hackathon_id INT NOT NULL,
    user_id INT NOT NULL,
    assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status ENUM('Active', 'Inactive') NOT NULL DEFAULT 'Active',
    UNIQUE KEY unique_hackathon_manager (hackathon_id, user_id),
    FOREIGN KEY (hackathon_id) REFERENCES Hackathons(hackathon_id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES Users(user_id) ON DELETE CASCADE
);

CREATE TABLE Judges (
    judge_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL UNIQUE,
    expertise VARCHAR(255),
    FOREIGN KEY (user_id) REFERENCES Users(user_id) ON DELETE CASCADE
);

CREATE TABLE Teams (
    team_id INT AUTO_INCREMENT PRIMARY KEY,
    hackathon_id INT NOT NULL,
    leader_id INT,
    team_name VARCHAR(100) NOT NULL,
    team_size INT NOT NULL DEFAULT 1 CHECK (team_size >= 1),
    college VARCHAR(150),
    project_domain VARCHAR(100),
    status ENUM('Open', 'Closed') NOT NULL DEFAULT 'Open',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (hackathon_id) REFERENCES Hackathons(hackathon_id) ON DELETE CASCADE,
    FOREIGN KEY (leader_id) REFERENCES Users(user_id) ON DELETE SET NULL
);

CREATE INDEX idx_teams_hackathon_id ON Teams(hackathon_id);

CREATE TABLE Team_Members (
    member_id INT AUTO_INCREMENT PRIMARY KEY,
    team_id INT NOT NULL,
    user_id INT NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'Developer',
    branch VARCHAR(100),
    year INT,
    enrollment_no VARCHAR(50),
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (team_id) REFERENCES Teams(team_id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES Users(user_id) ON DELETE CASCADE,
    CONSTRAINT unique_team_member UNIQUE (team_id, user_id)
);

CREATE TABLE Invitations (
    invitation_id INT AUTO_INCREMENT PRIMARY KEY,
    sender_id INT NOT NULL,
    receiver_id INT NOT NULL,
    team_id INT NOT NULL,
    status ENUM('Pending', 'Accepted', 'Rejected') NOT NULL DEFAULT 'Pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (sender_id) REFERENCES Users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (receiver_id) REFERENCES Users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (team_id) REFERENCES Teams(team_id) ON DELETE CASCADE
);

CREATE INDEX idx_invitations_receiver ON Invitations(receiver_id, status);

CREATE TABLE Registrations (
    registration_id INT AUTO_INCREMENT PRIMARY KEY,
    team_id INT NOT NULL UNIQUE,
    hackathon_id INT NOT NULL,
    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status ENUM('Pending', 'Approved', 'Rejected') NOT NULL DEFAULT 'Pending',
    FOREIGN KEY (team_id) REFERENCES Teams(team_id) ON DELETE CASCADE,
    FOREIGN KEY (hackathon_id) REFERENCES Hackathons(hackathon_id) ON DELETE CASCADE
);

CREATE TABLE Registration_Logs (
    log_id INT AUTO_INCREMENT PRIMARY KEY,
    registration_id INT NOT NULL,
    old_status VARCHAR(20),
    new_status VARCHAR(20),
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE Notifications (
    notification_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES Users(user_id) ON DELETE CASCADE
);

CREATE INDEX idx_notifications_unread ON Notifications(user_id, is_read);

CREATE TABLE Announcements (
    announcement_id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(150) NOT NULL,
    description TEXT,
    created_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES Users(user_id) ON DELETE SET NULL
);

CREATE TABLE Bookmarks (
    bookmark_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    hackathon_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_bookmark (user_id, hackathon_id),
    FOREIGN KEY (user_id) REFERENCES Users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (hackathon_id) REFERENCES Hackathons(hackathon_id) ON DELETE CASCADE
);

CREATE TABLE Submissions (
    submission_id INT AUTO_INCREMENT PRIMARY KEY,
    team_id INT NOT NULL UNIQUE,
    hackathon_id INT NOT NULL,
    project_title VARCHAR(200) NOT NULL,
    description TEXT,
    github_url VARCHAR(500),
    ppt_url VARCHAR(500),
    demo_video_url VARCHAR(500),
    problem_statement TEXT,
    solution TEXT,
    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (team_id) REFERENCES Teams(team_id) ON DELETE CASCADE,
    FOREIGN KEY (hackathon_id) REFERENCES Hackathons(hackathon_id) ON DELETE CASCADE
);

CREATE TABLE Judge_Assignments (
    assignment_id INT AUTO_INCREMENT PRIMARY KEY,
    judge_id INT NOT NULL,
    hackathon_id INT NOT NULL,
    team_id INT NOT NULL,
    assigned_by INT NOT NULL,
    assigned_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status ENUM('Active', 'Inactive') NOT NULL DEFAULT 'Active',
    UNIQUE KEY unique_judge_team_hackathon (judge_id, team_id, hackathon_id),
    FOREIGN KEY (judge_id) REFERENCES Judges(judge_id) ON DELETE CASCADE,
    FOREIGN KEY (hackathon_id) REFERENCES Hackathons(hackathon_id) ON DELETE CASCADE,
    FOREIGN KEY (team_id) REFERENCES Teams(team_id) ON DELETE CASCADE,
    FOREIGN KEY (assigned_by) REFERENCES Users(user_id) ON DELETE CASCADE
);

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
    marks INT NOT NULL DEFAULT 0,
    feedback TEXT NOT NULL,
    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY unique_judge_evaluation (judge_id, submission_id),
    FOREIGN KEY (judge_id) REFERENCES Judges(judge_id) ON DELETE CASCADE,
    FOREIGN KEY (submission_id) REFERENCES Submissions(submission_id) ON DELETE CASCADE
);

-- ============================================================
-- VIEWS
-- ============================================================

CREATE OR REPLACE VIEW Team_Registration_View AS
SELECT 
    t.team_id, t.team_name, t.team_size, t.status AS team_status,
    h.hackathon_id, h.title AS hackathon_title,
    r.registration_id, r.status AS registration_status, r.submitted_at AS registration_date,
    ul.user_id AS leader_id, ul.name AS leader_name, ul.email AS leader_email,
    s.submission_id, s.project_title,
    s.description AS project_desc,
    s.github_url AS github_repo,
    s.ppt_url AS ppt_link,
    s.demo_video_url AS video_link,
    s.problem_statement, s.solution
FROM Teams t
JOIN Hackathons h ON t.hackathon_id = h.hackathon_id
LEFT JOIN Registrations r ON t.team_id = r.team_id
LEFT JOIN Users ul ON t.leader_id = ul.user_id
LEFT JOIN Submissions s ON t.team_id = s.team_id;

CREATE OR REPLACE VIEW Manager_Dashboard_View AS
SELECT 
    tr.*, hm.user_id AS manager_user_id,
    (SELECT COUNT(*) FROM Judge_Assignments ja WHERE ja.team_id = tr.team_id AND ja.status = 'Active') AS assigned_judges_count
FROM Team_Registration_View tr
JOIN Hackathon_Managers hm ON tr.hackathon_id = hm.hackathon_id;

CREATE OR REPLACE VIEW Judge_Dashboard_View AS
SELECT 
    ja.assignment_id, ja.judge_id, ja.status AS assignment_status,
    j.user_id AS judge_user_id, tr.*,
    e.evaluation_id, e.innovation, e.technical_complexity, e.ui_ux,
    e.database_design, e.presentation, e.documentation,
    e.marks AS score_awarded, e.feedback AS judge_feedback
FROM Judge_Assignments ja
JOIN Judges j ON ja.judge_id = j.judge_id
JOIN Team_Registration_View tr ON ja.team_id = tr.team_id AND ja.hackathon_id = tr.hackathon_id
LEFT JOIN Evaluations e ON tr.submission_id = e.submission_id AND e.judge_id = ja.judge_id;

CREATE OR REPLACE VIEW Evaluation_Summary_View AS
SELECT 
    t.team_id, t.team_name, h.hackathon_id, h.title AS hackathon_title,
    s.project_title,
    ROUND(AVG(e.marks), 2) AS average_score,
    COUNT(e.evaluation_id) AS total_evaluations
FROM Teams t
JOIN Hackathons h ON t.hackathon_id = h.hackathon_id
JOIN Submissions s ON t.team_id = s.team_id
LEFT JOIN Evaluations e ON s.submission_id = e.submission_id
GROUP BY t.team_id, t.team_name, h.hackathon_id, h.title, s.project_title;

-- ============================================================
-- SEED DATA (Demo users - password for all is: password123)
-- ============================================================

-- Admin
INSERT INTO Users (user_id, name, email, password, college, branch, year, role) VALUES
(1, 'Admin User', 'admin@hackportal.com', '$2b$10$WpZ6G9b.M.iK51Wf6/T2r.N5s/J3y5DqD5aT3uTfHwDk1N4rS3j6m', 'System Admin College', 'CSE', 4, 'Admin');

-- Manager
INSERT INTO Users (user_id, name, email, password, college, branch, year, role) VALUES
(2, 'Dr. Manager Kumar', 'manager@hackportal.com', '$2b$10$WpZ6G9b.M.iK51Wf6/T2r.N5s/J3y5DqD5aT3uTfHwDk1N4rS3j6m', 'BITS Pilani', 'CSE', 4, 'Manager');

-- Judge
INSERT INTO Users (user_id, name, email, password, college, branch, year, role) VALUES
(3, 'Prof. Judge Sharma', 'judge@hackportal.com', '$2b$10$WpZ6G9b.M.iK51Wf6/T2r.N5s/J3y5DqD5aT3uTfHwDk1N4rS3j6m', 'IIT Bombay', 'CSE', 4, 'Judge');

-- Students
INSERT INTO Users (user_id, name, email, password, college, branch, year, role) VALUES
(4, 'Aditya Sharma', 'student@hackportal.com', '$2b$10$WpZ6G9b.M.iK51Wf6/T2r.N5s/J3y5DqD5aT3uTfHwDk1N4rS3j6m', 'IIT Bombay', 'Computer Science', 3, 'Student'),
(5, 'Rohan Verma', 'rohan@gmail.com', '$2b$10$WpZ6G9b.M.iK51Wf6/T2r.N5s/J3y5DqD5aT3uTfHwDk1N4rS3j6m', 'IIT Bombay', 'Information Technology', 3, 'Student'),
(6, 'Sneha Reddy', 'sneha@gmail.com', '$2b$10$WpZ6G9b.M.iK51Wf6/T2r.N5s/J3y5DqD5aT3uTfHwDk1N4rS3j6m', 'BITS Pilani', 'Electronics', 4, 'Student');

-- Profiles
INSERT INTO Student_Profiles (user_id, github_url, linkedin_url, bio) VALUES
(4, 'https://github.com/adityasharma', 'https://linkedin.com/in/adityasharma', 'Full stack developer passionate about React and Node.js.'),
(5, 'https://github.com/rohanverma', 'https://linkedin.com/in/rohanverma', 'Data Scientist and Python programmer.'),
(6, 'https://github.com/snehareddy', 'https://linkedin.com/in/snehareddy', 'UI/UX Designer and frontend enthusiast.');

-- Judges table entry
INSERT INTO Judges (user_id, expertise) VALUES (3, 'AI/ML, Web Development, Database Design');

-- Hackathons
INSERT INTO Hackathons (hackathon_id, title, description, start_date, end_date, location, max_team_size, registration_deadline, status, prize_pool, domain) VALUES
(1, 'Inter-College TechFest Hackathon 2026', 'A 48-hour national hackathon focused on solving real-world challenges in healthcare, education, and finance.', '2026-08-15', '2026-08-17', 'BITS Pilani Campus', 4, '2026-08-01 23:59:59', 'Published', '₹1,00,000', 'Web Development'),
(2, 'Global Smart City Hackathon 2026', 'Build smart infrastructure and energy-efficient solutions for next-generation green cities.', '2026-09-10', '2026-09-12', 'Online', 3, '2026-09-01 18:00:00', 'Published', '₹50,000', 'IoT / Smart City');

-- Assign manager to hackathon 1
INSERT INTO Hackathon_Managers (hackathon_id, user_id, status) VALUES (1, 2, 'Active');

-- Teams
INSERT INTO Teams (team_id, hackathon_id, leader_id, team_name, team_size, college, project_domain, status) VALUES
(1, 1, 4, 'Demo Cyber Knights', 3, 'IIT Bombay', 'Web Development', 'Closed');

-- Team members
INSERT INTO Team_Members (team_id, user_id, role, branch, year, enrollment_no) VALUES
(1, 4, 'Leader', 'Computer Science', 3, 'IIT2023001'),
(1, 5, 'ML Engineer', 'Information Technology', 3, 'IIT2023002'),
(1, 6, 'Frontend Developer', 'Electronics', 4, 'BITS2022003');

-- Registration
INSERT INTO Registrations (team_id, hackathon_id, status) VALUES (1, 1, 'Approved');

-- Submission
INSERT INTO Submissions (team_id, hackathon_id, project_title, description, github_url, problem_statement, solution) VALUES
(1, 1, 'SmartHealth AI Dashboard', 'An AI-powered health monitoring dashboard for rural clinics using React and MySQL.', 'https://github.com/demoteam/smarthealthai', 'Rural clinics lack real-time patient monitoring tools.', 'We built an AI dashboard that tracks vitals, flags anomalies, and sends alerts to doctors in real time.');

-- Judge assignment
INSERT INTO Judge_Assignments (judge_id, hackathon_id, team_id, assigned_by, status) VALUES (1, 1, 1, 2, 'Active');

-- Evaluation
INSERT INTO Evaluations (judge_id, submission_id, innovation, technical_complexity, ui_ux, database_design, presentation, documentation, marks, feedback) VALUES
(1, 1, 18, 17, 13, 14, 13, 12, 87, 'Excellent project! Great use of database views and real-time data.');

-- Notifications
INSERT INTO Notifications (user_id, message, is_read) VALUES
(4, 'Welcome to Hackathon Portal! Your team registration has been approved.', FALSE),
(3, 'You have been assigned to evaluate team "Demo Cyber Knights".', FALSE);

-- Announcements
INSERT INTO Announcements (title, description, created_by) VALUES
('TechFest 2026 Registration Open!', 'Registration is now live for BITS Pilani TechFest hackathon. Submit your teams before August 1st.', 1),
('Platform Maintenance', 'The hackathon portal will be offline for maintenance on July 5th from 2:00 AM to 4:00 AM.', 1);
