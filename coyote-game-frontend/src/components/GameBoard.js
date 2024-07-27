import React, { useEffect, useRef, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { updateGameState, updatePlayers } from '../store/gameSlice';
import axios from 'axios';

const GameBoard = () => {
  const dispatch = useDispatch();
  const { roomId, playerName, players, gameStarted, currentTurn, currentCard } = useSelector((state) => state.game);
  const wsRef = useRef(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (roomId && playerName) {
      console.log('Connecting to WebSocket');
      wsRef.current = new WebSocket(`ws://localhost:8000/ws/${roomId}`);
      
      wsRef.current.onopen = () => {
        console.log('WebSocket connected');
      };

      wsRef.current.onmessage = (event) => {
        console.log('Received WebSocket message:', event.data);
        const data = JSON.parse(event.data);
        if (data.type === 'game_started') {
          console.log('Game started event received');
          dispatch(updateGameState(data.game_state));
        } else if (data.type === 'player_joined') {
          console.log('Player joined event received');
          dispatch(updatePlayers(data.players));
        } else {
          dispatch(updateGameState(data));
        }
      };

      wsRef.current.onerror = (error) => {
        console.error('WebSocket error:', error);
      };

      return () => {
        console.log('Closing WebSocket');
        wsRef.current.close();
      };
    }
  }, [roomId, playerName, dispatch]);

  const startGame = async () => {
    try {
      console.log('Sending start game request');
      const response = await axios.post(`http://localhost:8000/room/${roomId}/start`);
      console.log('Start game response:', response.data);
      if (response.data.error) {
        setError(response.data.error);
      }
    } catch (error) {
      console.error('Error starting game:', error);
      setError('Failed to start the game. Please try again.');
    }
  };

  const playTurn = (action) => {
    if (wsRef.current) {
      wsRef.current.send(JSON.stringify({
        type: 'play_turn',
        player: playerName,
        action: action
      }));
    }
  };

  if (error) {
    return <div className="text-red-500">{error}</div>;
  }

  if (!gameStarted) {
    return (
      <div className="p-4">
        <div>Waiting for the game to start...</div>
        <div>Players in room: {players.length}</div>
        <div>Player names: {players.map(p => p.name).join(', ')}</div>
        <div>Your name: {playerName}</div>
        <div>Room ID: {roomId}</div>
        {error && <div className="text-red-500">{error}</div>}
        <button 
          onClick={startGame} 
          className={`bg-green-500 text-white p-2 rounded mt-4 ${players.length < 2 ? 'opacity-50 cursor-not-allowed' : ''}`}
          disabled={players.length < 2}
        >
          Start Game
        </button>
        {players.length < 2 && <div className="text-yellow-500 mt-2">At least 2 players are required to start the game</div>}
      </div>
    );
  }

  return (
    <div className="p-4">
      <h2 className="text-xl mb-4">Game Board</h2>
      <p>Current Turn: {currentTurn}</p>
      <p>Your Card: {currentCard}</p>
      <div className="mt-4">
        <button onClick={() => playTurn('draw')} className="bg-blue-500 text-white p-2 rounded mr-2">
          Draw Card
        </button>
        <button onClick={() => playTurn('pass')} className="bg-gray-500 text-white p-2 rounded">
          Pass
        </button>
      </div>
      <div className="mt-4">
        <h3 className="text-lg mb-2">Players:</h3>
        <ul>
          {players.map((player, index) => (
            <li key={index}>{player.name} - Score: {player.score}</li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default GameBoard;
