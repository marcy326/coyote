import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { setRoomId } from '../store/gameSlice';
import axios from 'axios';

const InitialScreen = ({ onRoomCreated, onRoomJoined }) => {
  const [roomIdInput, setRoomIdInput] = useState('');
  const [error, setError] = useState('');
  const dispatch = useDispatch();

  const createRoom = async () => {
    try {
      const response = await axios.post(`${process.env.REACT_APP_API_BASE_URL}/room`);
      const roomId = response.data.room_id;
      dispatch(setRoomId(roomId));
      onRoomCreated(roomId);
    } catch (error) {
      console.error('Error creating room:', error);
      setError('部屋の作成に失敗しました。もう一度お試しください。');
    }
  };

  const joinRoom = async () => {
    try {
      const response = await axios.get(`${process.env.REACT_APP_API_BASE_URL}/room/${roomIdInput}/players`);
      if (response.status === 200) {
        dispatch(setRoomId(roomIdInput));
        onRoomJoined(roomIdInput);
      }
    } catch (error) {
      console.error('部屋への参加中にエラーが発生しました:', error);
      setError('指定された部屋が存在しません。部屋IDを確認してください。');
    }
  };

  return (
    <div className="container">
      <div className="header">
        <h1 className="text-xl">Welcome to Coyote Game</h1>
      </div>
      <div className="card">
        <button onClick={createRoom} className="bg-blue text-white p-2 rounded">
          部屋を作成
        </button>
        <div className="separator"></div>
        <input
          type="text"
          value={roomIdInput}
          onChange={(e) => setRoomIdInput(e.target.value)}
          placeholder="Enter Room ID"
          className="border p-2 mb-4"
        />
        <button onClick={joinRoom} className="bg-green text-white p-2 rounded">
          部屋に参加
        </button>
        {error && <p className="text-red mt-2">{error}</p>}
      </div>
    </div>
  );
};

export default InitialScreen;