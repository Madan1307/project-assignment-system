const express = require('express');
const db      = require('../db');

const router = express.Router();

// GET /api/user/projects — projects + tasks + scores for logged-in user
router.get('/projects', async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT * FROM user_project_view WHERE user_id = ? ORDER BY project_id DESC',
      [req.session.userId]
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch projects' });
  }
});

// GET /api/user/tasks/:id — single task detail
router.get('/tasks/:id', async (req, res) => {
  const taskId = req.params.id;

  try {
    const [rows] = await db.query(
      `SELECT t.task_id, t.title, t.description, t.status,
              p.project_id, p.title AS project_title,
              s.submission_id, s.content AS submitted_work, s.score, s.submitted_at
       FROM tasks t
       JOIN projects p ON t.project_id = p.project_id
       LEFT JOIN submissions s ON s.task_id = t.task_id AND s.user_id = ?
       WHERE t.task_id = ? AND t.assigned_to = ?`,
      [req.session.userId, taskId, req.session.userId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Task not found or not assigned to you' });
    }

    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch task' });
  }
});

// POST /api/user/tasks/:id/submit — submit work for a task
router.post('/tasks/:id/submit', async (req, res) => {
  const taskId = req.params.id;
  const { content } = req.body;

  if (!content || !content.trim()) {
    return res.status(400).json({ error: 'Submission content cannot be empty' });
  }

  try {
    // Verify task belongs to this user
    const [tasks] = await db.query(
      'SELECT task_id, status FROM tasks WHERE task_id = ? AND assigned_to = ?',
      [taskId, req.session.userId]
    );

    if (tasks.length === 0) {
      return res.status(404).json({ error: 'Task not found or not assigned to you' });
    }

    if (tasks[0].status === 'scored') {
      return res.status(400).json({ error: 'Task has already been scored' });
    }

    // Check for existing submission
    const [existing] = await db.query(
      'SELECT submission_id FROM submissions WHERE task_id = ? AND user_id = ?',
      [taskId, req.session.userId]
    );

    if (existing.length > 0) {
      // Update existing submission
      await db.query(
        'UPDATE submissions SET content = ?, submitted_at = NOW() WHERE submission_id = ?',
        [content, existing[0].submission_id]
      );
    } else {
      // Insert new submission
      await db.query(
        'INSERT INTO submissions (task_id, user_id, content) VALUES (?, ?, ?)',
        [taskId, req.session.userId, content]
      );
    }

    // Always update task status to submitted
    await db.query(
      "UPDATE tasks SET status = 'submitted' WHERE task_id = ?",
      [taskId]
    );

    res.status(201).json({ message: 'Work submitted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to submit work' });
  }
});

module.exports = router;
