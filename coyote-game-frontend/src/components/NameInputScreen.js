import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { setPlayerName } from '../store/gameSlice';
import axios from 'axios';

const NameInputScreen = ({ roomId, onNameEntered }) => {
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const dispatch = useDispatch();

  const joinRoom = async () => {
    if (name.trim().length < 1) {
      setError('名前は空白以外の1文字以上で1入力してください。');
      return;
    }
    if (name.length > 20) {
      setError('名前は20文字以下で入力してください。');
      return;
    }
    try {
      await axios.post(`${process.env.REACT_APP_API_BASE_URL}/room/${roomId}/join`, null, {
        params: { player_name: name },
        withCredentials: true
      });
      dispatch(setPlayerName(name));
      onNameEntered();
    } catch (error) {
      console.error('Error joining room:', error);
      setError('Room is full or other error occurred');
    }
  };

  return (
    <div className="p-4">
      <h2 className="text-xl mb-4">Enter your name for Room {roomId}</h2>
      {error && <p className="text-red-500">{error}</p>}
      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Enter your name"
        className="border p-2 mr-2"
      />
      <button onClick={joinRoom} className="bg-green-500 text-white p-2 rounded">
        Join Room
      </button>
    </div>
  );
};

export default NameInputScreen;
