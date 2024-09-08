import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import {
    selectLoginInfo,
    setAllData,
    removeUser,
    setImage,
} from "../state/slices/loginInfoSlice";

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

    const logout = () => {
        localStorage.removeItem("tokenContent");
        dispatch(removeUser());
        navigate("/");
    };

    const isAuthenticated = () => {
        return !!loginInfo?.token;
    };

    return {
        login,
        logout,
        isAuthenticated,
        user: loginInfo,
    };
};
