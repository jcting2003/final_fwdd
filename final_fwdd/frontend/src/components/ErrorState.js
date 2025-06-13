// frontend/src/components/ErrorState.js

import React from 'react';

/**
 * Displays a full-page error message with a retry button.
 * @param {{ error: string, onRetry: ()=>void }} props
 */
export default function ErrorState(props) {
  const { error, onRetry } = props;

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
      React.createElement(
        'div',
        { className: 'text-red-500 text-xl mb-4' },
        '⚠️ Error'
      ),
      React.createElement(
        'p',
        { className: 'text-gray-600 mb-4' },
        error
      ),
      React.createElement(
        'button',
        {
          onClick: onRetry,
          className:
            'bg-blue-600 hover:bg-blue-700 text-white font-semibold ' +
            'py-2 px-6 rounded-full transition-colors duration-200'
        },
        'Retry'
      )
    )
  );
}
