import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import { useSelector, useDispatch } from 'react-redux';
import { setGameInProgress } from '../store/gameSlice';

const GameScreen = ({ roomId, onGameEnd }) => {
  const dispatch = useDispatch();
  const [cards, setCards] = useState([]);
  const [showCard, setShowCard] = useState(false);
  const [totalValue, setTotalValue] = useState(null);
  const [countdown, setCountdown] = useState(null);
  const [cardButtonVisible, setCardButtonVisible] = useState(true);
  const [coyoteButtonVisible, setCoyoteButtonVisible] = useState(false);
  const [revealedCard, setRevealedCard] = useState(null);
  const [gameEndButtonVisible, setGameEndButtonVisible] = useState(false);
  const playerName = useSelector((state) => state.game.playerName);
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
      if (data.type === 'show_card_countdown') {
        setCountdown(data.countdown);
        setCardButtonVisible(false);
      } else if (data.type === 'show_card') {
        setShowCard(true);
        setCountdown(null);
        setCoyoteButtonVisible(true);
      } else if (data.type === 'coyote') {
        setTotalValue(data.totalValue);
        setCoyoteButtonVisible(false);
        setGameEndButtonVisible(true);
        setRevealedCard(data.topCard);
      } else if (data.type === 'game_ended') {
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

  const handleShowCard = () => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'show_card' }));
      console.log('Sent show_card message');
    } else {
      console.error('WebSocket is not open');
    }
  };

  const handleCoyote = async () => {
    try {
      const response = await axios.post(`${process.env.REACT_APP_API_BASE_URL}/room/${roomId}/coyote`);
      const data = response.data;
      wsRef.current.send(JSON.stringify({ type: 'coyote', totalValue: data.totalValue, topCard: data.topCard }));
    } catch (error) {
      console.error('Error ending game:', error);
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

  const playerCard = cards.find(card => card.playerName === playerName);

  return (
    <div className="container">
      <div className="header">
        <h2 className="text-xl mb-4">Game Room: {roomId}</h2>
      </div>
      <div className="card">
        {cardButtonVisible && (
          <button onClick={handleShowCard} className="bg-blue text-white p-2 rounded mt-4">
            ゲームスタート
          </button>
        )}
        {countdown !== null && (
          <div className="countdown">
            <p>{countdown}</p>
          </div>
        )}
        {showCard && playerCard && (
          <div className="card-value">
            <p>{playerCard.card}</p>
          </div>
        )}
        {coyoteButtonVisible && (
          <button onClick={handleCoyote} className="bg-red text-white p-2 rounded mt-4">
            コヨーテ!
          </button>
        )}
        {revealedCard !== null && playerCard.card == '?' && (
          <div className="mt-4">
            <h3 className="text-lg mb-2">?→ {revealedCard}</h3>
          </div>
        )}
        {totalValue !== null && (
          <div className="mt-4">
            <h3 className="text-lg mb-2">合計: {totalValue}</h3>
          </div>
        )}
        {gameEndButtonVisible && (
          <button onClick={handleGameEnd} className="bg-green text-white p-2 rounded mt-4">
            ゲーム終了
          </button>
        )}
      </div>
    </div>
  );
};

export default GameScreen;