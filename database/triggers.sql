-- Hackathon Registration & Team Formation Portal
-- Database Triggers

USE hackathon_portal;

DELIMITER $$

-- Trigger 1: Auto-update team size and close team if full after inserting a member
DROP TRIGGER IF EXISTS after_team_member_insert$$
CREATE TRIGGER after_team_member_insert
AFTER INSERT ON Team_Members
FOR EACH ROW
BEGIN
    DECLARE current_team_size INT;
    DECLARE max_allowed_size INT;
    
    -- Get current team size
    SELECT COUNT(*) INTO current_team_size 
    FROM Team_Members 
    WHERE team_id = NEW.team_id;
    
    -- Get max team size allowed for the hackathon
    SELECT h.max_team_size INTO max_allowed_size
    FROM Teams t
    JOIN Hackathons h ON t.hackathon_id = h.hackathon_id
    WHERE t.team_id = NEW.team_id;
    
    -- Update Teams table
    IF current_team_size >= max_allowed_size THEN
        UPDATE Teams 
        SET team_size = current_team_size, status = 'Closed'
        WHERE team_id = NEW.team_id;
    ELSE
        UPDATE Teams 
        SET team_size = current_team_size, status = 'Open'
        WHERE team_id = NEW.team_id;
    END IF;
END$$

-- Trigger 2: Auto-update team size and re-open team if under limit after deleting a member
DROP TRIGGER IF EXISTS after_team_member_delete$$
CREATE TRIGGER after_team_member_delete
AFTER DELETE ON Team_Members
FOR EACH ROW
BEGIN
    DECLARE current_team_size INT;
    DECLARE max_allowed_size INT;
    
    -- Get current team size
    SELECT COUNT(*) INTO current_team_size 
    FROM Team_Members 
    WHERE team_id = OLD.team_id;
    
    -- Get max team size allowed for the hackathon
    SELECT h.max_team_size INTO max_allowed_size
    FROM Teams t
    JOIN Hackathons h ON t.hackathon_id = h.hackathon_id
    WHERE t.team_id = OLD.team_id;
    
    -- Update Teams table
    IF current_team_size < max_allowed_size THEN
        UPDATE Teams 
        SET team_size = current_team_size, status = 'Open'
        WHERE team_id = OLD.team_id;
    ELSE
        UPDATE Teams 
        SET team_size = current_team_size
        WHERE team_id = OLD.team_id;
    END IF;
END$$

-- Trigger 3: Send notification automatically to recipient after a team invitation is sent
DROP TRIGGER IF EXISTS after_invitation_insert$$
CREATE TRIGGER after_invitation_insert
AFTER INSERT ON Invitations
FOR EACH ROW
BEGIN
    DECLARE sender_name VARCHAR(100);
    DECLARE team_name_val VARCHAR(100);
    
    -- Get sender name
    SELECT name INTO sender_name FROM Users WHERE user_id = NEW.sender_id;
    -- Get team name
    SELECT team_name INTO team_name_val FROM Teams WHERE team_id = NEW.team_id;
    
    -- Insert notification for receiver
    INSERT INTO Notifications (user_id, message)
    VALUES (
        NEW.receiver_id, 
        CONCAT(sender_name, ' has invited you to join team "', team_name_val, '".')
    );
END$$

-- Trigger 4: Log registration status changes (auditing)
DROP TRIGGER IF EXISTS after_registration_status_update$$
CREATE TRIGGER after_registration_status_update
AFTER UPDATE ON Registrations
FOR EACH ROW
BEGIN
    DECLARE team_leader_id INT;
    DECLARE hackathon_title_val VARCHAR(150);
    
    -- Only log and notify if status has actually changed
    IF OLD.status <> NEW.status THEN
        -- Insert into Registration_Logs
        INSERT INTO Registration_Logs (registration_id, old_status, new_status)
        VALUES (NEW.registration_id, OLD.status, NEW.status);
        
        -- Get leader_id of the team
        SELECT leader_id INTO team_leader_id FROM Teams WHERE team_id = NEW.team_id;
        
        -- Get hackathon title
        SELECT title INTO hackathon_title_val FROM Hackathons WHERE hackathon_id = NEW.hackathon_id;
        
        -- Notify team leader about status update
        IF team_leader_id IS NOT NULL THEN
            INSERT INTO Notifications (user_id, message)
            VALUES (
                team_leader_id, 
                CONCAT('Your registration for Hackathon "', hackathon_title_val, '" has been ', LOWER(NEW.status), '.')
            );
        END IF;
    END IF;
END$$

DELIMITER ;
