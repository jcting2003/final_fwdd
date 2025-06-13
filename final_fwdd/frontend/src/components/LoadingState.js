// frontend/src/components/LoadingState.js

import React from 'react';

/**
 * Displays a full-page loading spinner.
 */
export default function LoadingState() {
  return React.createElement(
    'div',
    {
      className:
        'min-h-screen bg-gradient-to-br from-blue-600 via-purple-600 to-blue-800 ' +
        'flex items-center justify-center p-4'
    },
    React.createElement(
      'div',
      { className: 'bg-white rounded-3xl shadow-2xl p-8 text-center' },
      React.createElement('div', {
        className:
          'animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 ' +
          'mx-auto mb-4'
      }),
      React.createElement(
        'p',
        { className: 'text-gray-600' },
        'Loading game data...'
      )
    )
  );
}
