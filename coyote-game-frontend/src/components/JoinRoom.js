import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { setPlayerName } from '../store/gameSlice';
import axios from 'axios';

const JoinRoom = () => {
  const [name, setName] = useState('');
  const dispatch = useDispatch();
  const roomId = useSelector((state) => state.game.roomId);

  const joinRoom = async () => {
    try {
      await axios.post(`http://localhost:8000/room/${roomId}/join?player_name=${name}`);
      dispatch(setPlayerName(name));
    } catch (error) {
      console.error('Error joining room:', error);
    }
  };

  return (
    <div className="p-4">
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

export default JoinRoom;
