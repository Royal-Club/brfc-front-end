import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

export const showBdLocalTime = (timeString: string) => {
    if (!timeString) return "";

    const localTime = new Date(timeString);
    const bdLocalTime = new Date(localTime.getTime() + 6 * 60 * 60 * 1000); // Adjusting to GMT +6

    return bdLocalTime.toLocaleString("en-GB", {
        timeZone: "Asia/Dhaka",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
    });
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

/**
 * Function to export data to Excel
 * @param data - The JSON data to be exported
 * @param filename - The name of the Excel file to be saved
 */
export function exportToExcel(data: any[], filename: string) {
    // Create a new workbook
    const workbook = XLSX.utils.book_new();

    // Convert JSON data to worksheet
    const worksheet = XLSX.utils.json_to_sheet(data);

    // Append the worksheet to the workbook
    XLSX.utils.book_append_sheet(workbook, worksheet, "Data");

    // Generate Excel file (XLSX format)
    const excelBuffer = XLSX.write(workbook, {
        bookType: "xlsx",
        type: "array",
    });

    // Save the file using file-saver
    const blob = new Blob([excelBuffer], { type: "application/octet-stream" });
    saveAs(blob, `${filename}.xlsx`);
}

/**
 * Function to export data to CSV
 * @param data - The JSON data to be exported
 * @param filename - The name of the CSV file to be saved
 */
export function exportToCSV(data: any[], filename: string) {
    // Convert JSON data to CSV
    const worksheet = XLSX.utils.json_to_sheet(data);
    const csv = XLSX.utils.sheet_to_csv(worksheet);

    // Save the CSV file
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    saveAs(blob, `${filename}.csv`);
}
