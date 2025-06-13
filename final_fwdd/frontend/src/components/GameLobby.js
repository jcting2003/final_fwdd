// frontend/src/components/GameLobby.js

import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import QRCode from 'react-qr-code';
import Table from 'react-bootstrap/Table';
import gameAPI from '../services/gameAPI';    // your existing gameAPI service
import socket from '../utils/socket';
import { useAuth } from '../context/AuthContext';

export default function GameLobby() {
  const { gameId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();                // get current user from context

  const [players, setPlayers]     = useState([]);
  const [error, setError]         = useState(null);
  const [isHost, setIsHost]       = useState(false);
  const [gameStatus, setGameStatus] = useState('lobby');

  const joinUrl = `${window.location.origin}/join?game=${gameId}`;

  // Fetch game metadata and determine host
  useEffect(() => {
    (async () => {
      try {
        const gameData = await gameAPI.getGameInfo(gameId);
        // gameData.hostId is now the correct field
        setIsHost(gameData.hostId === user.username);
        setGameStatus(gameData.status);
      } catch (err) {
        console.error('Error fetching game info:', err);
        setError('Could not fetch game info');
      }
    })();
  }, [gameId, user.username]);

  // Fetch leaderboard periodically
  useEffect(() => {
    let mounted = true;
    const fetchPlayers = async () => {
      try {
        const res = await gameAPI.getLeaderboard(gameId);
        const ranked = (res.players || []).map((p, i) => ({
          ...p,
          rank: i + 1
        }));
        if (mounted) setPlayers(ranked);
      } catch (err) {
        console.error('Error fetching leaderboard:', err);
        setError('Failed to load leaderboard');
      }
    };
    fetchPlayers();
    const interval = setInterval(fetchPlayers, 3000);
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, [gameId]);

  // Socket.IO: join room & listen for startGame
  useEffect(() => {
    const onStart = ({ gameId: startedId }) => {
      if (startedId === gameId) {
        navigate(`/leaderboard/${gameId}`);
      }
    };

    const onConnect = () => {
      socket.emit('joinGame', gameId);
      socket.on('startGame', onStart);
    };

    socket.on('connect', onConnect);
    if (!socket.connected) socket.connect();
    else onConnect();

    return () => {
      socket.off('connect', onConnect);
      socket.off('startGame', onStart);
    };
  }, [gameId, navigate]);

  // Host starts the game
  const handleStartGame = async () => {
    try {
      await gameAPI.startGame(gameId);
      alert('Game started! Redirecting to leaderboard...');
      setGameStatus('active');
      socket.emit('startGame', { gameId });
      navigate(`/leaderboard/${gameId}`, { replace: true });
    } catch (err) {
      console.error('Failed to start game:', err);
      setError('Failed to start game');
    }
  };

  return (
    <div className="container p-4 text-center">
      <h1 className="text-3xl font-bold mb-4">Game Lobby</h1>
      <p className="text-lg mb-1">Share this Game ID:</p>
      <p className="text-2xl font-mono mb-4 text-blue-700">{gameId}</p>
      <div className="inline-block p-4 bg-white rounded shadow-lg mb-4">
        <QRCode value={joinUrl} size={256} />
      </div>
      <p className="text-gray-600 mb-4">Scan or enter this ID to join.</p>
      {error && <div className="text-red-500 mb-4">{error}</div>}

      {isHost && gameStatus === 'lobby' && (
        <button
          className="btn btn-success mb-4"
          onClick={handleStartGame}
        >
          Start Game
        </button>
      )}

      {players.length === 0 ? (
        <div className="text-gray-500">Waiting for players...</div>
      ) : (
        <div className="mt-6">
          <h2 className="text-xl font-semibold mb-3">Leaderboard</h2>
          <Table striped bordered hover responsive>
            <thead>
              <tr>
                <th>Rank</th>
                <th>Username</th>
                <th>Status</th>
                <th>Credits</th>
              </tr>
            </thead>
            <tbody>
              {players.map(p => (
                <tr key={p.username}>
                  <td>{p.rank}</td>
                  <td>{p.username}</td>
                  <td>{p.status || 'Waiting'}</td>
                  <td>{p.credits ?? 0}</td>
                </tr>
              ))}
            </tbody>
          </Table>
          <p className="text-gray-600 mt-2">
            Leaderboard refreshes every 3 seconds.
          </p>
        </div>
      )}
    </div>
  );
}
