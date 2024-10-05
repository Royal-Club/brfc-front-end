import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { RootState } from "../store";
import { API_URL } from "../../settings";
import { message } from "antd";

// Define types for the error response
interface FieldError {
  field: string;
  message: string;
}

interface ApiErrorResponse {
  timeStamp: number;
  statusCode: number;
  status: string;
  message: string;
  errors?: FieldError[];
}

const baseQuery = fetchBaseQuery({
  baseUrl: API_URL,
  prepareHeaders: (headers, { getState }) => {
    const state = getState() as RootState;
    const token = state.loginInfo.token;
    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    }
    return headers;
  },
});

// Custom baseQuery with improved error handling and types
const customBaseQuery: typeof baseQuery = async (args, api, extraOptions) => {
  const result = await baseQuery(args, api, extraOptions);

  // Check if result.error and result.error.data exist
  if (result?.error && result?.error.data) {
    const errorData = result?.error?.data as ApiErrorResponse; // Cast to ApiErrorResponse

    // Destructure the error data with default fallback values
    const {message : errorMessage, errors } = errorData;

    let alertMessage = "";

    // Append specific field errors if available
    if (errors && Array.isArray(errors)) {
      const fieldErrors = errors
        ?.map((err: FieldError) => `${err.message}`)
        .join("\n");
      alertMessage += fieldErrors;
    }else{
      alertMessage = errorMessage;
    }

    // Display the alert
    message.error(alertMessage);
  }

  return result;
};

const apiSlice = createApi({
  reducerPath: "api",
  baseQuery: customBaseQuery, // Use the custom baseQuery
  endpoints: () => ({}),
  tagTypes: [],
});

export default apiSlice;
