import React, { useEffect, useState, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { updatePlayers, setPlayerName, updateGameState, setRoomId, setGameInProgress, setCurrentTurn } from '../store/gameSlice';
import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';

const RoomScreen = ({ roomId, onStartOfflineGame, onStartOnlineGame, onLeaveRoom }) => {
  const dispatch = useDispatch();
  const players = useSelector((state) => state.game.players);
  const playerId = useSelector((state) => state.game.playerId);
  const playerName = useSelector((state) => state.game.playerName);
  const gameInProgress = useSelector((state) => state.game.gameInProgress);
  const currentTurn = useSelector((state) => state.game.currentTurn);
  const randomOrder = useSelector((state) => state.game.randomOrder);
  const [error, setError] = useState(null);
  const [copySuccess, setCopySuccess] = useState('');
  const wsRef = useRef(null);

  useEffect(() => {
    const fetchPlayers = async () => {
      try {
        const response = await axios.get(`${process.env.REACT_APP_API_BASE_URL}/room/${roomId}/players`);
        dispatch(updatePlayers(response.data.players));
        dispatch(setGameInProgress(response.data.gameInProgress));
        console.log(`Fetched players for room ${roomId}: gameInProgress = ${response.data.gameInProgress}`);
      } catch (error) {
        console.error('Error fetching players:', error);
      }
    };
    fetchPlayers();

    if (roomId) {
      const playerId = localStorage.getItem('playerId') || uuidv4();
      localStorage.setItem('playerId', playerId);

      wsRef.current = new WebSocket(`${process.env.REACT_APP_WS_BASE_URL}/ws/${roomId}?playerId=${playerId}`);

      wsRef.current.onopen = () => {
        console.log('WebSocket connected');
      };

      wsRef.current.onmessage = (event) => {
        console.log('Received WebSocket message:', event.data);
        const data = JSON.parse(event.data);
        if (data.type === 'player_joined' || data.type === 'player_left') {
          console.log('Updating players:', data.players);
          dispatch(updatePlayers(data.players));
          if (data.gameInProgress !== undefined) {
            dispatch(setGameInProgress(data.gameInProgress));
            console.log(`Updated gameInProgress: ${data.gameInProgress}`); 
          }
        } else if (data.type === 'offlinegame_started') {
          dispatch(updateGameState(data));
          dispatch(setGameInProgress(true));
          console.log('Game started: gameInProgress set to true');
          onStartOfflineGame(); // ゲーム開始メッセージを受信したら画面遷移
        } else if (data.type === 'onlinegame_started') {
          dispatch(updateGameState(data));
          console.log('Game started: gameInProgress set to true');
          onStartOnlineGame(); // ゲーム開始メッセージを受信したら画面遷移
        } else if (data.type === 'game_ended') {
          dispatch(setGameInProgress(false));
          console.log('Game ended: gameInProgress set to false');
        }
      };

      wsRef.current.onerror = (error) => {
        console.error('WebSocket error:', error);
      };

      wsRef.current.onclose = () => {
        console.log('WebSocket disconnected');
      };

      return () => {
        wsRef.current.close();
      };
    }
  }, [roomId, dispatch, onStartOfflineGame, onStartOnlineGame]);

  const startOfflineGame = async () => {
    try {
      const response = await axios.post(`${process.env.REACT_APP_API_BASE_URL}/room/${roomId}/start_offline`);
      if (response.data.error) {
        setError(response.data.error);
      } else {
        setError(null); // エラーがない場合はエラーをクリア
        dispatch(setGameInProgress(true));
        console.log('Game started: gameInProgress set to true');
        onStartOfflineGame(); // onStartGame()を呼び出す
      }
    } catch (error) {
      console.error('Error starting game:', error);
      setError('Failed to start the game. Please try again.');
    }
  };

  const startOnlineGame = async () => {
    try {
      const response = await axios.post(`${process.env.REACT_APP_API_BASE_URL}/room/${roomId}/start_online`);
      if (response.data.error) {
        setError(response.data.error);
      } else {
        setError(null); // エラーがない場合はエラーをクリア
        dispatch(setGameInProgress(true));
        console.log('Game started: gameInProgress set to true');
        onStartOnlineGame(); // onStartGame()を呼び出す
      }
    } catch (error) {
      console.error('Error starting game:', error);
      setError('Failed to start the game. Please try again.');
    }
  };

  const copyRoomId = () => {
    navigator.clipboard.writeText(roomId).then(() => {
      setCopySuccess('コピーしました！');
      setTimeout(() => setCopySuccess(''), 2000); // 2秒後にメッセージを消す
    }, (err) => {
      console.error('Could not copy text: ', err);
      setCopySuccess('コピーに失敗しました');
    });
  };

  const leaveRoom = async () => {
    try {
      const response = await axios.post(`${process.env.REACT_APP_API_BASE_URL}/room/${roomId}/leave`, { player_id: playerId }, { withCredentials: true });
      console.log('Leave room response:', response.data);
      dispatch(updatePlayers(response.data.players)); // サーバーから返された最新のプレイヤーリストで更新
      onLeaveRoom();
    } catch (error) {
      console.error('Error leaving room:', error);
      setError('部屋から退出できませんでした。' + error.response.data.detail);
    }
  };

  console.log(`Rendering RoomScreen: gameInProgress = ${gameInProgress}`);

  return (
    <div className="container">
      <div className="header">
        <h2 className="text-xl mb-4">Waiting Room: {roomId}</h2>
      </div>
      <div className="card">
        <button
          onClick={copyRoomId}
          className="bg-blue text-white p-2 rounded"
        >
          IDをコピー
        </button>
        {copySuccess && <span className="text-green">{copySuccess}</span>}
        <div className="mt-4">
          <h3 className="text-lg mb-2">部屋内のプレイヤー:</h3>
          {players && players.length > 0 ? (
            <ul>
              {players.map((player, index) => (
                <li key={player.id || index}>{player.name}</li>
              ))}
            </ul>
          ) : (
            <p>プレイヤーはまだいません。</p>
          )}
          <p>プレイヤー数: {players ? players.length : 0}</p>
          {error && <div className="text-red">{error}</div>}
          <div className="button-group">
            <button
              onClick={startOfflineGame}
              className={`bg-green text-white p-2 rounded ${(players.length < 2 || gameInProgress) ? 'opacity-50 cursor-not-allowed' : ''}`}
              disabled={!players || players.length < 2 || gameInProgress}
            >
              オフラインゲーム開始
            </button>
            <button
              onClick={startOnlineGame}
              className={`bg-blue text-white p-2 rounded ${(players.length < 2 || gameInProgress) ? 'opacity-50 cursor-not-allowed' : ''}`}
              disabled={!players || players.length < 2 || gameInProgress}
            >
              オンラインゲーム開始
            </button>
            <button
              onClick={leaveRoom}
              className="bg-red text-white p-2 rounded"
            >
              部屋を退出
            </button>
          </div>
          {gameInProgress && <div className="text-yellow mt-2">ゲームが進行中です</div>}
          {(!players || players.length < 2) && <div className="text-yellow mt-2">ゲームを開始するには最低2人のプレイヤーが必要です</div>}
        </div>
      </div>
    </div>
  );
};

export default RoomScreen;