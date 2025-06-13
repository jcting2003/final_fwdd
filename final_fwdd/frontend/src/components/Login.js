// frontend/src/components/Login.js

import React, { useState, useEffect } from "react";
import "../CSS/Login.css";
import { useNavigate, useLocation  } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getCurrentUser as apiGetCurrentUser } from "../api/auth";


export default function Login() {
  const navigate = useNavigate();
  const { user, login: doLogin, signup: doSignup } = useAuth();
  const location = useLocation();
  
  // if we were redirected here, location.state.from holds the original URL
  const from = location.state?.from || "/mainpage";
  
  // If the user is already set, send them to mainpage
  useEffect(() => {
    if (user) {
      navigate(from, { replace: true });
    }
  }, [user, navigate, from]);

  const [mode, setMode] = useState("login");

  // Login form state
  const [loginUsername, setLoginUsername] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  // Signup form state
  const [signupUsername, setSignupUsername] = useState("");
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [signupConfirm, setSignupConfirm] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      await doLogin({ username: loginUsername, password: loginPassword });
      //navigate(from, { replace: true });
    } catch (err) {
      alert(err.message);
    }
  };
  

  const handleSignup = async (e) => {
    e.preventDefault();
    if (signupPassword !== signupConfirm) {
      window.alert("Passwords do not match.");
      return;
    }
    try {
      await doSignup({
        username: signupUsername,
        email: signupEmail,
        password: signupPassword,
      });
      window.alert("Signup successful! Redirecting to login...");
      // reset form and switch back to login mode
      setSignupUsername("");
      setSignupEmail("");
      setSignupPassword("");
      setSignupConfirm("");
      setMode("login");
    } catch (err) {
      console.error("Signup error:", err);
      window.alert(err.message || "Signup failed. Check console.");
    }
  };

  // Helper to build input blocks
  const buildInput = (id, type, label, value, onChange) => (
    <div className="input-block" key={id}>
      <label htmlFor={id}>{label}</label>
      <input
        id={id}
        type={type}
        required
        value={value}
        onChange={onChange}
      />
    </div>
  );

  return (
    <section className="forms-section">
      <h1 className="section-title">PYTHONOPOLY</h1>
      <div className="forms">
        {/* Login panel */}
        <div className={`form-wrapper ${mode === "login" ? "is-active" : ""}`}>
          <button
            type="button"
            className="switcher switcher-login"
            onClick={() => setMode("login")}
          >
            Login
            <span className="underline"></span>
          </button>
          <form className="form form-login" onSubmit={handleLogin}>
            <fieldset>
              <legend>Enter your username and password.</legend>
              {buildInput(
                "login-username",
                "text",
                "Username",
                loginUsername,
                (e) => setLoginUsername(e.target.value)
              )}
              {buildInput(
                "login-password",
                "password",
                "Password",
                loginPassword,
                (e) => setLoginPassword(e.target.value)
              )}
            </fieldset>
            <button type="submit" className="btn-login">
              Login
            </button>
          </form>
        </div>

        {/* Signup panel */}
        <div
          className={`form-wrapper ${mode === "signup" ? "is-active" : ""}`}
        >
          <button
            type="button"
            className="switcher switcher-signup"
            onClick={() => setMode("signup")}
          >
            Sign Up
            <span className="underline"></span>
          </button>
          <form className="form form-signup" onSubmit={handleSignup}>
            <fieldset>
              <legend>Enter username, email, and password to sign up.</legend>
              {buildInput(
                "signup-username",
                "text",
                "Username",
                signupUsername,
                (e) => setSignupUsername(e.target.value)
              )}
              {buildInput(
                "signup-email",
                "email",
                "E-mail",
                signupEmail,
                (e) => setSignupEmail(e.target.value)
              )}
              {buildInput(
                "signup-password",
                "password",
                "Password",
                signupPassword,
                (e) => setSignupPassword(e.target.value)
              )}
              {buildInput(
                "signup-confirm",
                "password",
                "Confirm Password",
                signupConfirm,
                (e) => setSignupConfirm(e.target.value)
              )}
            </fieldset>
            <button type="submit" className="btn-signup">
              Continue
            </button>
          </form>
        </div>
      </div>
    </section>
  );
}
