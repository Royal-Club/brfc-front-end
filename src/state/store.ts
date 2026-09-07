import { combineReducers, configureStore } from "@reduxjs/toolkit";
import { useDispatch } from "react-redux";
import { persistReducer } from "redux-persist";
import localStorage from "redux-persist/es/storage";
import apiSlice from "./api/apiSlice";
import loginInfoSlice, { removeUser, setTokens } from "./slices/loginInfoSlice";
import { configureSession } from "./api/sessionManager";
import manualFixturesUISlice from "./features/manualFixtures/manualFixturesUISlice";
import tournamentUISlice from "./features/tournaments/tournamentUISlice";
import teamChatUISlice from "./features/teamChat/teamChatUISlice";

const persistConfig = {
    key: "root",
    version: 1,
    storage: localStorage,
    // teamChatUI is deliberately absent: which room you had open is a fact about this visit, not a
    // preference worth restoring over the dashboard at next login.
    whitelist: ["loginInfo", "manualFixturesUI", "tournamentUI"], // Persist these slices
};

const rootReducer = combineReducers({
    [apiSlice.reducerPath]: apiSlice.reducer,
    loginInfo: loginInfoSlice,
    manualFixturesUI: manualFixturesUISlice,
    tournamentUI: tournamentUISlice,
    teamChatUI: teamChatUISlice,
});

const persistedReducer = persistReducer(persistConfig, rootReducer);

const store = configureStore({
    reducer: persistedReducer,
    middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware({
            serializableCheck: false,
        }).concat(apiSlice.middleware),
});

// Hand the session manager its way back into the store. It is injected rather than imported so the
// manager stays free of a cycle back through this module, which the API layers import.
configureSession({
    onTokensRenewed: (tokens) => store.dispatch(setTokens(tokens)),
    onSessionEnded: () => store.dispatch(removeUser()),
});

export type AppDispatch = typeof store.dispatch;
export type RootState = ReturnType<typeof store.getState>;
export const useAppDispatch = () => useDispatch();
export default store;
