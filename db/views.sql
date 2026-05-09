-- Project Assignment System — Views
-- Run after triggers.sql

USE project_assignment_db;

-- View 1: Admin dashboard — project overview with task counts
CREATE VIEW admin_project_summary AS
SELECT
    a.name                        AS admin_name,
    p.project_id,
    p.title                       AS project_title,
    p.status,
    p.required_specialisation,
    COUNT(DISTINCT r.user_id)     AS total_members,
    SUM(t.status = 'scored')      AS tasks_scored,
    SUM(t.status = 'submitted')   AS tasks_submitted,
    SUM(t.status = 'pending')     AS tasks_pending
FROM projects p
JOIN users a            ON p.admin_id = a.user_id
LEFT JOIN assignments r ON p.project_id = r.project_id
LEFT JOIN tasks t       ON t.project_id = p.project_id
GROUP BY p.project_id, a.name;

-- View 2: Admin project detail — per-member task + submission + score
CREATE VIEW admin_project_detail AS
SELECT
    p.project_id,
    p.title                  AS project_title,
    p.status                 AS project_status,
    a.name                   AS admin_name,
    u.user_id                AS member_id,
    u.name                   AS member_name,
    u.specialisation,
    t.task_id,
    t.title                  AS task_title,
    t.description            AS task_description,
    t.status                 AS task_status,
    s.submission_id,
    s.content                AS submitted_work,
    s.score,
    s.submitted_at
FROM projects p
JOIN users a              ON p.admin_id = a.user_id
LEFT JOIN assignments r   ON p.project_id = r.project_id
LEFT JOIN users u         ON r.user_id = u.user_id
LEFT JOIN tasks t         ON t.project_id = p.project_id
                         AND t.assigned_to = u.user_id
LEFT JOIN submissions s   ON s.task_id = t.task_id;

-- View 3: User dashboard — assigned projects + admin info + own tasks
CREATE VIEW user_project_view AS
SELECT
    u.user_id,
    u.name                   AS member_name,
    p.project_id,
    p.title                  AS project_title,
    p.status                 AS project_status,
    a.name                   AS admin_name,
    a.email                  AS admin_email,
    t.task_id,
    t.title                  AS task_title,
    t.description            AS task_description,
    t.status                 AS task_status,
    s.submission_id,
    s.content                AS submitted_work,
    s.score,
    s.submitted_at
FROM users u
JOIN assignments r        ON u.user_id = r.user_id
JOIN projects p           ON r.project_id = p.project_id
JOIN users a              ON p.admin_id = a.user_id
LEFT JOIN tasks t         ON t.project_id = p.project_id
                         AND t.assigned_to = u.user_id
LEFT JOIN submissions s   ON s.task_id = t.task_id
WHERE u.role = 'user';
