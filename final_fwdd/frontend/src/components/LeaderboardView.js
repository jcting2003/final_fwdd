// frontend/src/components/LeaderboardView.js

import React, { useState, useEffect, useCallback } from 'react';
import Table                      from 'react-bootstrap/Table';
import { Trophy, Users, Wifi }    from 'lucide-react';
import { useAuth }                from '../context/AuthContext';
import gameAPI                    from '../services/gameAPI';
import socket                     from '../utils/socket';
import 'bootstrap/dist/css/bootstrap.min.css';
import { useParams, useNavigate } from 'react-router-dom';


export default function LeaderboardView() {
  const { gameId } = useParams();
  const { user, loading } = useAuth();
  const username = user?.username;
  const navigate = useNavigate();

  const [players, setPlayers]         = useState([]);
  const [gameState, setGameState]     = useState('loading');
  const [error, setError]             = useState(null);
  const [isHost, setIsHost]           = useState(false);
  const [creditInputs, setCreditInputs] = useState({});

  // 1️⃣ Fetch game info & host flag
  useEffect(() => {
    if (loading || !username) return;
    (async () => {
      try {
        const data = await gameAPI.getGameInfo(gameId);
        setIsHost(data.hostId === username);
        setGameState(data.status);
      } catch (err) {
        console.error('Error fetching game info:', err);
        setError('Could not fetch game info');
      }
    })();
  }, [gameId, username, loading]);

  // 2️⃣ Leaderboard + socket listeners
  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const { players: list } = await gameAPI.getLeaderboard(gameId);
        const ranked = (list || [])
          .sort((a, b) => b.credits - a.credits)
          .map((pl, idx) => ({ 
            ...pl, 
            rank: idx + 1, 
            name: pl.username 
          }));
        setPlayers(ranked);
      } catch (err) {
        console.error(err);
        setError('Failed to load leaderboard');
      }
    };

    fetchLeaderboard();

    const onUpdateCredits = ({ playerUsername, credits, available_credits }) => {
      setPlayers(prev =>
        prev
          .map(pl =>
            pl.username === playerUsername
              ? { ...pl, credits, available_credits }
              : pl
          )
          .sort((a, b) => b.credits - a.credits)
          .map((pl, idx) => ({ ...pl, rank: idx + 1 }))
      );
    };

    const onLeaderboardUpdated = () => setTimeout(fetchLeaderboard, 100);
    const onGameStatusChanged  = newStatus => {
      setGameState(newStatus);
      fetchLeaderboard();
    };
    const onStartGame = ({ gameId: startedId }) => {
      if (startedId === gameId) setGameState('active');
    };

    socket.on('updateCredits', onUpdateCredits);
    socket.on('leaderboardUpdated', onLeaderboardUpdated);
    socket.on('gameStatusChanged', onGameStatusChanged);
    socket.on('startGame', onStartGame);



    return () => {
      socket.off('updateCredits', onUpdateCredits);
      socket.off('leaderboardUpdated', onLeaderboardUpdated);
      socket.off('gameStatusChanged', onGameStatusChanged);
      socket.off('startGame', onStartGame);
    };
  }, [gameId]);

  // 3️⃣ Host end-game control
  const handleEndGame = async () => {
    try {
      await gameAPI.endGame(gameId);
      socket.emit('gameStatusChanged', 'ended');
      setGameState('ended');
    } catch (err) {
      console.error('Failed to end game:', err);
      setError('Failed to end game');
    }
  };

  // 4️⃣ Credit inputs
  const handleInputChange = (uname, val) => {
    setCreditInputs(prev => ({ ...prev, [uname]: val }));
  };
  const handleAddCredits = async uname => {
    const amt = parseInt(creditInputs[uname], 10);
    if (!amt) return;
    try {
      await gameAPI.addCredits(gameId, uname, amt);
      socket.emit('leaderboardUpdated', { gameId });
      setCreditInputs(prev => ({ ...prev, [uname]: '' }));
    } catch (err) {
      console.error('Failed to add credits:', err);
    }
  };
  const handleDeductCredits = async uname => {
    const amt = parseInt(creditInputs[uname], 10);
    if (!amt) return;
    try {
      await gameAPI.deductAvailableCredits(gameId, uname, amt);
      socket.emit('leaderboardUpdated', { gameId });
      setCreditInputs(prev => ({ ...prev, [uname]: '' }));
    } catch (err) {
      console.error('Failed to deduct credits:', err);
    }
  };

  // 5️⃣ Render states
  if (loading) return <div className="text-center p-4">Loading session…</div>;
  if (error)   return <div className="text-center p-4 text-danger">{error}</div>;
  if (gameState === 'loading') return <div className="p-4 text-center">Loading leaderboard…</div>;

  return (
    <div className="container mt-5">
      {/* Header */}
      <div className="text-center mb-4">
        <div className="d-flex justify-content-center align-items-center mb-2">
          <Trophy size={32} className="text-warning me-2" />
          <h2 className="fw-bold text-dark">Game Leaderboard</h2>
        </div>
        <div className="d-flex justify-content-center gap-4 text-secondary small">
          <div className="d-flex align-items-center gap-1">
            <Users size={16} />
            <span>{players.length} Player{players.length !== 1 && 's'}</span>
          </div>
          <div className="d-flex align-items-center gap-1 text-success">
            <Wifi size={16} />
            <span>{gameState === 'active' ? 'Live' : 'Offline'}</span>
          </div>
        </div>
      </div>

      {/* Players table or empty state */}
      {players.length === 0 ? (
        <div className="text-center py-5 text-muted">
          <Users size={48} className="mb-3" />
          <h4>No Players Yet</h4>
          <p>Waiting for players to join…</p>
        </div>
      ) : (
        <Table striped bordered hover responsive>
          <thead className="table-dark">
            <tr>
              <th>#</th>
              <th>Username</th>
              <th>Status</th>
              <th>Credits</th>
              <th>Available</th>
              {isHost && <th>Manage</th>}
            </tr>
          </thead>
          <tbody>
            {players.map(player => (
              <tr key={player.username}>
                <td>{gameState === 'ended' ? player.rank : '-'}</td>
                <td>{player.name}</td>
                <td>
                  {gameState === 'ended'
                    ? player.rank === 1
                      ? '🏆 Champion'
                      : player.rank === 2
                      ? '🥈 Runner-up'
                      : player.rank === 3
                      ? '🥉 Third Place'
                      : '⭐ Player'
                    : '⭐ Player'}
                </td>
                <td>{player.credits}</td>
                <td>{player.available_credits}</td>
                {isHost && (
                  <td>
                    <input
                      type="number"
                      min="1"
                      value={creditInputs[player.username] || ''}
                      onChange={e => handleInputChange(player.username, e.target.value)}
                      className="form-control mb-1"
                      placeholder="Amount"
                    />
                    <div className="d-flex gap-1">
                      <button
                        className="btn btn-sm btn-success"
                        onClick={() => handleAddCredits(player.username)}
                      >
                        ➕
                      </button>
                      <button
                        className="btn btn-sm btn-danger"
                        onClick={() => handleDeductCredits(player.username)}
                      >
                        ➖
                      </button>
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </Table>
      )}

      {/* End Game button for host when active */}
      {isHost && gameState === 'active' && (
        <div className="text-center mt-4">
          <button className="btn btn-danger" onClick={handleEndGame}>
            End Game
          </button>
        </div>
      )}
        {/* Back to Home after end */}
      {gameState === 'ended' && (
        <div className="text-center mt-4">
          <button
            className="btn btn-primary"
            onClick={() => navigate('/mainpage')}
          >
            Back to Home
          </button>
        </div>
      )}
    </div>
  );
}
