import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { RootState } from "../store";
interface LoginInfoState {
    accessToken: string;
    name: string;
    email: string;
    googleId: string;
    image: string;
    id: string;
    role: string;
}
export const loginInfoSlice = createSlice({
    name: "loginInfo",
    initialState: {
        accessToken: "",
        name: "",
        email: "",
        googleId: "",
        image: "",
        id: "",
        role: "",
    },
    reducers: {
        setAccessToken: (state, action: PayloadAction<string>) => {
            state.accessToken = action.payload;
        },
        setUsername: (state, action: PayloadAction<string>) => {
            state.name = action.payload;
        },
        setEmail: (state, action: PayloadAction<string>) => {
            state.email = action.payload;
        },
        setGoogleId: (state, action: PayloadAction<string>) => {
            state.googleId = action.payload;
        },
        setImage: (state, action: PayloadAction<string>) => {
            state.image = action.payload;
        },
        setId: (state, action: PayloadAction<string>) => {
            state.id = action.payload;
        },
        setUser: (state, action: PayloadAction<LoginInfoState>) => {
            return { ...state, ...action.payload };
        },
        setRole: (state, action: PayloadAction<string>) => {
            state.role = action.payload;
            return state;
        },
        removeUser: (state) => {
            return {
                ...state,
                accessToken: "",
                username: "",
                email: "",
                googleId: "",
                image: "",
                id: "",
                role: "",
            };
        },
    },
});

export const { setAccessToken, setUsername, setUser, removeUser, setRole } =
    loginInfoSlice.actions;
export default loginInfoSlice.reducer;

export const selectLoginInfo = (state: RootState) => state?.loginInfo;
export const selectAccessToken = (state: RootState) =>
    state?.loginInfo?.accessToken;
export const selectUserName = (state: RootState) => state?.loginInfo?.name;
export const selectUserEmail = (state: RootState) => state?.loginInfo?.email;
export const selectUserGoogleId = (state: RootState) =>
    state?.loginInfo?.googleId;
export const selectUserImage = (state: RootState) => state?.loginInfo?.image;
export const selectUserId = (state: RootState) => state?.loginInfo?.id;
