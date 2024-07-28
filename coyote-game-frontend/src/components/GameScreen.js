import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import { useSelector } from 'react-redux';

const GameScreen = ({ roomId }) => {
  const [cards, setCards] = useState([]);
  const [showCard, setShowCard] = useState(false);
  const [totalValue, setTotalValue] = useState(null);
  const [countdown, setCountdown] = useState(null);
  const [cardButtonVisible, setCardButtonVisible] = useState(true);
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

    wsRef.current.onmessage = (event) => {
      const data = JSON.parse(event.data);
      console.log('Received WebSocket message:', data);
      if (data.type === 'show_card_countdown') {
        setCountdown(data.countdown);
        setCardButtonVisible(false);
      } else if (data.type === 'show_card') {
        setShowCard(true);
        setCountdown(null);
      } else if (data.type === 'coyote') {
        setTotalValue(data.totalValue);
      }
    };

    return () => {
      wsRef.current.close();
    };
  }, [roomId]);

  const handleShowCard = () => {
    wsRef.current.send(JSON.stringify({ type: 'show_card' }));
  };

  const handleCoyote = async () => {
    try {
      const response = await axios.post(`http://localhost:8000/room/${roomId}/coyote`);
      // setTotalValue(response.data.totalValue);
      wsRef.current.send(JSON.stringify({ type: 'coyote', totalValue: response.data.totalValue }));
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
          <h3 className="text-lg mb-2">Cards will be shown in: {countdown}</h3>
        </div>
      )}
      {showCard && playerCard && (
        <div className="mt-4">
          <h3 className="text-lg mb-2">Your Card:</h3>
          <p>{playerCard.card}</p>
        </div>
      )}
      {showCard && (
        <button onClick={handleCoyote} className="bg-red-500 text-white p-2 rounded mt-4">
          コヨーテ!
        </button>
      )}
      {totalValue !== null && (
        <div className="mt-4">
          <h3 className="text-lg mb-2">Total Value of Cards: {totalValue}</h3>
        </div>
      )}
    </div>
  );
};

export default GameScreen;