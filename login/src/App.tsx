import { useState } from "react";
import "./App.css";

const API_URL = "http://127.0.0.1:8000";

// Change these two URLs if your portals run on different ports.
const OFFICER_PORTAL_URL = "http://localhost:5174";
const CITIZEN_PORTAL_URL = "http://localhost:5175";

type Role = "officer" | "citizen" | null;

function App() {
  const [role, setRole] = useState<Role>(null);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const selectRole = (selectedRole: Role) => {
    setRole(selectedRole);
    setError("");
    setUsername("");
    setPassword("");
  };

  const handleOfficerLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    setError("");
    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/api/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username,
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Invalid username or password");
      }

      // Store authentication token for this browser session
      sessionStorage.setItem("access_token", data.access_token);
      sessionStorage.setItem("role", data.role);

      // Open Officer Portal
      window.location.href = OFFICER_PORTAL_URL;
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Login failed");
      }
    } finally {
      setLoading(false);
    }
  };

  const openCitizenPortal = () => {
    sessionStorage.setItem("role", "citizen");
    window.location.href = CITIZEN_PORTAL_URL;
  };

  return (
    <div className="app">
      <div className="login-card">

        <div className="logo">
          <div className="logo-icon">B</div>
          <div>
            <h1>BHOOMI-INTEL</h1>
            <p>Land Acquisition Intelligence Platform</p>
          </div>
        </div>

        {!role && (
          <>
            <div className="welcome">
              <h2>Welcome</h2>
              <p>Select how you want to access Bhoomi-Intel</p>
            </div>

            <div className="role-container">

              <button
                className="role-card"
                onClick={() => selectRole("officer")}
              >
                <div className="role-icon">👨‍💼</div>

                <div>
                  <h3>Officer</h3>
                  <p>
                    Access project management, GIS,
                    notifications and administration.
                  </p>
                </div>

                <span className="arrow">→</span>
              </button>

              <button
                className="role-card"
                onClick={() => selectRole("citizen")}
              >
                <div className="role-icon">👤</div>

                <div>
                  <h3>Citizen</h3>
                  <p>
                    View projects, notifications,
                    SIA documents and land information.
                  </p>
                </div>

                <span className="arrow">→</span>
              </button>

            </div>
          </>
        )}

        {role === "officer" && (
          <div className="login-section">

            <button
              className="back-button"
              onClick={() => selectRole(null)}
            >
              ← Back
            </button>

            <h2>Officer Login</h2>
            <p className="subtitle">
              Enter your officer credentials
            </p>

            <form onSubmit={handleOfficerLogin}>

              <label>Username</label>

              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter username"
                required
              />

              <label>Password</label>

              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                required
              />

              {error && (
                <div className="error">
                  {error}
                </div>
              )}

              <button
                type="submit"
                className="login-button"
                disabled={loading}
              >
                {loading ? "Authenticating..." : "Login"}
              </button>

            </form>

          </div>
        )}

        {role === "citizen" && (
          <div className="citizen-section">

            <button
              className="back-button"
              onClick={() => selectRole(null)}
            >
              ← Back
            </button>

            <div className="citizen-icon">👤</div>

            <h2>Citizen Portal</h2>

            <p className="subtitle">
              Access public land acquisition information
            </p>

            <button
              className="login-button"
              onClick={openCitizenPortal}
            >
              Continue to Citizen Portal
            </button>

          </div>
        )}

        <div className="footer">
          <span>© 2026 Bhoomi-Intel</span>
          <span>Secure Access</span>
        </div>

      </div>
    </div>
  );
}

export default App;