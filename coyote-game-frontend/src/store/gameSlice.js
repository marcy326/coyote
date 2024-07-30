import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  roomId: null,
  playerName: '',
  players: [],
  gameStarted: false,
  gameInProgress: false,
  currentTurn: '',
  currentCard: ''
};

const gameSlice = createSlice({
  name: 'game',
  initialState,
  reducers: {
    setRoomId(state, action) {
      state.roomId = action.payload;
    },
    setPlayerName(state, action) {
      state.playerName = action.payload;
    },
    updatePlayers(state, action) {
      // プレイヤーリストが配列であることを確認
      if (Array.isArray(action.payload)) {
        state.players = action.payload;
      } else {
        console.error('Invalid players data:', action.payload);
      }
    },
    addPlayer(state, action) {
      const newPlayer = action.payload;
      if (!state.players.some(player => player.id === newPlayer.id)) {
        state.players.push(newPlayer);
      }
    },
    removePlayer(state, action) {
      const playerId = action.payload;
      state.players = state.players.filter(player => player.id !== playerId);
    },
    updateGameState(state, action) {
      state.gameStarted = action.payload.gameStarted;
      state.gameInProgress = action.payload.gameInProgress;
      state.currentTurn = action.payload.currentTurn;
      state.currentCard = action.payload.currentCard;
    },
    setGameInProgress(state, action) {
      state.gameInProgress = action.payload;
    },
    resetGame(state) {
      return initialState;
    }
  }
});

export const {
  setRoomId,
  setPlayerName,
  updatePlayers,
  addPlayer,
  removePlayer,
  updateGameState,
  setGameInProgress,
  resetGame
} = gameSlice.actions;

export default gameSlice.reducer;