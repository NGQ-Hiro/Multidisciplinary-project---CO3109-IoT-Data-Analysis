import axios from "axios";
import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Card, Button } from "../../components";
import { login } from "../../services";
import styles from "./Login.module.css";

export const Login: React.FC = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"admin" | "viewer">("admin");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      await login({ username, password, role });
      navigate("/");
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        setError(
          err.response?.data?.error ||
            "Authentication failed. Please check your credentials.",
        );
      } else {
        setError("An unexpected error occurred. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.loginContainer}>
      <Card className={styles.loginCard} elevation="standard" padding="large">
        <div style={{ textAlign: "center", marginBottom: "var(--space-4)" }}>
          <p className="tech-label" style={{ marginBottom: "var(--space-1)" }}>
            Identity & Access
          </p>
          <h2 style={{ fontSize: "var(--font-size-h1)", margin: 0 }}>
            System Login
          </h2>
          <p
            style={{
              color: "var(--text-secondary)",
              fontSize: "var(--font-size-caption)",
              marginTop: "4px",
            }}
          >
            Enter your credentials to access the SmartAgri dashboard
          </p>
        </div>

        {error && <div className={styles.error}>{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className={styles.formGroup}>
            <label htmlFor="username">Username</label>
            <input
              type="text"
              id="username"
              placeholder="e.g. admin_user"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="role">Access Level</label>
            <select
              id="role"
              value={role}
              onChange={(e) => setRole(e.target.value as "admin" | "viewer")}
            >
              <option value="admin">Administrator (Full Control)</option>
              <option value="viewer">Viewer (Read Only)</option>
            </select>
          </div>

          <div style={{ marginTop: "var(--space-4)" }}>
            <Button type="submit" fullWidth disabled={loading} size="large">
              {loading ? "Authenticating..." : "Sign In to Dashboard"}
            </Button>
          </div>
        </form>

        <div style={{ marginTop: "var(--space-4)", textAlign: "center" }}>
          <p
            style={{
              fontSize: "var(--font-size-caption)",
              color: "var(--text-secondary)",
              marginBottom: "var(--space-2)",
            }}
          >
            Don't have an account?{" "}
            <Link
              to="/register"
              style={{ color: "var(--color-mongo-green)", fontWeight: "700" }}
            >
              Register here
            </Link>
          </p>
          <p style={{ fontSize: "10px", color: "var(--color-cool-gray)" }}>
            Secured by AES-256 Encryption • SmartAgri IoT Platform
          </p>
        </div>
      </Card>
    </div>
  );
};
