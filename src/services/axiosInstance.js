import axios from "axios";
let token = localStorage.getItem("auth-token");
axios.defaults.headers.common["uuid"] = token;
// axios.defaults.baseURL = "http://147.182.232.146:3003";
axios.defaults.baseURL = "http://localhost:8000";
axios.defaults.headers.post["Content-Type"] = "application/json";
let axiosInstance = axios;
export default axiosInstance;
