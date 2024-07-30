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
  const [gameEndButtonVisible, setGameEndButtonVisible] = useState(false);
  const playerName = useSelector((state) => state.game.playerName);
  const wsRef = useRef(null);

  useEffect(() => {
    const fetchCards = async () => {
      try {
        const response = await axios.get(`http://localhost:8000/room/${roomId}/cards`);
        setCards(response.data.cards);
      } catch (error) {
        console.error('Error fetching cards:', error);
      }
    };

    fetchCards();
  }, [roomId]);

  useEffect(() => {
    wsRef.current = new WebSocket(`ws://localhost:8000/ws/${roomId}`);

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
    wsRef.current.send(JSON.stringify({ type: 'show_card' }));
  };

  const handleCoyote = async () => {
    try {
      const response = await axios.post(`http://localhost:8000/room/${roomId}/coyote`);
      wsRef.current.send(JSON.stringify({ type: 'coyote', totalValue: response.data.totalValue }));
    } catch (error) {
      console.error('Error ending game:', error);
    }
  };

  const handleGameEnd = async () => {
    try {
      await axios.post(`http://localhost:8000/room/${roomId}/end_game`);
      dispatch(setGameInProgress(false));
      wsRef.current.send(JSON.stringify({ type: 'end_game' }));
    } catch (error) {
      console.error('Error ending game:', error);
    }
  };

  const playerCard = cards.find(card => card.playerName === playerName);

  return (
    <div className="p-4">
      {cardButtonVisible && (
        <button onClick={handleShowCard} className="bg-blue-500 text-white p-2 rounded mt-4">
          Show My Card
        </button>
      )}
      {countdown !== null && (
        <div className="mt-4">
          <p>{countdown}</p>
        </div>
      )}
      {showCard && playerCard && (
        <div className="mt-4">
          <p>{playerCard.card}</p>
        </div>
      )}
      {coyoteButtonVisible && (
        <button onClick={handleCoyote} className="bg-red-500 text-white p-2 rounded mt-4">
          コヨーテ!
        </button>
      )}
      {totalValue !== null && (
        <div className="mt-4">
          <h3 className="text-lg mb-2">Total Value of Cards: {totalValue}</h3>
        </div>
      )}
      {gameEndButtonVisible && (
        <button onClick={handleGameEnd} className="bg-green-500 text-white p-2 rounded mt-4">
          ゲーム終了
        </button>
      )}
    </div>
  );
};

export default GameScreen;