// frontend/src/pages/TileQuestion.js

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import gameAPI from '../services/gameAPI';
import socket from '../utils/socket';
import Swal from 'sweetalert2';
import 'animate.css';

export default function TileQuestion() {
  const { gameId, tileId } = useParams();
  const navigate = useNavigate();

  const [questions, setQuestions] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState(null);
  const [selectedDifficulty, setSelectedDifficulty] = useState(null);
  const [selectedAnswer, setSelectedAnswer]         = useState('');
  const [feedback, setFeedback]                     = useState('');
  const [answeredDifficulties, setAnsweredDifficulties] = useState([]);

  // Load questions for this tile
  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const data = await gameAPI.getTileQuestions(gameId, tileId);
        setQuestions(data.questions);
      } catch (err) {
        console.error('Failed to load questions:', err);
        setError('Failed to load questions.');
      } finally {
        setLoading(false);
      }
    })();
  }, [gameId, tileId]);

  // Load which difficulties have already been answered and listen for locks
  useEffect(() => {
    (async () => {
      try {
        const data = await gameAPI.getAnsweredDifficulties(gameId, tileId);
        setAnsweredDifficulties(data.answered);
      } catch (err) {
        console.error('Failed to fetch answered difficulties:', err);
      }
    })();

    const onLocked = ({ tileId: tId, difficulty }) => {
      if (tId === tileId) {
        setAnsweredDifficulties(prev =>
          Array.from(new Set([...prev, difficulty]))
        );
      }
    };

    socket.on('difficultyLocked', onLocked);
    return () => {
      socket.off('difficultyLocked', onLocked);
    };
  }, [gameId, tileId]);

  const difficulties = ['easy', 'medium', 'hard'];
  const currentQuestion = questions.find(q => q.difficulty === selectedDifficulty);

  const handleDifficultySelect = (level) => {
    setSelectedDifficulty(level);
    setSelectedAnswer('');
    setFeedback('');
  };

  const handleAnswerChange = (e) => {
    setSelectedAnswer(e.target.value);
  };

  const handleSubmit = async () => {
    if (!selectedAnswer) {
      return Swal.fire({
        icon: 'info',
        title: 'Please select an answer.',
        showClass: {
          popup: 'animate__animated animate__fadeInUp animate__faster'
        },
        hideClass: {
          popup: 'animate__animated animate__fadeOutDown animate__faster'
        }
      });
    }
    try {
      const res = await gameAPI.submitTileAnswer(gameId, tileId, {
        difficulty: selectedDifficulty,
        selected_answer: selectedAnswer
      });
      setAnsweredDifficulties(prev =>
        Array.from(new Set([...prev, selectedDifficulty]))
      );
        const isCorrect = res.correct;

        await Swal.fire({
          title: isCorrect ? 'Correct! 🎉' : 'Wrong!',
          text: isCorrect
            ? 'You earned credits!'
            : 'Better luck next time.',
          icon: isCorrect ? 'success' : 'error',
          showClass: {
            popup: `
              animate__animated
              animate__fadeInUp
              animate__faster
            `
          },
          hideClass: {
            popup: `
              animate__animated
              animate__fadeOutDown
              animate__faster
            `
          },
          confirmButtonText: 'Back to Leaderboard'
        })
        navigate(`/leaderboard/${gameId}`, { replace: true });

      } catch (err) {
        console.error(err);
        Swal.fire("Submission failed. Try again later.", "", "error");
      }
    };

  if (loading) return <div>Loading questions...</div>;
  if (error)   return <div className="text-danger">{error}</div>;

  return (
    <div className="container mt-4">
      <h3>Tile {tileId} Questions</h3>

      <div className="mb-3">
        <strong>Select Difficulty:</strong>
        <div className="mt-2">
          {difficulties.map(level => (
            <button
              key={level}
              className={`btn me-2 mb-2 ${
                answeredDifficulties.includes(level)
                  ? 'btn-secondary disabled'
                  : selectedDifficulty === level
                  ? 'btn-primary'
                  : 'btn-outline-primary'
              }`}
              onClick={() => handleDifficultySelect(level)}
              disabled={answeredDifficulties.includes(level)}
            >
              {level.charAt(0).toUpperCase() + level.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {selectedDifficulty && currentQuestion && (
        <div>
          <h5>{currentQuestion.question_text}</h5>
          <form>
            {currentQuestion.options.map((opt, idx) => (
              <div key={idx} className="form-check">
                <input
                  type="radio"
                  id={`opt-${idx}`}
                  name="answer"
                  value={opt}
                  checked={selectedAnswer === opt}
                  onChange={handleAnswerChange}
                  className="form-check-input"
                />
                <label htmlFor={`opt-${idx}`} className="form-check-label">
                  {opt}
                </label>
              </div>
            ))}
          </form>
          <button
            className="btn btn-success mt-3"
            onClick={handleSubmit}
          >
            Submit Answer
          </button>
          {feedback && <p className="mt-3">{feedback}</p>}
        </div>
      )}
    </div>
  );
}
