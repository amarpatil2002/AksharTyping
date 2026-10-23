import axios from "axios";
import { appConfig } from "../../app/config";

export const api = axios.create({
  baseURL: appConfig.apiBaseUrl,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});
