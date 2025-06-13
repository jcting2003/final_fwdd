// frontend/src/components/MainPage.js

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import gameAPI from '../services/gameAPI';

export default function MainPage() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [gameIdInput, setGameIdInput] = useState('');
  const [error, setError] = useState(null);

  const username = user?.username;

  const handleJoinGameById = () => {
    if (!gameIdInput.trim()) {
      setError('Please enter a game ID');
      return;
    }
    setError(null);
    navigate(`/join?game=${gameIdInput.trim()}`);
  };

  const handleStartNewGame = async () => {
    try {
      // Using your gameAPI service
      const response = await gameAPI.createGame({ host_id: username });
      const newGameId = response.gameId;
      navigate(`/lobby/${newGameId}`);
    } catch (err) {
      console.error('Failed to create game', err);
      alert('Could not start a new game. Please try again.');
    }
  };



  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Pythonopoly Game Hub</h1>

        
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Game Center */}
        <div className="md:col-span-2 bg-white rounded-2xl shadow-md p-6 text-black">
          <h2 className="text-xl font-bold mb-4">Game Center</h2>
          <p className="mb-6">
            Welcome to Pythonopoly, the educational board game to master Python programming!
          </p>

          <div className="space-y-6">
            {/* Host a New Game */}
            <div className="p-4 bg-blue-50 rounded-lg">
              <h3 className="font-semibold mb-2">🎮 Host a New Game</h3>
              <p className="text-sm text-gray-600 mb-3">
                Create and customize your own game session
              </p>
              <button
                className="btn btn-primary w-full md:w-auto"
                onClick={handleStartNewGame}
              >
                Start New Game
              </button>
            </div>

            {/* Join by Game ID */}
            <div className="p-4 bg-green-50 rounded-lg">
              <h3 className="font-semibold mb-2">🚪 Join Existing Game</h3>
              <p className="text-sm text-gray-600 mb-3">
                Enter a game ID to join an active session
              </p>

              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="text"
                  placeholder="Enter Game ID"
                  value={gameIdInput}
                  onChange={(e) => setGameIdInput(e.target.value.toLowerCase())}
                  className="flex-1 border border-gray-300 rounded p-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') handleJoinGameById();
                  }}
                />
                <button
                  onClick={handleJoinGameById}
                  className="btn btn-success px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                >
                  Join Game
                </button>
              </div>
              {error && <div className="mt-2 text-red-600 text-sm">{error}</div>}
            </div>
          </div>
        </div>

        {/* Stats/Profile Panel */}
        <div className="bg-white rounded-2xl shadow-md p-4 text-black">
          <div className="mt-4 p-3 bg-yellow-50 rounded border border-yellow-200">
            <h4 className="font-semibold text-yellow-800 mb-1">💡 Quick Tip</h4>
            <p className="text-sm text-yellow-700">
              Ask friends for their game ID to join their sessions!
            </p>
          </div>
        </div>
      </div>

      {/* News Section */}
      <div className="mt-6 p-6 bg-white rounded-2xl shadow-md text-black">
        <h2 className="text-xl font-bold mb-4">📰 Latest News</h2>
        <div className="space-y-4">
          <div className="border-l-4 border-blue-500 pl-4">
            <p className="font-semibold">🚀 New Power-Ups Available!</p>
            <p className="text-gray-600">Check out our new collection of power-ups to boost your gameplay.</p>
          </div>
          <div className="border-l-4 border-purple-500 pl-4">
            <p className="font-semibold">🔧 System Update:</p>
            <p className="text-gray-600">New question categories and improved matchmaking system now live!</p>
          </div>
          <div className="border-l-4 border-orange-500 pl-4">
            <p className="font-semibold">👥 Community:</p>
            <p className="text-gray-600">Join our Discord server to find players and share game IDs!</p>
          </div>
        </div>
      </div>
    </div>
);
}
