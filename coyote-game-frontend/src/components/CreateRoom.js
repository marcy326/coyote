// CreateRoom.js
import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { setPlayerName, setRoomId } from '../store/gameSlice';
import axios from 'axios';

const CreateRoom = () => {
  const [name, setName] = useState('');
  const dispatch = useDispatch();

  const createAndJoinRoom = async () => {
    try {
      const response = await axios.post(`http://localhost:8000/room`, { player_name: name });
      const roomId = response.data.room_id; // レスポンスからルームIDを取得
      dispatch(setPlayerName(name));
      dispatch(setRoomId(roomId)); // Reduxの状態にルームIDを保存
      // ここで自動的にルームに参加する処理を呼び出す
      await axios.post(`http://localhost:8000/room/${roomId}/join?player_name=${name}`);
    } catch (error) {
      console.error('Error creating and joining room:', error);
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
      <button onClick={createAndJoinRoom} className="bg-green-500 text-white p-2 rounded">
        Create and Join Room
      </button>
    </div>
  );
};

export default CreateRoom;