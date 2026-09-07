import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { RootState } from "../store";

interface LoginInfoState {
    token: string;
    /**
     * The long-lived half of the login, exchanged for a new access token when that one expires. Held
     * here as well as in `localStorage` so a renewal reaches the outgoing request that triggered it.
     */
    refreshToken: string;
    username: string;
    email: string;
    userId: string;
    image?: string;
    roles: string[];
    resetPassword?: boolean;
}

const initialState: LoginInfoState = {
    token: "",
    refreshToken: "",
    username: "",
    email: "",
    userId: "",
    image: "",
    roles: [""],
};

export const loginInfoSlice = createSlice({
    name: "loginInfo",
    initialState,
    reducers: {
        setAllData(state, action: PayloadAction<LoginInfoState>) {
            state.token = action.payload.token;
            // Sessions stored before the app understood refresh tokens have no such field.
            state.refreshToken = action.payload.refreshToken ?? "";
            state.username = action.payload.username;
            state.email = action.payload.email;
            state.userId = action.payload.userId;
            state.roles = action.payload.roles;
            state.image = action.payload.image;
            state.resetPassword = action.payload.resetPassword;
        },
        setToken: (state, action: PayloadAction<string>) => {
            state.token = action.payload;
        },
        /** Applies a renewed pair, leaving the rest of the session untouched. */
        setTokens: (state, action: PayloadAction<{ token: string; refreshToken: string }>) => {
            state.token = action.payload.token;
            state.refreshToken = action.payload.refreshToken;
        },
        setUsername: (state, action: PayloadAction<string>) => {
            state.username = action.payload;
        },
        setEmail: (state, action: PayloadAction<string>) => {
            state.email = action.payload;
        },
        setUserId: (state, action: PayloadAction<string>) => {
            state.userId = action.payload;
        },
        setRoles: (state, action: PayloadAction<string[]>) => {
            state.roles = action.payload;
        },
        setImage: (state, action: PayloadAction<string>) => {
            state.image = action.payload;
        },
        setResetPassword: (state, action: PayloadAction<boolean>) => {
            state.resetPassword = action.payload;
        },
        removeUser: (state) => {
            return {
                ...state,
                token: "",
                refreshToken: "",
                username: "",
                email: "",
                userId: "",
                roles: [""],
                image: "",
                resetPassword: false,
            };
        },
    },
});

export const {
    setAllData,
    setToken,
    setTokens,
    setUsername,
    setEmail,
    setUserId,
    setRoles,
    setImage,
    setResetPassword,
    removeUser,
} = loginInfoSlice.actions;
export default loginInfoSlice.reducer;

export const selectLoginInfo = (state: RootState) => state.loginInfo;
export const selectToken = (state: RootState) => state.loginInfo.token;
export const selectRefreshToken = (state: RootState) => state.loginInfo.refreshToken;
export const selectUserName = (state: RootState) => state.loginInfo.username;
export const selectUserEmail = (state: RootState) => state.loginInfo.email;
export const selectUserId = (state: RootState) => state.loginInfo.userId;
export const selectUserRoles = (state: RootState) => state.loginInfo.roles;
export const selectUserImage = (state: RootState) => state.loginInfo.image;
export const selectResetPassword = (state: RootState) => state.loginInfo.resetPassword;
