import axiosInstance from "./axiosInstance";
import { jwtDecode } from "jwt-decode";

class APIService {
  get = (url, data) => axiosInstance.get(url, data);
  post = (url, data) => axiosInstance.post(url, data);
  put = (url, data) => axiosInstance.put(url, data);
  delete = (url) => axiosInstance.delete(url);

  // Check User Log or not
  isLoggedIn = () => {
    return localStorage.getItem("auth-token") ? true : false;
  };

  //Get Logged In user
  getLoggedInUser = (jwt) => {
    try {
      return jwtDecode(jwt);
    } catch (ex) {
      return null;
    }
  };
}

let apiService = new APIService();
export default apiService;
