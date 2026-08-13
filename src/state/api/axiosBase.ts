import axios from "axios";
import { removeUser, selectLoginInfo } from "../slices/loginInfoSlice";
import store from "../store";

/**
 * Pages reachable without signing in. A 401 raised while the user is on one of these must not drag
 * them to the login screen - the emailed RSVP and password-reset links are followed precisely by
 * people who cannot sign in, and bouncing them would break the only route they have.
 */
const PUBLIC_PATHS = ["/login", "/rsvp", "/forgot-password", "/password-reset", "/auction/register/"];

const isOnPublicPage = () =>
    PUBLIC_PATHS.some((path) => window.location.pathname.startsWith(path));

// Create an axios instance
const axiosApi = axios.create({
    baseURL: process.env.REACT_APP_API_URL, // Your API URL
});

// Add a request interceptor
axiosApi.interceptors.request.use(
    (config) => {
        // Get the token from your Redux store
        const state = store.getState();
        const loginInfo = selectLoginInfo(state);

        const token = loginInfo.token; // Assuming you store the token in loginInfo.token

        // If token exists, add it to headers
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }

        return config;
    },
    (error) => {
        // Handle request errors
        return Promise.reject(error);
    }
);

// Optionally, add a response interceptor to handle any response errors globally
axiosApi.interceptors.response.use(
    (response) => response, // Return the response if successful
    (error) => {
        // Handle unauthorized errors globally (e.g., token expiration)
        if (error.response && error.response.status === 401 && !isOnPublicPage()) {
            // Clear the session *before* redirecting. The token is persisted by redux-persist and
            // survives the page load, so a bare redirect would land on an app that still believes
            // it is signed in, fire the same request, 401 again and reload forever.
            store.dispatch(removeUser());
            localStorage.removeItem("tokenContent");
            window.location.href = "/login";
        }

        return Promise.reject(error);
    }
);

export default axiosApi;
