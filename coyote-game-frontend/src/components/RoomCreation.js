import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { setRoomId } from '../store/gameSlice';
import axios from 'axios';

const RoomCreation = () => {
  const [roomId, setRoomIdLocal] = useState('');
  const dispatch = useDispatch();

  const createRoom = async () => {
    try {
      await axios.post(`http://localhost:8000/room?room_id=${roomId}`);
      dispatch(setRoomId(roomId));
      console.log('Room created and ID set:', roomId); // Add this line
    } catch (error) {
      console.error('Error creating room:', error);
    }
  };

  return (
    <div className="p-4">
      <input
        type="text"
        value={roomId}
        onChange={(e) => setRoomIdLocal(e.target.value)}
        placeholder="Enter room ID"
        className="border p-2 mr-2"
      />
      <button onClick={createRoom} className="bg-blue-500 text-white p-2 rounded">
        Create Room
      </button>
    </div>
  );
};

export default RoomCreation;