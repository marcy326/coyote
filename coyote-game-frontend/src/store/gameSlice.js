import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  roomId: null,
  playerName: '',
  players: [],
  gameStarted: false,
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
      state.players = action.payload;
    },
    updateGameState(state, action) {
      state.gameStarted = action.payload.gameStarted;
      state.currentTurn = action.payload.currentTurn;
      state.currentCard = action.payload.currentCard;
    }
  }
});

export const { setRoomId, setPlayerName, updatePlayers, updateGameState } = gameSlice.actions;
export default gameSlice.reducer;
