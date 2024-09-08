import React, { useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { setPlayerName, setPlayerId } from '../store/gameSlice';
import axios from 'axios';

const NameInputScreen = ({ roomId, onNameEntered }) => {
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [existingPlayers, setExistingPlayers] = useState([]);
  const dispatch = useDispatch();

  useEffect(() => {
    const fetchPlayers = async () => {
      try {
        const response = await axios.get(`${process.env.REACT_APP_API_BASE_URL}/room/${roomId}/players`);
        setExistingPlayers(response.data.players);
      } catch (error) {
        console.error('Error fetching players:', error);
      }
    };

    fetchPlayers();
  }, [roomId]);

  const joinRoom = async () => {
    if (name.trim().length < 1) {
      setError('名前は空白以外の1文字以上で1入力してください。');
      return;
    }
    if (name.length > 20) {
      setError('名前は20文字以下で入力してください。');
      return;
    }
    if (existingPlayers.some(player => player.name === name)) {
      setError('この名前は既に使用されています。別の名前を入力してください。');
      return;
    }
    try {
      const response = await axios.post(`${process.env.REACT_APP_API_BASE_URL}/room/${roomId}/join`, null, {
        params: { player_name: name },
        withCredentials: true
      });
      const playerId = response.data.playerId;
      console.log(playerId);
      dispatch(setPlayerName(name));
      dispatch(setPlayerId(response.data.playerId));
      onNameEntered();
    } catch (error) {
      console.error('Error joining room:', error);
      setError('Room is full or other error occurred');
    }
  };

  return (
    <div className="container">
      <div className="header">
        <h2 className="text-xl mb-4">Enter your name for Room {roomId}</h2>
      </div>
      <div className="card">
        {error && <p className="text-red">{error}</p>}
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Enter your name"
          className="border p-2 mr-2"
        />
        <button onClick={joinRoom} className="bg-green text-white p-2 rounded">
          入室
        </button>
      </div>
    </div>
  );
};

export default NameInputScreen;