-- Hackathon Registration & Team Formation Portal
-- Database Stored Procedures with Transactions

USE hackathon_portal;

DELIMITER $$

-- Procedure 1: Register a new team and add leader as first member in a transaction
DROP PROCEDURE IF EXISTS RegisterTeam$$
CREATE PROCEDURE RegisterTeam(
    IN p_hackathon_id INT,
    IN p_leader_id INT,
    IN p_team_name VARCHAR(100),
    OUT p_team_id INT
)
BEGIN
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        -- Rollback on error
        ROLLBACK;
        RESIGNAL;
    END;

    -- Start Transaction
    START TRANSACTION;
    
    -- Insert new team record (Trigger after_team_member_insert will adjust team_size later, initially set size to 0 and let members insert trigger update it)
    INSERT INTO Teams (hackathon_id, leader_id, team_name, team_size, status)
    VALUES (p_hackathon_id, p_leader_id, p_team_name, 0, 'Open');
    
    -- Fetch the generated team_id
    SET p_team_id = LAST_INSERT_ID();
    
    -- Add team leader as first member
    INSERT INTO Team_Members (team_id, user_id, role)
    VALUES (p_team_id, p_leader_id, 'Leader');
    
    -- Commit Transaction
    COMMIT;
END$$

-- Procedure 2: Accept a team invitation and join team in a transaction
DROP PROCEDURE IF EXISTS AcceptInvitation$$
CREATE PROCEDURE AcceptInvitation(
    IN p_invitation_id INT,
    IN p_user_id INT
)
BEGIN
    DECLARE v_team_id INT;
    DECLARE v_team_name VARCHAR(100);
    DECLARE v_max_size INT;
    DECLARE v_current_size INT;
    DECLARE v_team_status VARCHAR(20);
    
    -- Exit handler for rollback
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        RESIGNAL;
    END;

    -- Start Transaction
    START TRANSACTION;
    
    -- Fetch invitation details and lock for update
    SELECT team_id INTO v_team_id 
    FROM Invitations 
    WHERE invitation_id = p_invitation_id AND receiver_id = p_user_id AND status = 'Pending'
    FOR UPDATE;
    
    IF v_team_id IS NULL THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Invalid, completed, or unauthorized invitation.';
    END IF;
    
    -- Fetch current team details
    SELECT team_name, team_size, status INTO v_team_name, v_current_size, v_team_status
    FROM Teams
    WHERE team_id = v_team_id
    FOR UPDATE;
    
    -- Fetch hackathon limits
    SELECT h.max_team_size INTO v_max_size
    FROM Teams t
    JOIN Hackathons h ON t.hackathon_id = h.hackathon_id
    WHERE t.team_id = v_team_id;
    
    -- Validate team state
    IF v_team_status = 'Closed' OR v_current_size >= v_max_size THEN
        -- Mark invitation as rejected since team is full
        UPDATE Invitations SET status = 'Rejected' WHERE invitation_id = p_invitation_id;
        COMMIT;
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Team is already full or closed.';
    END IF;
    
    -- Check if user is already in another team for the same hackathon
    -- (A user can only be in one team per hackathon)
    IF EXISTS (
        SELECT 1 
        FROM Team_Members tm
        JOIN Teams t ON tm.team_id = t.team_id
        WHERE tm.user_id = p_user_id 
          AND t.hackathon_id = (SELECT hackathon_id FROM Teams WHERE team_id = v_team_id)
    ) THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'You are already a member of a team in this hackathon.';
    END IF;
    
    -- Update Invitation status to Accepted
    UPDATE Invitations 
    SET status = 'Accepted' 
    WHERE invitation_id = p_invitation_id;
    
    -- Add user to Team Members
    INSERT INTO Team_Members (team_id, user_id, role)
    VALUES (v_team_id, p_user_id, 'Developer');
    
    -- Commit transaction
    COMMIT;
END$$

-- Procedure 3: Submit final registration for a team and close the team
DROP PROCEDURE IF EXISTS SubmitRegistration$$
CREATE PROCEDURE SubmitRegistration(
    IN p_team_id INT,
    IN p_hackathon_id INT
)
BEGIN
    DECLARE v_deadline DATETIME;
    DECLARE v_status VARCHAR(20);
    
    -- Exit handler for rollback
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        RESIGNAL;
    END;

    -- Start Transaction
    START TRANSACTION;
    
    -- Validate Hackathon deadline
    SELECT registration_deadline INTO v_deadline
    FROM Hackathons
    WHERE hackathon_id = p_hackathon_id
    FOR SHARE;
    
    IF NOW() > v_deadline THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Registration deadline has passed.';
    END IF;
    
    -- Check if team has already submitted a registration
    IF EXISTS (SELECT 1 FROM Registrations WHERE team_id = p_team_id) THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Team has already submitted registration.';
    END IF;
    
    -- Insert registration
    INSERT INTO Registrations (team_id, hackathon_id, status)
    VALUES (p_team_id, p_hackathon_id, 'Pending');
    
    -- Close team so no other members can join/leave
    UPDATE Teams
    SET status = 'Closed'
    WHERE team_id = p_team_id;
    
    -- Commit
    COMMIT;
END$$

DELIMITER ;
