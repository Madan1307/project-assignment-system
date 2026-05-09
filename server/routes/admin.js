const express = require('express');
const db      = require('../db');

const router = express.Router();

// ── Projects ─────────────────────────────────────────────────────────────────

router.get('/projects', async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT * FROM admin_project_summary
       WHERE project_id IN (
         SELECT project_id FROM projects WHERE admin_id = ?
       )
       ORDER BY project_id DESC`,
      [req.session.userId]
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch projects' });
  }
});

router.post('/projects', async (req, res) => {
  const { title, description, required_specialisation } = req.body;

  if (!title || !required_specialisation) {
    return res.status(400).json({ error: 'Title and required_specialisation are required' });
  }

  try {
    const [result] = await db.query(
      'INSERT INTO projects (title, description, required_specialisation, admin_id, status) VALUES (?, ?, ?, ?, ?)',
      [title, description || null, required_specialisation, req.session.userId, 'ongoing']
    );
    res.status(201).json({ project_id: result.insertId, message: 'Project created' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create project' });
  }
});

router.get('/projects/:id', async (req, res) => {
  const projectId = req.params.id;

  try {
    const [ownership] = await db.query(
      'SELECT project_id, required_specialisation FROM projects WHERE project_id = ? AND admin_id = ?',
      [projectId, req.session.userId]
    );
    if (ownership.length === 0) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const [rows] = await db.query(
      'SELECT * FROM admin_project_detail WHERE project_id = ?',
      [projectId]
    );

    // Users with matching specialisation not yet assigned
    const [availableMembers] = await db.query(
      `SELECT u.user_id, u.name, u.specialisation
       FROM users u
       WHERE u.role = 'user'
         AND u.specialisation = ?
         AND u.user_id NOT IN (SELECT user_id FROM assignments WHERE project_id = ?)`,
      [ownership[0].required_specialisation, projectId]
    );

    // Already assigned members
    const [assignedMembers] = await db.query(
      `SELECT u.user_id, u.name, u.specialisation
       FROM assignments a
       JOIN users u ON a.user_id = u.user_id
       WHERE a.project_id = ?`,
      [projectId]
    );

    res.json({ detail: rows, members: assignedMembers, availableMembers });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch project detail' });
  }
});

// POST /api/admin/projects/:id/members — manually add a member
router.post('/projects/:id/members', async (req, res) => {
  const projectId = req.params.id;
  const { user_id } = req.body;

  if (!user_id) {
    return res.status(400).json({ error: 'user_id is required' });
  }

  try {
    const [ownership] = await db.query(
      'SELECT project_id FROM projects WHERE project_id = ? AND admin_id = ?',
      [projectId, req.session.userId]
    );
    if (ownership.length === 0) {
      return res.status(403).json({ error: 'Access denied' });
    }

    await db.query(
      'INSERT IGNORE INTO assignments (project_id, user_id) VALUES (?, ?)',
      [projectId, user_id]
    );

    res.json({ message: 'Member added to project' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to add member' });
  }
});

// ── Tasks ─────────────────────────────────────────────────────────────────────

router.post('/tasks', async (req, res) => {
  const { project_id, assigned_to, title, description } = req.body;

  if (!project_id || !assigned_to || !title) {
    return res.status(400).json({ error: 'project_id, assigned_to, and title are required' });
  }

  try {
    const [ownership] = await db.query(
      'SELECT project_id FROM projects WHERE project_id = ? AND admin_id = ?',
      [project_id, req.session.userId]
    );
    if (ownership.length === 0) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Auto-assign user to project if not already assigned
    await db.query(
      'INSERT IGNORE INTO assignments (project_id, user_id) VALUES (?, ?)',
      [project_id, assigned_to]
    );

    const [result] = await db.query(
      'INSERT INTO tasks (project_id, assigned_to, title, description) VALUES (?, ?, ?, ?)',
      [project_id, assigned_to, title, description || null]
    );

    res.status(201).json({ task_id: result.insertId, message: 'Task created' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create task' });
  }
});

// ── Scoring ───────────────────────────────────────────────────────────────────

router.patch('/submissions/:id/score', async (req, res) => {
  const submissionId = req.params.id;
  const { score } = req.body;

  if (score === undefined || score === null) {
    return res.status(400).json({ error: 'score is required' });
  }
  if (score < 0 || score > 100) {
    return res.status(400).json({ error: 'score must be between 0 and 100' });
  }

  try {
    const [ownership] = await db.query(
      `SELECT s.submission_id
       FROM submissions s
       JOIN tasks t    ON s.task_id = t.task_id
       JOIN projects p ON t.project_id = p.project_id
       WHERE s.submission_id = ? AND p.admin_id = ?`,
      [submissionId, req.session.userId]
    );
    if (ownership.length === 0) {
      return res.status(403).json({ error: 'Access denied' });
    }

    await db.query('UPDATE submissions SET score = ? WHERE submission_id = ?', [score, submissionId]);

    await db.query(
      `UPDATE tasks SET status = 'scored'
       WHERE task_id = (SELECT task_id FROM submissions WHERE submission_id = ?)`,
      [submissionId]
    );

    res.json({ message: 'Score saved' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to save score' });
  }
});

module.exports = router;
