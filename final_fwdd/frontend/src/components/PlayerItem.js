// frontend/src/components/PlayerItem.js

import React from 'react';

/**
 * Renders a single player entry with rank, name, and credits.
 * @param {{ player: { rank: number, name: string, credits: number }, gameState: string }} props
 */
export default function PlayerItem(props) {
  const { player, gameState } = props;

  const getRankStyle = (rank) => {
    switch (rank) {
      case 1:  return 'border-l-yellow-400 bg-yellow-50';
      case 2:  return 'border-l-gray-400 bg-gray-50';
      case 3:  return 'border-l-orange-400 bg-orange-50';
      default: return 'border-l-blue-400 bg-blue-50';
    }
  };

  const getRankText = (rank) => {
    switch (rank) {
      case 1:  return '🏆 Champion';
      case 2:  return '🥈 Runner-up';
      case 3:  return '🥉 Third Place';
      default: return '⭐ Player';
    }
  };

  const showRank = gameState === 'ended';

  return React.createElement(
    'div',
    {
      className:
        'flex items-center justify-between p-5 rounded-xl border-l-4 shadow-sm ' +
        'transition hover:-translate-y-1 hover:shadow-md ' +
        (showRank
          ? getRankStyle(player.rank)
          : 'border-l-gray-300 bg-gray-100')
    },
    // Left side: rank & name
    React.createElement(
      'div',
      { className: 'flex items-center gap-5' },
      // rank number
      React.createElement(
        'div',
        { className: 'text-xl font-bold text-gray-700 w-10 text-right' },
        showRank ? `#${player.rank}` : '-'
      ),
      // name & rank text
      React.createElement(
        'div',
        null,
        React.createElement(
          'div',
          { className: 'text-lg font-semibold text-gray-800' },
          player.name
        ),
        React.createElement(
          'div',
          { className: 'text-sm text-gray-500' },
          showRank ? getRankText(player.rank) : '⭐ Player'
        )
      )
    ),
    // Right side: credits
    React.createElement(
      'div',
      { className: 'text-right' },
      React.createElement(
        'div',
        { className: 'text-xl font-bold text-green-600' },
        player.credits
      ),
      React.createElement(
        'div',
        { className: 'text-sm text-gray-400' },
        'credits'
      )
    )
  );
}
