import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { setRoomId, resetGame } from './store/gameSlice';
import InitialScreen from './components/InitialScreen';
import NameInputScreen from './components/NameInputScreen';
import RoomScreen from './components/RoomScreen';
import OfflineGameScreen from './components/OfflineGameScreen';
import OnlineGameScreen from './components/OnlineGameScreen';

function App() {
  const [screen, setScreen] = useState('initial');
  const currentRoomId = useSelector(state => state.game.roomId);
  const gameStarted = useSelector(state => state.game.gameStarted);
  const dispatch = useDispatch();

  const handleRoomCreated = (roomId) => {
    dispatch(setRoomId(roomId));
    setScreen('nameInput');
  };

  const handleRoomJoined = (roomId) => {
    dispatch(setRoomId(roomId));
    setScreen('nameInput');
  };

  const handleLeaveRoom = () => {
    dispatch(resetGame());
    setScreen('initial');
  };

  const handleNameEntered = () => {
    setScreen('room');
  };

  const handleOfflineGameStarted = () => {
    setScreen('offlineGame');
  };

  const handleOnlineGameStarted = () => {
    setScreen('onlineGame');
  };

  const handleGameEnded = () => {
    setScreen('room');
  };

  return (
    <div className="App">
      {screen === 'initial' && (
        <InitialScreen
          onRoomCreated={handleRoomCreated}
          onRoomJoined={handleRoomJoined}
        />
      )}
      {screen === 'nameInput' && currentRoomId && (
        <NameInputScreen
          roomId={currentRoomId}
          onNameEntered={handleNameEntered}
        />
      )}
      {screen === 'room' && currentRoomId && (
        <RoomScreen
          roomId={currentRoomId}
          onStartOfflineGame={handleOfflineGameStarted}
          onStartOnlineGame={handleOnlineGameStarted}
          onLeaveRoom={handleLeaveRoom}
        />
      )}
      {screen === 'offlineGame' && currentRoomId && (
        <OfflineGameScreen
          roomId={currentRoomId}
          onGameEnd={handleGameEnded}
        />
      )}
      {screen === 'onlineGame' && currentRoomId && (
        <OnlineGameScreen
          roomId={currentRoomId}
          onGameEnd={handleGameEnded}
        />
      )}
    </div>
  );
}

export default App;