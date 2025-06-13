import React, { useEffect } from 'react';
import { useParams, useNavigate, useLocation  } from 'react-router-dom';
//import { GAME_API_BASE  } from '../config'; 
import gameAPI from '../services/gameAPI'; // Adjust the import path as needed

export default function TileScanHandler() {
  const { tileId } = useParams();
  const navigate = useNavigate();
  const { pathname, search } = useLocation();
  const redirectUrl = pathname + search;

  useEffect(() => {
    console.log('🍪 document.cookie:', document.cookie);
    alert('Cookies:\n' + document.cookie);
    
    (async () => {
      try {
        const { gameId } = await gameAPI.getCurrentGame();
        navigate(`/tile/${gameId}/${tileId}`, { replace: true });
      } catch (err) {
        console.error(err);
        alert('You must be in a game to scan tiles. Please join or start one first.');
        navigate('/login', {
          replace: true,
          state: { from: redirectUrl }
        });
      }
    })();
  }, [tileId, navigate, redirectUrl]);

  return <div className="p-4 text-center">Looking up your current game…</div>;
}
