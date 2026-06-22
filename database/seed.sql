-- Hackathon Registration & Team Formation Portal
-- Sample Data Seeding Script
-- Note: Student passwords are bcrypt hashes of "password123"

USE hackathon_portal;

-- Disable triggers and foreign keys temporarily
SET @DISABLE_TRIGGERS = 1;
SET FOREIGN_KEY_CHECKS = 0;

TRUNCATE TABLE Registration_Logs;
TRUNCATE TABLE Registrations;
TRUNCATE TABLE Invitations;
TRUNCATE TABLE Team_Members;
TRUNCATE TABLE Teams;
TRUNCATE TABLE Student_Interests;
TRUNCATE TABLE Student_Skills;
TRUNCATE TABLE Student_Profiles;
TRUNCATE TABLE Announcements;
TRUNCATE TABLE Notifications;
TRUNCATE TABLE Hackathons;
TRUNCATE TABLE Users;

SET FOREIGN_KEY_CHECKS = 1;
SET @DISABLE_TRIGGERS = NULL;

-- 1. Insert Users (Password is bcrypt hash for 'password123')
-- Admin
INSERT INTO Users (user_id, name, email, password, college, branch, year, role) VALUES
(1, 'Admin User', 'admin@hackportal.com', '$2b$10$WpZ6G9b.M.iK51Wf6/T2r.N5s/J3y5DqD5aT3uTfHwDk1N4rS3j6m', 'System Admin College', 'CSE', 4, 'Admin');

-- Students
INSERT INTO Users (user_id, name, email, password, college, branch, year, role) VALUES
(2, 'Aditya Sharma', 'aditya@gmail.com', '$2b$10$WpZ6G9b.M.iK51Wf6/T2r.N5s/J3y5DqD5aT3uTfHwDk1N4rS3j6m', 'IIT Bombay', 'Computer Science', 3, 'Student'),
(3, 'Rohan Verma', 'rohan@gmail.com', '$2b$10$WpZ6G9b.M.iK51Wf6/T2r.N5s/J3y5DqD5aT3uTfHwDk1N4rS3j6m', 'IIT Bombay', 'Information Technology', 3, 'Student'),
(4, 'Sneha Reddy', 'sneha@gmail.com', '$2b$10$WpZ6G9b.M.iK51Wf6/T2r.N5s/J3y5DqD5aT3uTfHwDk1N4rS3j6m', 'BITS Pilani', 'Electronics', 4, 'Student'),
(5, 'Vikram Singh', 'vikram@gmail.com', '$2b$10$WpZ6G9b.M.iK51Wf6/T2r.N5s/J3y5DqD5aT3uTfHwDk1N4rS3j6m', 'Delhi Technological University', 'Software Engineering', 2, 'Student'),
(6, 'Priya Nair', 'priya@gmail.com', '$2b$10$WpZ6G9b.M.iK51Wf6/T2r.N5s/J3y5DqD5aT3uTfHwDk1N4rS3j6m', 'DTU', 'Computer Science', 2, 'Student'),
(7, 'Neha Gupta', 'neha@gmail.com', '$2b$10$WpZ6G9b.M.iK51Wf6/T2r.N5s/J3y5DqD5aT3uTfHwDk1N4rS3j6m', 'BITS Pilani', 'Information Systems', 4, 'Student');

-- 2. Insert Student Profiles
INSERT INTO Student_Profiles (profile_id, user_id, github_url, linkedin_url, resume_path, bio) VALUES
(1, 2, 'https://github.com/adityasharma', 'https://linkedin.com/in/adityasharma', '', 'Full stack developer passionate about React and Node.js. Looking for hackathon partners!'),
(2, 3, 'https://github.com/rohanverma', 'https://linkedin.com/in/rohanverma', '', 'Data Scientist and Python programmer. Experienced with Pandas, NumPy, and TensorFlow.'),
(3, 4, 'https://github.com/snehareddy', 'https://linkedin.com/in/snehareddy', '', 'UI/UX Designer and frontend enthusiast. Loves styling apps with CSS and Figma.'),
(4, 5, 'https://github.com/vikramsingh', 'https://linkedin.com/in/vikramsingh', '', 'Backend engineer focusing on MySQL, Express, and distributed databases.'),
(5, 6, 'https://github.com/priyanair', 'https://linkedin.com/in/priyanair', '', 'Android & Flutter Developer. Interested in building mobile applications.'),
(6, 7, 'https://github.com/nehagupta', 'https://linkedin.com/in/nehagupta', '', 'Blockchain developer and Solidity coder. Smart contracts and web3 geek.');

