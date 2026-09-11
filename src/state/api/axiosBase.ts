import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";
import { selectLoginInfo } from "../slices/loginInfoSlice";
import store from "../store";
import { isAuthFree, refreshSession } from "./sessionManager";

// Create an axios instance
const axiosApi = axios.create({
    baseURL: process.env.REACT_APP_API_URL, // Your API URL
});

/** Marks a request already retried once, so a second 401 is treated as final. */
type RetriableConfig = InternalAxiosRequestConfig & { _retried?: boolean };

// Add a request interceptor
axiosApi.interceptors.request.use(
    (config) => {
        // Get the token from your Redux store
        const state = store.getState();
        const loginInfo = selectLoginInfo(state);

        const token = loginInfo.token; // Assuming you store the token in loginInfo.token

        // If token exists, add it to headers
        if (token && !isAuthFree(config.url)) {
            config.headers.Authorization = `Bearer ${token}`;
        }

        return config;
    },
    (error) => {
        // Handle request errors
        return Promise.reject(error);
    }
);

/**
 * Turns an expired access token into a renewal the caller never sees: the request that hit the 401
 * is replayed with a fresh token, and only a renewal that genuinely fails ends the session.
 */
axiosApi.interceptors.response.use(
    (response) => response, // Return the response if successful
    async (error: AxiosError) => {
        const original = error.config as RetriableConfig | undefined;

        const renewable =
            error.response?.status === 401 &&
            original &&
            !original._retried &&
            !isAuthFree(original.url);
        if (!renewable) {
            return Promise.reject(error);
        }

        original._retried = true;
        const token = await refreshSession();
        if (!token) {
            // Nothing to retry with. `refreshSession` has already ended the session itself if the
            // refresh token was genuinely gone, expired or revoked; a null with the session still
            // intact means the renewal call simply couldn't be reached (e.g. the API waking up
            // after sitting idle for hours) - fail this one request rather than the whole session.
            return Promise.reject(error);
        }

        return axiosApi(original);
    }
);

export default axiosApi;
