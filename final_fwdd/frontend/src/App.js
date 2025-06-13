// frontend/src/App.js

import React, { useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate,useLocation } from 'react-router-dom';
import { useAuth } from './context/AuthContext';

import Login           from './components/Login';
import MainPage        from './components/MainPage';
import JoinGame        from './components/JoinGame';
import GameLobby       from './components/GameLobby';
import LeaderboardView from './components/LeaderboardView';
import TileQuestion    from './components/TileQuestion';
import Nav             from './components/Nav';
import TileScanHandler from './components/TileScanHandler'; // Import the tile scan handler

function App() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const isLoggedIn = Boolean(user);
  const username = user?.username;
  const location = useLocation();

  // Redirect logged‐in users into /mainpage
  useEffect(() => {
    // Only redirect a logged‐in user _from_ the login page:
    if (!loading && user && window.location.pathname === '/login') {
      navigate('/mainpage', { replace: true });
    }
  }, [user, loading, navigate, location.pathname]);

  if (loading) return <div>Loading…</div>;

  return (
    <div className="App">
    <header className="App-header">
      {isLoggedIn && <Nav />}
      {isLoggedIn && (
        <div className="welcome-message">
          Welcome back, <strong>{username}</strong>!
        </div>
      )}
    </header>


    <Routes>
      {/* Public: login */}
      <Route
        path="/login"
        element={!user ? <Login /> : <Navigate to="/mainpage" replace />}
      />

      {/* Protected: main dashboard */}
      <Route
        path="/mainpage"
        element={user ? <MainPage /> : <Navigate to="/login" replace />}
      />

      {/* Protected: join by ?game= */}
      <Route
        path="/join"
        element={
          user
            ? <JoinGame />
            : <Navigate 
                to="/login" 
                replace 
                state={{ from: location.pathname + location.search }} 
              />
        }
        />

      {/* Protected: lobby view */}
      <Route
        path="/lobby/:gameId"
        element={user ? <GameLobby /> : <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />}
      />

      {/* Protected: end‐game leaderboard */}
      <Route
        path="/leaderboard/:gameId"
        element={user ? <LeaderboardView /> : <Navigate to="/login" replace state={{ from: location.pathname + location.search}} />}
      />

      <Route
        path="/scan/tile/:tileId"
        element={user ? <TileScanHandler /> : <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />}
      />

      {/* Protected: tile question view */}
      <Route
        path="/tile/:gameId/:tileId"
        element={user ? <TileQuestion /> : <Navigate to="/login" replace state={{ from: location.pathname + location.search}} />}
      />

      {/* Fallback */}
      <Route
        path="*"
        element={<Navigate to={user ? '/mainpage' : '/login'} replace />}
      />
    </Routes>
    </div>
  );
}

export default App;
