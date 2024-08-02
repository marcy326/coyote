import React, { useEffect, useState, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { updatePlayers, setPlayerName, updateGameState, setRoomId, setGameInProgress } from '../store/gameSlice';
import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';

const RoomScreen = ({ roomId, onStartGame, onLeaveRoom }) => {
  const dispatch = useDispatch();
  const players = useSelector((state) => state.game.players);
  const playerName = useSelector((state) => state.game.playerName);
  const gameInProgress = useSelector((state) => state.game.gameInProgress);
  const [error, setError] = useState(null);
  const [copySuccess, setCopySuccess] = useState('');
  const wsRef = useRef(null);

  const leaveRoom = async () => {
    try {
      const response = await axios.post(`${process.env.REACT_APP_API_BASE_URL}/room/${roomId}/leave`, {}, { withCredentials: true });
      console.log('Leave room response:', response.data);
      dispatch(updatePlayers(response.data.players)); // サーバーから返された最新のプレイヤーリストで更新
      onLeaveRoom();
    } catch (error) {
      console.error('Error leaving room:', error);
      setError('部屋から退出できませんでした。もう一度お試しください。');
    }
  };

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
        } else if (data.type === 'game_started') {
          dispatch(updateGameState(data.game_state));
          dispatch(setGameInProgress(true));
          console.log('Game started: gameInProgress set to true');
          onStartGame(); // ゲーム開始メッセージを受信したら画面遷移
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
  }, [roomId, dispatch, onStartGame]);

  const startGame = async () => {
    try {
      const response = await axios.post(`${process.env.REACT_APP_API_BASE_URL}/room/${roomId}/start`);
      if (response.data.error) {
        setError(response.data.error);
      } else {
        setError(null); // エラーがない場合はエラーをクリア
        dispatch(setGameInProgress(true));
        console.log('Game started: gameInProgress set to true');
        onStartGame(); // onStartGame()を呼び出す
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

  console.log(`Rendering RoomScreen: gameInProgress = ${gameInProgress}`);

  return (
    <div className="p-4">
      <h2 className="text-xl mb-4">部屋 {roomId}</h2>
      <div className="flex items-center mb-4">
        <button
          onClick={copyRoomId}
          className="bg-blue-500 text-white p-2 rounded mr-2"
        >
          IDをコピー
        </button>
        {copySuccess && <span className="text-green-500">{copySuccess}</span>}
      </div>
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
        {error && <div className="text-red-500">{error}</div>}
        <button
          onClick={startGame}
          className={`bg-green-500 text-white p-2 rounded mt-4 ${(players.length < 2 || gameInProgress) ? 'opacity-50 cursor-not-allowed' : ''}`}
          disabled={!players || players.length < 2 || gameInProgress}
        >
          ゲーム開始
        </button>
        {gameInProgress && <div className="text-yellow-500 mt-2">ゲームが進行中です</div>}
        {(!players || players.length < 2) && <div className="text-yellow-500 mt-2">ゲームを開始するには最低2人のプレイヤーが必要です</div>}
        <button
          onClick={leaveRoom}
          className="bg-red-500 text-white p-2 rounded mt-4 ml-4"
        >
          部屋を退出
        </button>
      </div>
    </div>
  );
};

export default RoomScreen;
