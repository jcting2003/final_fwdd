// backend/routes/gameRoutes.js

const express = require('express');
const db      = require('../models/db');
const { v4: uuidv4 } = require('uuid');
const authenticateMiddleware = require('../middleware/authenticateMiddleware');

const router = express.Router();

// Create new game (host only)
router.post('/games', authenticateMiddleware, async (req, res) => {
  const host_id = req.user.username;
  if (!host_id) {
    return res.status(400).json({ error: 'Host ID is required' });
  }
  try {
    const gameId = uuidv4();
    await db.query(
      'INSERT INTO games (id, host_id, status) VALUES (?, ?, ?)',
      [gameId, host_id, 'lobby']
    );
    // Add host as first session
    await db.query(
      'INSERT INTO game_sessions (game_id, username, credits, available_credits, current_tile) VALUES (?, ?, 50, 50, 0)',
      [gameId, host_id]
    );
    req.session.currentGame = gameId;
    await req.session.save();

    res.status(201).json({ gameId });
  } catch (err) {
    console.error('Error creating game:', err);
    res.status(500).json({ error: 'Failed to create game' });
  }
});

// Join an existing game
router.post('/games/:gameId/join', authenticateMiddleware, async (req, res) => {
  const { gameId } = req.params;
  const username = req.user.username;
  try {
    // Check game exists and not ended
    const [rows] = await db.query('SELECT status FROM games WHERE id = ?', [gameId]);
    if (!rows.length) return res.status(404).json({ error: 'Game not found' });
    if (rows[0].status === 'ended') return res.status(400).json({ error: 'Game has ended' });

    const [existing] = await db.query(
      'SELECT 1 FROM game_sessions WHERE game_id = ? AND username = ?',
      [gameId, username]
    );
    if (existing.length) {
      return res
        .status(400)
        .json({ error: 'You have already joined this game' });
    }
    // Add to session (ignore duplicates)
    await db.query(
      `INSERT IGNORE INTO game_sessions 
         (game_id, username, credits, available_credits, current_tile)
       VALUES (?, ?, 50, 50, 0)`,
      [gameId, username]
    );

    req.session.currentGame = gameId;
    await req.session.save();

    res.status(201).json({ message: 'Joined game successfully' });
  } catch (err) {
    console.error('Error joining game:', err);
    res.status(500).json({ error: 'Failed to join game' });
  }
});

// Get game info
router.get('/games/:gameId', authenticateMiddleware, async (req, res) => {
  const { gameId } = req.params;
  try {
    const [rows] = await db.query(
      'SELECT id AS gameId, host_id AS hostId, status FROM games WHERE id = ?',
      [gameId]
    );
    if (!rows.length) return res.status(404).json({ error: 'Game not found' });
    res.json(rows[0]);
  } catch (err) {
    console.error('Error fetching game info:', err);
    res.status(500).json({ error: 'Failed to get game info' });
  }
});

// Get current players & leaderboard
router.get('/games/:gameId/leaderboard', authenticateMiddleware, async (req, res) => {
  const { gameId } = req.params;
  try {
    const [players] = await db.query(
      `SELECT username, credits, available_credits, current_tile 
       FROM game_sessions
       WHERE game_id = ?
       ORDER BY credits DESC, current_tile DESC`,
      [gameId]
    );
    res.json({ players });
  } catch (err) {
    console.error('Error fetching leaderboard:', err);
    res.status(500).json({ error: 'Failed to fetch leaderboard' });
  }
});

// Start the game (host only)
router.post(
    '/games/:gameId/start',
    authenticateMiddleware,
    async (req, res) => {
      const { gameId } = req.params;
      const username = req.user.username; // set by authenticateMiddleware
  
      try {
        // 1) Fetch the game record to verify host and status
        const [rows] = await db.query(
          'SELECT host_id, status FROM games WHERE id = ?',
          [gameId]
        );
        if (!rows.length) {
          return res.status(404).json({ error: 'Game not found' });
        }
        const game = rows[0];
  
        // 2) Ensure only the host can start
        if (game.host_id !== username) {
          return res.status(403).json({ error: 'Only the host can start the game' });
        }
  
        // 3) Ensure it's in the 'lobby' state
        if (game.status !== 'lobby') {
          return res
            .status(400)
            .json({ error: `Cannot start a game in '${game.status}' state` });
        }
  
        // 4) Update the status to 'active'
        const [result] = await db.query(
          'UPDATE games SET status = ? WHERE id = ?',
          ['active', gameId]
        );
        if (result.affectedRows === 0) {
          return res.status(500).json({ error: 'Failed to start game' });
        }
  
        // 5) Emit the startGame event to all clients in the room
        const io = req.app.get('io');
        io.to(gameId).emit('startGame', { gameId });
        io.to(gameId).emit('gameStatusChanged', 'active');
  
        console.log(`Game ${gameId} started by host ${username}`);
        return res.json({ message: 'Game started successfully' });
      } catch (err) {
        console.error('Error starting game:', err);
        return res.status(500).json({ error: 'Server error starting game' });
      }
    }
  );

