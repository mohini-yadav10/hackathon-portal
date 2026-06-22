-- Hackathon Registration & Team Formation Portal
-- Database Schema Design (3NF)

CREATE DATABASE IF NOT EXISTS hackathon_portal;
USE hackathon_portal;

-- Disable foreign key checks temporarily to safely drop existing tables if any
SET FOREIGN_KEY_CHECKS = 0;
DROP TABLE IF EXISTS Registration_Logs;
DROP TABLE IF EXISTS Registrations;
DROP TABLE IF EXISTS Invitations;
DROP TABLE IF EXISTS Team_Members;
DROP TABLE IF EXISTS Teams;
DROP TABLE IF EXISTS Student_Interests;
DROP TABLE IF EXISTS Student_Skills;
DROP TABLE IF EXISTS Student_Profiles;
DROP TABLE IF EXISTS Announcements;
DROP TABLE IF EXISTS Notifications;
DROP TABLE IF EXISTS Hackathons;
DROP TABLE IF EXISTS Users;
SET FOREIGN_KEY_CHECKS = 1;

-- 1. Users Table (Core Auth Entity)
CREATE TABLE Users (
    user_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL, -- Will store bcrypt hashed passwords
    college VARCHAR(150),
    branch VARCHAR(100),
    year INT CHECK (year BETWEEN 1 AND 5),
    role ENUM('Student', 'Admin') NOT NULL DEFAULT 'Student',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index on email for fast authentication searches
CREATE INDEX idx_users_email ON Users(email);

-- 2. Student Profiles Table (1-to-1 with Users)
CREATE TABLE Student_Profiles (
    profile_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL UNIQUE,
    github_url VARCHAR(255),
    linkedin_url VARCHAR(255),
    resume_path VARCHAR(255),
    bio TEXT,
    FOREIGN KEY (user_id) REFERENCES Users(user_id) ON DELETE CASCADE
);

-- 3. Student Skills Table (Normalized 1-to-Many for Skills to achieve 3NF)
CREATE TABLE Student_Skills (
    user_id INT NOT NULL,
    skill VARCHAR(50) NOT NULL,
    PRIMARY KEY (user_id, skill),
    FOREIGN KEY (user_id) REFERENCES Users(user_id) ON DELETE CASCADE
);

-- 4. Student Interests Table (Normalized 1-to-Many for Interests to achieve 3NF)
CREATE TABLE Student_Interests (
    user_id INT NOT NULL,
    interest VARCHAR(50) NOT NULL,
    PRIMARY KEY (user_id, interest),
    FOREIGN KEY (user_id) REFERENCES Users(user_id) ON DELETE CASCADE
);

-- 5. Hackathons Table
CREATE TABLE Hackathons (
    hackathon_id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(150) NOT NULL,
    description TEXT,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    location VARCHAR(100) DEFAULT 'Online',
    max_team_size INT NOT NULL DEFAULT 4 CHECK (max_team_size >= 1),
    registration_deadline DATETIME NOT NULL,
    status ENUM('Draft', 'Published', 'Completed') NOT NULL DEFAULT 'Draft'
);

-- Index on status and registration_deadline for fetching active hackathons efficiently
CREATE INDEX idx_hackathons_status_deadline ON Hackathons(status, registration_deadline);

-- 6. Teams Table
CREATE TABLE Teams (
    team_id INT AUTO_INCREMENT PRIMARY KEY,
    hackathon_id INT NOT NULL,
    leader_id INT,
    team_name VARCHAR(100) NOT NULL,
    team_size INT NOT NULL DEFAULT 1 CHECK (team_size >= 1),
    status ENUM('Open', 'Closed') NOT NULL DEFAULT 'Open',
    FOREIGN KEY (hackathon_id) REFERENCES Hackathons(hackathon_id) ON DELETE CASCADE,
    FOREIGN KEY (leader_id) REFERENCES Users(user_id) ON DELETE SET NULL
);

-- Index on hackathon_id to quickly group teams by hackathon
CREATE INDEX idx_teams_hackathon_id ON Teams(hackathon_id);

-- 7. Team Members Table (Many-to-Many Resolver between Teams and Users)
CREATE TABLE Team_Members (
    member_id INT AUTO_INCREMENT PRIMARY KEY,
    team_id INT NOT NULL,
    user_id INT NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'Developer', -- e.g., 'Frontend', 'Backend', 'Designer'
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (team_id) REFERENCES Teams(team_id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES Users(user_id) ON DELETE CASCADE,
    CONSTRAINT unique_team_member UNIQUE (team_id, user_id)
);

-- 8. Invitations Table (User invites to join Teams)
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

-- Index on receiver_id to query pending invitations for a user quickly
CREATE INDEX idx_invitations_receiver ON Invitations(receiver_id, status);

-- 9. Registrations Table (Final submission)
CREATE TABLE Registrations (
    registration_id INT AUTO_INCREMENT PRIMARY KEY,
    team_id INT NOT NULL UNIQUE, -- 1-to-1 relationship from Team to Registration
    hackathon_id INT NOT NULL,
    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status ENUM('Pending', 'Approved', 'Rejected') NOT NULL DEFAULT 'Pending',
    FOREIGN KEY (team_id) REFERENCES Teams(team_id) ON DELETE CASCADE,
    FOREIGN KEY (hackathon_id) REFERENCES Hackathons(hackathon_id) ON DELETE CASCADE
);

-- 10. Registration Status Update Log Table (for trigger logging)
CREATE TABLE Registration_Logs (
    log_id INT AUTO_INCREMENT PRIMARY KEY,
    registration_id INT NOT NULL,
    old_status VARCHAR(20),
    new_status VARCHAR(20),
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 11. Notifications Table
CREATE TABLE Notifications (
    notification_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES Users(user_id) ON DELETE CASCADE
);

-- Index on user_id and is_read to fetch unread notifications for a user quickly
CREATE INDEX idx_notifications_unread ON Notifications(user_id, is_read);

-- 12. Announcements Table (System wide news from Admin)
CREATE TABLE Announcements (
    announcement_id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(150) NOT NULL,
    description TEXT,
    created_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES Users(user_id) ON DELETE SET NULL
);


-- =========================================================================
-- DATABASE VIEWS
-- =========================================================================

-- View 1: Team Summary View (Comprehensive team info with leader name & hackathon title)
CREATE OR REPLACE VIEW Team_Summary_View AS
SELECT 
    t.team_id,
    t.team_name,
    t.team_size,
    t.status AS team_status,
    h.hackathon_id,
    h.title AS hackathon_title,
    h.max_team_size AS hackathon_max_size,
    u.user_id AS leader_id,
    u.name AS leader_name,
    u.email AS leader_email
FROM Teams t
JOIN Hackathons h ON t.hackathon_id = h.hackathon_id
LEFT JOIN Users u ON t.leader_id = u.user_id;

-- View 2: Registration Summary View (For Admin approval and tracking)
CREATE OR REPLACE VIEW Registration_Summary_View AS
SELECT 
    r.registration_id,
    r.submitted_at,
    r.status AS registration_status,
    t.team_id,
    t.team_name,
    t.team_size,
    h.hackathon_id,
    h.title AS hackathon_title,
    h.start_date AS hackathon_start_date,
    u.name AS leader_name,
    u.email AS leader_email
FROM Registrations r
JOIN Teams t ON r.team_id = t.team_id
JOIN Hackathons h ON r.hackathon_id = h.hackathon_id
LEFT JOIN Users u ON t.leader_id = u.user_id;

-- View 3: Active Hackathon View (Hackathons open for registrations)
CREATE OR REPLACE VIEW Active_Hackathon_View AS
SELECT 
    hackathon_id,
    title,
    description,
    start_date,
    end_date,
    location,
    max_team_size,
    registration_deadline,
    status
FROM Hackathons
WHERE status = 'Published' 
  AND registration_deadline > NOW()
ORDER BY registration_deadline ASC;
