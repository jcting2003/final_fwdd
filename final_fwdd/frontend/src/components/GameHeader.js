// frontend/src/components/GameHeader.js

import React from 'react';

/**
 * Header component showing the game ID, status, and player count.
 * @param {{ gameId: string, status: string, playerCount: number }} props
 */
export default function GameHeader({ gameId, status, playerCount }) {
  const getStatusColor = (s) => {
    switch (s) {
      case 'active':
        return 'bg-green-400';
      case 'lobby':
        return 'bg-yellow-400';
      case 'ended':
        return 'bg-red-400';
      default:
        return 'bg-gray-400';
    }
  };

  const getStatusText = (s) => {
    switch (s) {
      case 'active':
        return 'Game Active';
      case 'lobby':
        return 'Waiting to Start';
      case 'ended':
        return 'Game Ended';
      default:
        return 'Loading...';
    }
  };

  return (
    <div className="bg-gradient-to-r from-gray-800 to-blue-900 text-white p-6 text-center">
      <div className="text-xl font-bold mb-2">
        Game ID: {gameId}
      </div>
      <div className="text-sm opacity-90 flex items-center justify-center">
        <div
          className={`w-2 h-2 rounded-full mr-2 ${getStatusColor(status)}`}
        />
        {getStatusText(status)}
        {playerCount > 0 && (
          <span className="ml-2">• {playerCount} Players Connected</span>
        )}
      </div>
    </div>
  );
}
