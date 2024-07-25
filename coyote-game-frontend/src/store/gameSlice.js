import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  roomId: null,
  playerName: null,
  players: [],
  gameStarted: false,
  currentTurn: null,
  currentCard: null,
};

export const gameSlice = createSlice({
  name: 'game',
  initialState,
  reducers: {
    setRoomId: (state, action) => {
      state.roomId = action.payload;
    },
    setPlayerName: (state, action) => {
      state.playerName = action.payload;
    },
    updateGameState: (state, action) => {
      return { ...state, ...action.payload, gameStarted: true };
    },
    updatePlayers: (state, action) => {
      state.players = action.payload;
    },
  },
});

export const { setRoomId, setPlayerName, updateGameState, updatePlayers } = gameSlice.actions;

export default gameSlice.reducer;
