export const showBdLocalTime = (timeString: string) => {
    if (!timeString) return '';

    const localTime = new Date(timeString);
    const bdLocalTime = new Date(localTime.getTime() + 6 * 60 * 60 * 1000); // Adjusting to GMT +6

    return bdLocalTime.toLocaleString("en-GB", {timeZone: "Asia/Dhaka"});
};