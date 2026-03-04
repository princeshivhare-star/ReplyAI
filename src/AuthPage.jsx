import { useState } from "react";
import { supabase } from "./lib/supabase";

export default function AuthPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSignup = async () => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      alert(error.message);
    } else {
      alert("Signup successful! Now login.");
    }
  };

  const handleLogin = async () => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      alert(error.message);
    }
  };

  return (
    <div
      style={{
        height: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        background: "#111",
        color: "white",
      }}
    >
      <div style={{ width: 300 }}>
        <h2>ReplyAI Login</h2>

        <input
          type="email"
          placeholder="Email"
          style={{ width: "100%", padding: 10, marginBottom: 10 }}
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          type="password"
          placeholder="Password"
          style={{ width: "100%", padding: 10, marginBottom: 10 }}
          onChange={(e) => setPassword(e.target.value)}
        />

        <button
          style={{
            width: "100%",
            padding: 10,
            marginBottom: 10,
            background: "#4CAF50",
            color: "white",
            border: "none",
          }}
          onClick={handleSignup}
        >
          Sign Up
        </button>

        <button
          style={{
            width: "100%",
            padding: 10,
            background: "#2196F3",
            color: "white",
            border: "none",
          }}
          onClick={handleLogin}
        >
          Login
        </button>
      </div>
    </div>
  );
}