-- 3. Insert Student Skills
INSERT INTO Student_Skills (user_id, skill) VALUES
(2, 'React'), (2, 'Node.js'), (2, 'JavaScript'), (2, 'HTML/CSS'),
(3, 'Python'), (3, 'Data Science'), (3, 'TensorFlow'),
(4, 'Figma'), (4, 'UI/UX'), (4, 'Tailwind CSS'), (4, 'React'),
(5, 'Node.js'), (5, 'Express'), (5, 'MySQL'), (5, 'Java'),
(6, 'Flutter'), (6, 'Dart'), (6, 'Mobile Dev'),
(7, 'Solidity'), (7, 'Smart Contracts'), (7, 'Ethereum');

-- 4. Insert Student Interests
INSERT INTO Student_Interests (user_id, interest) VALUES
(2, 'Web Development'), (2, 'Cloud Computing'),
(3, 'AI/ML'), (3, 'Python scripting'),
(4, 'Web Development'), (4, 'App Development'),
(5, 'DBMS'), (5, 'Backend systems'),
(6, 'App Development'), (6, 'Cyber Security'),
(7, 'Blockchain'), (7, 'Web3');

-- 5. Insert Hackathons
-- One active, one draft, one completed
INSERT INTO Hackathons (hackathon_id, title, description, start_date, end_date, location, max_team_size, registration_deadline, status) VALUES
(1, 'Inter-College TechFest Hackathon 2026', 'A 48-hour national hackathon focused on solving real-world challenges in healthcare, education, and finance using modern technologies.', '2026-08-15', '2026-08-17', 'BITS Pilani campus', 4, '2026-08-01 23:59:59', 'Published'),
(2, 'Global Smart City Hackathon 2026', 'Build smart infrastructure, energy-efficient grids, and web solutions for next-generation green cities.', '2026-09-10', '2026-09-12', 'Online', 3, '2026-09-01 18:00:00', 'Published'),
(3, 'AI Frontiers Hackathon', 'Harness artificial intelligence, LLMs, and computer vision to redefine automation.', '2026-04-10', '2026-04-12', 'IIT Bombay', 4, '2026-04-01 23:59:59', 'Completed'),
(4, 'Future Developers Hackathon', 'Internal hackathon designed for sophomore students to build their first full stack web apps.', '2026-10-01', '2026-10-03', 'Online', 2, '2026-09-25 23:59:59', 'Draft');

-- 6. Insert Teams
-- Note: Since we have triggers to update team_size, we will insert team members after creating teams.
-- Initial team sizes are set to 0, which triggers will auto-update as team_members are inserted.
INSERT INTO Teams (team_id, hackathon_id, leader_id, team_name, team_size, status) VALUES
(1, 1, 2, 'Alpha Coders', 1, 'Open'),
(2, 1, 4, 'Pixel Perfect', 1, 'Open'),
(3, 2, 6, 'App Wizards', 1, 'Open');

-- 7. Insert Team Members
-- Let's add members manually. Inserting members will trigger after_team_member_insert trigger to auto-update sizes.
INSERT INTO Team_Members (team_id, user_id, role) VALUES
(1, 2, 'Leader'),
(1, 3, 'ML Engineer'),
(2, 4, 'Leader'),
(2, 5, 'Backend Developer'),
(3, 6, 'Leader');

-- 8. Insert Invitations
INSERT INTO Invitations (invitation_id, sender_id, receiver_id, team_id, status) VALUES
(1, 2, 5, 1, 'Pending'),
(2, 4, 2, 2, 'Pending'),
(3, 6, 7, 3, 'Pending');

-- 9. Insert Registrations
INSERT INTO Registrations (registration_id, team_id, hackathon_id, status) VALUES
(1, 2, 1, 'Pending');

-- 10. Notifications
INSERT INTO Notifications (user_id, message, is_read) VALUES
(2, 'Welcome to Hackathon Portal! Complete your profile to get matched.', FALSE),
(4, 'Your team Pixel Perfect has a pending registration request.', FALSE),
(6, 'Rohan Verma viewed your profile.', TRUE);

-- 11. Announcements
INSERT INTO Announcements (announcement_id, title, description, created_by) VALUES
(1, 'TechFest 2026 Registration Open!', 'Registration is now live for BITS Pilani TechFest hackathon. Submit your teams before August 1st.', 1),
(2, 'Platform Maintenance', 'The hackathon portal will be offline for maintenance on July 5th from 2:00 AM to 4:00 AM.', 1);
