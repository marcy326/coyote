import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { setRoomId } from '../store/gameSlice';
import axios from 'axios';

const InitialScreen = ({ onRoomCreated, onRoomJoined }) => {
  const [roomIdInput, setRoomIdInput] = useState('');
  const dispatch = useDispatch();

  const createRoom = async () => {
    try {
      const response = await axios.post('http://localhost:8000/room');
      const roomId = response.data.room_id;
      dispatch(setRoomId(roomId));
      onRoomCreated(roomId);
    } catch (error) {
      console.error('Error creating room:', error);
    }
  };

  const joinRoom = () => {
    dispatch(setRoomId(roomIdInput));
    onRoomJoined(roomIdInput);
  };

  return (
    <div className="p-4">
      <button onClick={createRoom} className="bg-blue-500 text-white p-2 rounded mr-2">
        Create Room
      </button>
      <br></br><br></br>
      
      <input
        type="text"
        value={roomIdInput}
        onChange={(e) => setRoomIdInput(e.target.value)}
        placeholder="Enter Room ID"
        className="border p-2 mr-2"
      />
      <button onClick={joinRoom} className="bg-green-500 text-white p-2 rounded">
        Join Room
      </button>
    </div>
  );
};

export default InitialScreen;
