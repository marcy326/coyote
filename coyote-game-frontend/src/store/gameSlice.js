import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  roomId: null,
  playerName: '',
  players: [],
  gameStarted: false,
  gameInProgress: false,
  currentTurn: 0,
  lastBid: 0,
  biddingNum: 1,
  coyoteResult: null,
  randomOrder: [],
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
    setCurrentTurn(state, action) {
      state.currentTurn = action.payload;
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
      const { room } = action.payload.game_state;
      state.players = room.players;
      state.currentTurn = room.current_turn;
      state.gameStarted = room.game_started;
      state.gameInProgress = room.game_in_progress;
      state.currentTurn = room.current_turn;
      state.lastBid = room.last_bid;
      state.randomOrder = room.random_order;
    },
    setGameInProgress(state, action) {
      state.gameInProgress = action.payload;
    },
    setLastBid(state, action) {
      state.lastBid = action.payload;
    },
    setBiddingNum(state, action) {
      state.biddingNum = action.payload;
    },
    setCoyoteResult(state, action) { // コヨーテの結果を設定するためのアクションを追加
      state.coyoteResult = action.payload;
    },
    resetGame(state) {
      state.gameStarted = false;
      state.gameInProgress = false;
      state.currentTurn = 0;
      state.lastBid = 0;
      state.biddingNum = 1;
      state.coyoteResult = null;
      state.randomOrder = [];
    }
  }
});

export const {
  setRoomId,
  setPlayerName,
  setCurrentTurn,
  updatePlayers,
  addPlayer,
  removePlayer,
  updateGameState,
  setGameInProgress,
  setLastBid,
  setBiddingNum,
  setCoyoteResult,
  resetGame
} = gameSlice.actions;

export default gameSlice.reducer;