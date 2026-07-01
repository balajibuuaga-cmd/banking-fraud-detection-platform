import { useState } from "react";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8080/api";

export default function Login({ onLogin }) {
    const [email, setEmail] = useState("import@test.com");
    const [password, setPassword] = useState("password123");

    const handleLogin = async (e) => {
        e.preventDefault();

        const response = await fetch(`${API_URL}/auth/login`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                email,
                password
            })
        });

        if (!response.ok) {
            alert("Invalid login");
            return;
        }

        const data = await response.json();

        localStorage.setItem("token", data.token);
        localStorage.setItem("role", data.role);
        localStorage.setItem("fullName", data.fullName);

        onLogin(data);
    };

    return (
        <div className="login-page">
            <form className="login-card" onSubmit={handleLogin}>
                <h1>FraudOps Login</h1>
                <p>Secure analyst access</p>

                <input
                    type="email"
                    value={email}
                    placeholder="Email"
                    onChange={(e) => setEmail(e.target.value)}
                />

                <input
                    type="password"
                    value={password}
                    placeholder="Password"
                    onChange={(e) => setPassword(e.target.value)}
                />

                <button type="submit">Login</button>
            </form>
        </div>
    );
}
