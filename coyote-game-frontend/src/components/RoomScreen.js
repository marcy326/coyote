import React, { useEffect, useState, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { updatePlayers, setPlayerName, updateGameState } from '../store/gameSlice';
import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';

const RoomScreen = ({ roomId, onStartGame }) => {
  const dispatch = useDispatch();
  const players = useSelector((state) => state.game.players);
  const playerName = useSelector((state) => state.game.playerName);
  const [error, setError] = useState(null);
  const wsRef = useRef(null);

  useEffect(() => {
    const fetchPlayers = async () => {
      try {
        const response = await axios.get(`http://localhost:8000/room/${roomId}/players`);
        dispatch(updatePlayers(response.data.players));
      } catch (error) {
        console.error('Error fetching players:', error);
      }
    };
    fetchPlayers();
  }, [dispatch, roomId]);

  useEffect(() => {
    if (roomId) {
      const playerId = localStorage.getItem('playerId') || uuidv4();
      localStorage.setItem('playerId', playerId);

      wsRef.current = new WebSocket(`ws://localhost:8000/ws/${roomId}?playerId=${playerId}`);

      wsRef.current.onopen = () => {
        console.log('WebSocket connected');
      };

      wsRef.current.onmessage = (event) => {
        console.log('Received WebSocket message:', event.data);
        const data = JSON.parse(event.data);
        if (data.type === 'player_joined') {
          dispatch(updatePlayers(data.players));
        } else if (data.type === 'game_started') {
          dispatch(updateGameState(data.game_state));
          onStartGame(); // ゲーム開始メッセージを受信したら画面遷移
        }
      };

      wsRef.current.onerror = (error) => {
        console.error('WebSocket error:', error);
      };

      wsRef.current.onclose = () => {
        console.log('WebSocket disconnected');
      };

      return () => {
        wsRef.current.close();
      };
    }
  }, [roomId, dispatch, onStartGame]);

  const startGame = async () => {
    try {
      const response = await axios.post(`http://localhost:8000/room/${roomId}/start`);
      if (response.data.error) {
        setError(response.data.error);
      } else {
        setError(null); // エラーがない場合はエラーをクリア
        onStartGame(); // onStartGame()を呼び出す
      }
    } catch (error) {
      console.error('Error starting game:', error);
      setError('Failed to start the game. Please try again.');
    }
  };

  return (
    <div className="p-4">
      <h2 className="text-xl mb-4">Room {roomId}</h2>
      <div className="mt-4">
        <h3 className="text-lg mb-2">Players in room:</h3>
        <ul>
          {players.map((player, index) => (
            <li key={index}>{player.name}</li>
          ))}
        </ul>
        <p>Total players: {players.length}</p>
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
    </div>
  );
};

export default RoomScreen;
