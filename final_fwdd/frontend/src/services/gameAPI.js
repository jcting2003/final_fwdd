// frontend/src/services/gameAPI.js

import { GAME_API_BASE  } from '../config';

class GameAPI {
  constructor() {
    this.baseURL = GAME_API_BASE; // e.g. 'https://192.168.0.8:5000/api'
  }

  // Generic fetch wrapper
  async makeRequest(endpoint, { method = 'GET', body, headers = {} } = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const config = {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      },
      credentials: 'include' // send session cookie
    };
    if (body) config.body = JSON.stringify(body);

    const res = await fetch(url, config);
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || `HTTP ${res.status}`);
    }
    return res.json();
  }

  // Auth endpoints
  login(credentials) {
    return this.makeRequest('/auth/login', {
      method: 'POST',
      body: credentials
    });
  }

  signup(userData) {
    return this.makeRequest('/auth/signup', {
      method: 'POST',
      body: userData
    });
  }

  logout() {
    return this.makeRequest('/auth/logout', { method: 'POST' });
  }

  getCurrentUser() {
    return this.makeRequest('/auth/currentuser');
  }
  
  getCurrentGame() {
    return this.makeRequest('/player/current-game');
  }

  // Game endpoints
  getGameInfo(gameId) {
    return this.makeRequest(`/games/${gameId}`);
  }

  createGame(gameData) {
    return this.makeRequest('/games', {
      method: 'POST',
      body: gameData
    });
  }

  startGame(gameId) {
    return this.makeRequest(`/games/${gameId}/start`, { method: 'POST' });
  }

  endGame(gameId) {
    return this.makeRequest(`/games/${gameId}/end`, { method: 'POST' });
  }

  getLeaderboard(gameId) {
    return this.makeRequest(`/games/${gameId}/leaderboard`);
  }

  // Optional: player join
  joinGame(gameId, playerData) {
    return this.makeRequest(`/games/${gameId}/join`, {
      method: 'POST',
      body: playerData
    });
  }

  // Credit management
  addCredits(gameId, username, amount) {
    return this.makeRequest(`/games/${gameId}/add-credits`, {
      method: 'POST',
      body: { username, amount }
    });
  }

  deductAvailableCredits(gameId, username, amount) {
    return this.makeRequest(`/games/${gameId}/deduct-credits`, {
      method: 'POST',
      body: { username, amount }
    });
  }

  // Tile/question endpoints
  getTileQuestions(gameId, tileId) {
    return this.makeRequest(`/games/${gameId}/tile/${tileId}/questions`);
  }

  submitTileAnswer(gameId, tileId, answerData) {
    return this.makeRequest(`/games/${gameId}/tile/${tileId}/answer`, {
      method: 'POST',
      body: answerData
    });
  }

  getAvailableDifficulties(gameId, tileId, username) {
    return this.makeRequest(
      `/games/${gameId}/tiles/${tileId}/available-difficulties/${username}`
    );
  }

  getAnsweredDifficulties(gameId, tileId) {
    return this.makeRequest(`/games/${gameId}/tile/${tileId}/answered`);
  }
}

export default new GameAPI();
