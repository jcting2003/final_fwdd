// backend/routes/playerRoutes.js
const express = require('express');
const authenticateMiddleware = require('../middleware/authenticateMiddleware');
const router = express.Router();

/**
 * GET /api/player/current-game
 * Returns { gameId } if the user has an active game in their session,
 * or 404 if none.
 */
router.get(
  '/player/current-game',
  authenticateMiddleware,
  (req, res) => {
    const gameId = req.session.currentGame;
    if (!gameId) {
      return res.status(404).json({ error: 'No active game' });
    }
    res.json({ gameId });
  }
);

module.exports = router;
