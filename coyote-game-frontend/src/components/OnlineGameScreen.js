import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import { useSelector, useDispatch } from 'react-redux';
import { setGameInProgress, updateGameState, setCurrentTurn, setLastBid, setBiddingNum, setCoyoteResult, resetGame } from '../store/gameSlice';

const OnlineGameScreen = ({ roomId, onGameEnd }) => {
  const dispatch = useDispatch();
  const [cards, setCards] = useState([]);
  const [isCoyoteAvailable, setIsCoyoteAvailable] = useState(false);
  const playerName = useSelector((state) => state.game.playerName);
  const players = useSelector((state) => state.game.players);
  const currentTurn = useSelector((state) => state.game.currentTurn);
  const lastBid = useSelector((state) => state.game.lastBid);
  const biddingNum = useSelector((state) => state.game.biddingNum);
  const coyoteResult = useSelector((state) => state.game.coyoteResult);
  const randomOrder = useSelector((state) => state.game.randomOrder);
  const wsRef = useRef(null);

  useEffect(() => {
    const fetchCards = async () => {
      try {
        const response = await axios.get(`${process.env.REACT_APP_API_BASE_URL}/room/${roomId}/cards`);
        setCards(response.data.cards);
      } catch (error) {
        console.error('Error fetching cards:', error);
      }
    };

    fetchCards();
  }, [roomId]);

  useEffect(() => {
    wsRef.current = new WebSocket(`${process.env.REACT_APP_WS_BASE_URL}/ws/${roomId}`);

    wsRef.current.onopen = () => {
      console.log('WebSocket connected');
    };

    wsRef.current.onmessage = (event) => {
      const data = JSON.parse(event.data);
      console.log('Received WebSocket message:', data);
      if (data.type === 'bid') {
        dispatch(setLastBid(data.biddingNum));
        dispatch(setBiddingNum(data.biddingNum+1));
        setIsCoyoteAvailable(true);
        dispatch(setCurrentTurn(data.nextTurn));
      } else if (data.type === 'coyote') {
        dispatch(setCoyoteResult(data));
      } else if (data.type === 'game_ended') {
        dispatch(resetGame());
        onGameEnd();
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
  }, [roomId, onGameEnd]);

  const handleBid = async () => {
    try {
      const response = await axios.post(`${process.env.REACT_APP_API_BASE_URL}/room/${roomId}/bid`, { bid: biddingNum });
      console.log('Bid placed successfully:', response.data);
    } catch (error) {
      console.error('Error placing bid:', error);
    }
  };

  const handleCoyote = async () => {
    try {
      const response = await axios.post(`${process.env.REACT_APP_API_BASE_URL}/room/${roomId}/coyote_online`);
      console.log('Coyote successfully:', response.data);
    } catch (error) {
      console.error('Error placing bid:', error);
    }
  };

  const incrementBid = () => {
    dispatch(setBiddingNum(biddingNum + 1));
  };

  const decrementBid = () => {
    if (biddingNum > lastBid + 1) {
      dispatch(setBiddingNum(biddingNum - 1));
    }
  };

  const handleGameEnd = async () => {
    try {
      await axios.post(`${process.env.REACT_APP_API_BASE_URL}/room/${roomId}/end_game`);
      dispatch(setGameInProgress(false));
      wsRef.current.send(JSON.stringify({ type: 'end_game' }));
    } catch (error) {
      console.error('Error ending game:', error);
    }
  };


  console.log('randomOrder:', randomOrder);
  console.log('randomOrder[currentTurn]:', randomOrder[currentTurn]);
  const isMyTurn = players[randomOrder[currentTurn]]?.name === playerName;
  console.log('Player Name:', playerName);
  console.log('Current Turn:', currentTurn);
  console.log('Players:', players);
  console.log('Is My Turn:', isMyTurn);

  return (
    <div className="container">
      <div className="header">
        <h2 className="text-xl mb-4">Game Room: {roomId}</h2>
      </div>
      <div className="card">
        <h3 className="text-lg mb-2">他のプレイヤーのカード:</h3>
        <ul>
          {cards.map((card, index) => (
            card.playerName !== playerName && (
              <li key={index}>
                {card.playerName}: {card.card}
              </li>
            )
          ))}
        </ul>
        <div className="mt-4">
          <h3 className="text-lg mb-2">現在の宣言: {lastBid}</h3>
          {isMyTurn && <h3 className="text-lg mb-2">宣言する数字: {biddingNum}</h3>}
          <div className="button-group">
            <button onClick={decrementBid} className="bg-gray text-white p-2 rounded" disabled={!isMyTurn || coyoteResult}>-</button>
            <button onClick={incrementBid} className="bg-gray text-white p-2 rounded" disabled={!isMyTurn || coyoteResult}>+</button>
            <button onClick={handleBid} className="bg-green text-white p-2 rounded" disabled={!isMyTurn || coyoteResult}>決定</button>
            <button onClick={handleCoyote} className="bg-red text-white p-2 rounded" disabled={!isMyTurn || coyoteResult || !isCoyoteAvailable}>コヨーテ</button>
          </div>
        </div>
        {!isMyTurn && <p className="text-red mt-2">現在の手番: {players[currentTurn]?.name}</p>}
        {coyoteResult && (
          <>
            <p className="text-blue mt-2">合計値: {coyoteResult.totalValue}</p>
            <p className="text-blue mt-2">コヨーテの結果: {coyoteResult.result}</p>
            <p className="text-blue mt-2">{coyoteResult.loser} アウト！</p>
            <button onClick={handleGameEnd} className="bg-red text-white p-2 rounded mt-4">ゲーム終了</button>
          </>
        )}
      </div>
    </div>
  );
};

export default OnlineGameScreen;