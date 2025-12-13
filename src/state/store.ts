import { combineReducers, configureStore } from "@reduxjs/toolkit";
import { useDispatch } from "react-redux";
import { persistReducer } from "redux-persist";
import localStorage from "redux-persist/es/storage";
import apiSlice from "./api/apiSlice";
import loginInfoSlice from "./slices/loginInfoSlice";
import manualFixturesUISlice from "./features/manualFixtures/manualFixturesUISlice";

const persistConfig = {
    key: "root",
    version: 1,
    storage: localStorage,
};

const rootReducer = combineReducers({
    [apiSlice.reducerPath]: apiSlice.reducer,
    loginInfo: loginInfoSlice,
    manualFixturesUI: manualFixturesUISlice,
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