// End the game
router.post('/games/:gameId/end', authenticateMiddleware, async (req, res) => {
  const { gameId } = req.params;
  try {
    const [result] = await db.query('UPDATE games SET status = ? WHERE id = ?', ['ended', gameId]);
    if (!result.affectedRows) return res.status(404).json({ error: 'Game not found or not updated' });

    const io = req.app.get('io');
    io.to(gameId).emit('gameStatusChanged', 'ended');

    res.json({ message: 'Game ended' });
  } catch (err) {
    console.error('Error ending game:', err);
    res.status(500).json({ error: 'Failed to end game' });
  }
});

// Tile questions routes
router.get('/games/:gameId/tile/:tileId/questions', authenticateMiddleware, async (req, res) => {
  const { tileId } = req.params;
  try {
    const [qs] = await db.query(
      `SELECT id, difficulty, question_text, options, credits 
       FROM questions 
       WHERE tile_id = ?`,
      [tileId]
    );
    const formatted = qs.map(q => ({
      id: q.id,
      difficulty: q.difficulty,
      question_text: q.question_text,
      options: JSON.parse(q.options),
      credits: q.credits
    }));
    res.json({ questions: formatted });
  } catch (err) {
    console.error('Error fetching questions:', err);
    res.status(500).json({ error: 'Failed to fetch questions' });
  }
});

router.get('/games/:gameId/tile/:tileId/answered', authenticateMiddleware, async (req, res) => {
  const { gameId, tileId } = req.params;
  try {
    const [rows] = await db.query(
      'SELECT difficulty FROM answered_questions WHERE game_id = ? AND tile_id = ?',
      [gameId, tileId]
    );
    res.json({ answered: rows.map(r => r.difficulty) });
  } catch (err) {
    console.error('Error fetching answered:', err);
    res.status(500).json({ error: 'Failed to fetch answered' });
  }
});

router.post('/games/:gameId/tile/:tileId/answer', authenticateMiddleware, async (req, res) => {
  const { gameId, tileId } = req.params;
  const { difficulty, selected_answer } = req.body;
  const username = req.user.username;
  try {
    const [[q]] = await db.query(
      `SELECT correct_answer, credits 
       FROM questions 
       WHERE tile_id = ? AND difficulty = ?`,
      [tileId, difficulty]
    );
    if (!q) return res.status(404).json({ error: 'Question not found' });

    const isCorrect = selected_answer === q.correct_answer;
    if (isCorrect) {
      await db.query(
        `INSERT IGNORE INTO answered_questions 
           (game_id, tile_id, difficulty, answered_by)
         VALUES (?, ?, ?, ?)`,
        [gameId, tileId, difficulty, username]
      );
      await db.query(
        `UPDATE game_sessions 
           SET credits = credits + ?, available_credits = available_credits + ?
         WHERE game_id = ? AND username = ?`,
        [q.credits, q.credits, gameId, username]
      );
    }

    const io = req.app.get('io');
    io.to(gameId).emit('difficultyLocked', { tileId, difficulty });
    io.to(gameId).emit('leaderboardUpdated');

    res.json({ correct: isCorrect, creditsEarned: isCorrect ? q.credits : 0 });
  } catch (err) {
    console.error('Error processing answer:', err);
    res.status(500).json({ error: 'Failed to process answer' });
  }
});

// Credit management
router.post('/games/:gameId/add-credits', authenticateMiddleware, async (req, res) => {
  const { gameId } = req.params;
  const { username, amount } = req.body;
  try {
    await db.query(
      `UPDATE game_sessions 
         SET credits = credits + ?, available_credits = available_credits + ?
       WHERE game_id = ? AND username = ?`,
      [amount, amount, gameId, username]
    );
    req.app.get('io').emit('leaderboardUpdated', { gameId });
    res.json({ message: 'Credits added' });
  } catch (err) {
    console.error('Error adding credits:', err);
    res.status(500).json({ error: 'Failed to add credits' });
  }
});

router.post('/games/:gameId/deduct-credits', authenticateMiddleware, async (req, res) => {
  const { gameId } = req.params;
  const { username, amount } = req.body;
  try {
    await db.query(
      `UPDATE game_sessions 
         SET available_credits = GREATEST(available_credits - ?, 0)
       WHERE game_id = ? AND username = ?`,
      [amount, gameId, username]
    );
    req.app.get('io').emit('leaderboardUpdated', { gameId });
    res.json({ message: 'Credits deducted' });
  } catch (err) {
    console.error('Error deducting credits:', err);
    res.status(500).json({ error: 'Failed to deduct credits' });
  }
});

module.exports = router;
