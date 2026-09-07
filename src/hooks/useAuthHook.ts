import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import {
    selectLoginInfo,
    setAllData,
    removeUser,
    setImage,
} from "../state/slices/loginInfoSlice";
import { clearStoredCredentials } from "../utils/utils";
import { revokeRefreshToken } from "../state/api/sessionManager";

export const useAuthHook = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const loginInfo = useSelector(selectLoginInfo);

    const login = (tokenContent: string) => {
        localStorage.setItem("tokenContent", tokenContent);
        const contentData = JSON.parse(tokenContent);
        dispatch(setAllData(contentData));
        dispatch(
            setImage(
                "https://giftolexia.com/wp-content/uploads/2015/11/dummy-profile.png"
            )
        );
    };

    const logout = async () => {
        // Revoke the refresh token server-side first, while it is still readable. Clearing only this
        // browser would leave a credential live on the server for the rest of its window, spendable
        // by any copy of it that got out.
        await revokeRefreshToken();

        // Clear both localStorage token and remembered credentials
        localStorage.removeItem("tokenContent");
        clearStoredCredentials(); // Clear cookies with remembered credentials
        dispatch(removeUser());
        navigate("/");
    };

    /**
     * Drops an expired session without treating it as a sign-out.
     *
     * Deliberately different from `logout` on two counts: it keeps any remembered credentials,
     * because a session running out is not the user asking to be forgotten, and it does not
     * navigate - callers use it during render, where a navigation would be a side effect at the
     * wrong moment.
     */
    const clearSession = () => {
        localStorage.removeItem("tokenContent");
        dispatch(removeUser());
    };

    const isAuthenticated = () => {
        return !!loginInfo?.token;
    };

    return {
        login,
        logout,
        clearSession,
        isAuthenticated,
        user: loginInfo,
    };
};
