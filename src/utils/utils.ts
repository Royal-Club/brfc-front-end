export const showBdLocalTime = (timeString: string) => {
    if (!timeString) return "";

    const localTime = new Date(timeString);
    const bdLocalTime = new Date(localTime.getTime() + 6 * 60 * 60 * 1000); // Adjusting to GMT +6

    return bdLocalTime.toLocaleString("en-GB", { timeZone: "Asia/Dhaka" });
};



export const checkTockenValidity = (tokenContent: string) => {
    if (!tokenContent) return false;

    const contentData = JSON.parse(tokenContent);

    const decodedToken = JSON.parse(atob(contentData.token.split(".")[1]));
    const now = new Date();
    const exp = new Date(decodedToken.exp * 1000);
    if (exp < now) return false;
    return true;
};
