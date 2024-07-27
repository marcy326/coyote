import React, { useState } from 'react';
import InitialScreen from './components/InitialScreen';
import NameInputScreen from './components/NameInputScreen';
import RoomScreen from './components/RoomScreen';

function App() {
  const [screen, setScreen] = useState('initial');
  const [currentRoomId, setCurrentRoomId] = useState(null);

  const handleRoomCreated = (roomId) => {
    setCurrentRoomId(roomId);
    setScreen('nameInput');
  };

  const handleRoomJoined = (roomId) => {
    setCurrentRoomId(roomId);
    setScreen('nameInput');
  };

  const handleNameEntered = () => {
    setScreen('room');
  };

  return (
    <div className="App">
      {screen === 'initial' && (
        <InitialScreen onRoomCreated={handleRoomCreated} onRoomJoined={handleRoomJoined} />
      )}
      {screen === 'nameInput' && currentRoomId && (
        <NameInputScreen roomId={currentRoomId} onNameEntered={handleNameEntered} />
      )}
      {screen === 'room' && currentRoomId && <RoomScreen roomId={currentRoomId} />}
    </div>
  );
}

export default App;
