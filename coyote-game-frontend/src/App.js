import React, { useEffect } from 'react';
import { useSelector } from 'react-redux';
import RoomCreation from './components/RoomCreation';
import JoinRoom from './components/JoinRoom';
import GameBoard from './components/GameBoard';

function App() {
  const { roomId, playerName } = useSelector((state) => state.game);

  useEffect(() => {
    console.log('Current roomId:', roomId); // Add this line
  }, [roomId]);

  return (
    <div className="App p-4">
      <h1 className="text-2xl mb-4">Coyote Game</h1>
      {!roomId && <RoomCreation />}
      {roomId && !playerName && <JoinRoom />}
      {roomId && playerName && <GameBoard />}
    </div>
  );
}

export default App;