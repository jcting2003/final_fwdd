// frontend/src/GameContainer.js

import React, { useState, useEffect } from 'react';
import GameHeader from './components/GameHeader';
import LeaderboardView from './components/LeaderboardView';
import QuestionView from './components/QuestionView';
import LoadingState from './components/LoadingState';
import ErrorState from './components/ErrorState';
import gameAPI from './services/gameAPI';
import socket from './utils/socket';
import { useAuth } from './context/AuthContext';

/**
 * Container for the main gameplay screen.
 * @param {{ gameId: string }} props
 */
export default function GameContainer(props) {
  const { gameId } = props;
  const { user, loading: sessionLoading } = useAuth();

  const [gameState, setGameState]     = useState('leaderboard');
  const [players, setPlayers]         = useState([]);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState(null);
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [gameInfo, setGameInfo]       = useState({
    gameId: gameId || '',
    status: 'loading',
    playerCount: 0
  });
  const [activePlayer, setActivePlayer] = useState(null);

  // Fetch players and game info
  useEffect(() => {
    if (!gameId) return;

    const fetchData = async () => {
      setLoading(true);
      try {
        // Players
        const playersData = await gameAPI.getPlayers(gameId);
        const sorted = (playersData.players || [])
          .sort((a, b) => b.credits - a.credits)
          .map((p, i) => ({ ...p, rank: i + 1, isActive: false }));
        // Game info
        const infoData = await gameAPI.getGameInfo(gameId);

        setPlayers(sorted);
        setGameInfo({
          gameId,
          status: infoData.status,
          playerCount: sorted.length
        });
        setError(null);
      } catch (err) {
        console.error('Error fetching initial data:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [gameId]);

  // Socket.IO setup
  useEffect(() => {
    if (!gameId || sessionLoading) return;
    const sc = socket;
    sc.emit('joinGame', gameId);

    const onPlayerJoined = (playerData) => {
      setPlayers(prev => {
        const updated = [...prev, { ...playerData, rank: prev.length + 1, isActive: false }];
        return updated
          .sort((a, b) => b.credits - a.credits)
          .map((p, idx) => ({ ...p, rank: idx + 1 }));
      });
      setGameInfo(prev => ({ ...prev, playerCount: prev.playerCount + 1 }));
    };

    const onPlayerLeft = (username) => {
      setPlayers(prev => {
        const updated = prev.filter(p => p.username !== username);
        return updated
          .sort((a, b) => b.credits - a.credits)
          .map((p, idx) => ({ ...p, rank: idx + 1 }));
      });
      setGameInfo(prev => ({ ...prev, playerCount: prev.playerCount - 1 }));
    };

    const onQuestionStarted = ({ player, question }) => {
      setActivePlayer(player);
      setCurrentQuestion(question);
      setGameState('question');
    };

    const onQuestionCompleted = ({ playerUsername, newCredits }) => {
      setGameState('leaderboard');
      setActivePlayer(null);
      setCurrentQuestion(null);
      setPlayers(prev => {
        const updated = prev.map(p =>
          p.username === playerUsername ? { ...p, credits: newCredits } : p
        );
        return updated
          .sort((a, b) => b.credits - a.credits)
          .map((p, idx) => ({ ...p, rank: idx + 1 }));
      });
    };

    const onCreditsUpdated = ({ playerUsername, credits }) => {
      setPlayers(prev => {
        const updated = prev.map(p =>
          p.username === playerUsername ? { ...p, credits } : p
        );
        return updated
          .sort((a, b) => b.credits - a.credits)
          .map((p, idx) => ({ ...p, rank: idx + 1 }));
      });
    };

    const onGameStatusChanged = (newStatus) => {
      setGameInfo(prev => ({ ...prev, status: newStatus }));
    };

    sc.on('playerJoined', onPlayerJoined);
    sc.on('playerLeft', onPlayerLeft);
    sc.on('questionStarted', onQuestionStarted);
    sc.on('questionCompleted', onQuestionCompleted);
    sc.on('creditsUpdated', onCreditsUpdated);
    sc.on('gameStatusChanged', onGameStatusChanged);

    return () => {
      sc.emit('leaveGame', gameId);
      sc.off('playerJoined', onPlayerJoined);
      sc.off('playerLeft', onPlayerLeft);
      sc.off('questionStarted', onQuestionStarted);
      sc.off('questionCompleted', onQuestionCompleted);
      sc.off('creditsUpdated', onCreditsUpdated);
      sc.off('gameStatusChanged', onGameStatusChanged);
    };
  }, [gameId, sessionLoading]);

  const handleRetry = () => {
    setError(null);
    setLoading(true);
    setPlayers([]);
    setGameInfo({ ...gameInfo, status: 'loading', playerCount: 0 });
  };

  if (loading) {
    return React.createElement(LoadingState);
  }
  if (error) {
    return React.createElement(ErrorState, { error, onRetry: handleRetry });
  }

  return React.createElement(
    'div',
    { className: 'min-h-screen bg-gradient-to-br from-blue-600 via-purple-600 to-blue-800 flex items-center justify-center p-4' },
    React.createElement(
      'div',
      { className: 'bg-white rounded-3xl shadow-2xl w-full max-w-4xl min-h-[700px] overflow-hidden' },
      React.createElement(GameHeader, {
        gameId: gameInfo.gameId,
        status: gameInfo.status,
        playerCount: gameInfo.playerCount
      }),
      React.createElement(
        'div',
        { className: 'relative min-h-[600px]' },
        React.createElement(LeaderboardView, {
          gameState,
          players
        }),
        React.createElement(QuestionView, {
          gameState,
          currentQuestion,
          activePlayer
        })
      )
    )
  );
}
