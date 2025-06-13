// frontend/src/pages/JoinGame.js

import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../../frontend/src/context/AuthContext';
import gameAPI from '../../../frontend/src/services/gameAPI';
import socket from '../../../frontend/src/utils/socket';

export default function JoinGame() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  // Read ?game=ID from URL
  const searchParams = new URLSearchParams(location.search);
  const gameId = searchParams.get('game');

  // Prefill username if logged in
  const [username, setUsername] = useState(user?.username || '');
  const [error, setError]       = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    gameAPI.getCurrentUser()
      .then(data => console.log('Current user from API:', data))
      .catch(err => console.error('No session:', err));
  }, []);
  
  const handleJoin = async () => {
    if (!username.trim()) {
      setError('Username is required');
      return;
    }
    setError('');
    try {
      // Call backend to join
      await gameAPI.joinGame(gameId, { username: username.trim() });

      // Notify via socket (session-backed user)
      socket.emit('joinGame', gameId);

      setSuccessMsg('Successfully joined! Redirecting...');
      setTimeout(() => {
        navigate(`/lobby/${gameId}`);
      }, 1000);
    } catch (err) {
      console.error('Join error:', err);
      if (err.message.includes('401')) {
        navigate('/login', { state: { from: location.pathname + location.search } });
      } else {
        setError(err.message || 'Failed to join game');
      }
    }
  };

  return (
    <div className="max-w-md mx-auto mt-12 p-6 bg-white rounded-xl shadow-md">
      <h2 className="text-2xl font-bold mb-4 text-center">Join Game</h2>
      <p className="mb-4 text-center text-gray-500">
        Game ID: <span className="font-mono">{gameId}</span>
      </p>

      <input
        type="text"
        placeholder="Enter your username"
        className="w-full p-2 border rounded mb-4"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
      />

      {error && <div className="text-red-500 mb-2">{error}</div>}
      {successMsg && <div className="text-green-600 mb-2">{successMsg}</div>}

      <button
        className="w-full bg-blue-600 text-white p-2 rounded hover:bg-blue-700"
        onClick={handleJoin}
      >
        Join Game
      </button>
    </div>
  );
}
