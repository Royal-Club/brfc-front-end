import { combineReducers, configureStore } from "@reduxjs/toolkit";
import { useDispatch } from "react-redux";
import { persistReducer } from "redux-persist";
import localStorage from "redux-persist/es/storage";
import apiSlice from "./api/apiSlice";
import loginInfoSlice from "./slices/loginInfoSlice";
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

export type AppDispatch = typeof store.dispatch;
export type RootState = ReturnType<typeof store.getState>;
export const useAppDispatch = () => useDispatch();
export default store;
