import "./App.css";
import SignIn from "./components/Pages/SignIn";
import SignUp from "./components/Pages/SignUp";
import { useEffect } from "react";
import { Routes, Route, useNavigate, useLocation } from "react-router-dom";
import apiService from "./services/ApiService";
import Layout from "./Layout";
import { Toaster } from "react-hot-toast";
import ForgotPassword from "./components/Pages/ForgotPassword";
import VerifyOtp from "./components/Pages/verifyOtp";
import ChangePassword from "./components/Pages/ChangePassword";

function App() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  let isUser = apiService.isLoggedIn();

  useEffect(() => {
    if (!isUser) {
      return navigate("/signIn");
    }
  }, [isUser]);

  useEffect(() => {
    if (pathname === "/") {
      navigate("/signIn");
    }
  }, []);

  return (
    <>
      <Toaster
        position="top-center"
        reverseOrder={false}
        containerClassName="overflow-auto"
      />
      <Routes>
        <Route path="/signIn" element={<SignIn />} />
        <Route path="/signUp" element={<SignUp />} />
        <Route path="/forgotPassword" element={<ForgotPassword />} />
        <Route path="/verifyOtp" element={<VerifyOtp />} />
        <Route path="/changePassword" element={<ChangePassword />} />
        {isUser && (
          <Route element={<Layout />}>
            {/* <Route path="/dashboard" element={<Dashboard />} /> */}
          </Route>
        )}
      </Routes>
    </>
  );
}

export default App;
