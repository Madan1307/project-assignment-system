-- Project Assignment System — Triggers
-- Run after schema.sql

USE project_assignment_db;

DELIMITER $$

-- Trigger 1: Auto-assign matching users when a project is created
CREATE TRIGGER auto_assign_on_project
AFTER INSERT ON projects
FOR EACH ROW
BEGIN
    INSERT INTO assignments (project_id, user_id)
    SELECT NEW.project_id, user_id
    FROM users
    WHERE specialisation = NEW.required_specialisation
      AND role = 'user';

    UPDATE projects
    SET status = 'ongoing'
    WHERE project_id = NEW.project_id;
END$$

-- Trigger 2: Mark task as submitted when a submission is inserted
CREATE TRIGGER mark_task_submitted
AFTER INSERT ON submissions
FOR EACH ROW
BEGIN
    UPDATE tasks
    SET status = 'submitted'
    WHERE task_id = NEW.task_id;
END$$

-- Trigger 3: Auto-close project when all its tasks are scored
CREATE TRIGGER auto_complete_project
AFTER UPDATE ON tasks
FOR EACH ROW
BEGIN
    DECLARE remaining INT;

    SELECT COUNT(*) INTO remaining
    FROM tasks
    WHERE project_id = NEW.project_id
      AND status != 'scored';

    IF remaining = 0 THEN
        UPDATE projects
        SET status = 'completed'
        WHERE project_id = NEW.project_id;
    END IF;
END$$

DELIMITER ;
