import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "PacificPort Terminal — Login",
};

export default async function DemoTerminalLogin({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const params = await searchParams;
  const hasError = params.error === "invalid";

  return (
    <div className="demo-terminal-root">
      <style
        dangerouslySetInnerHTML={{
          __html: `
        .demo-terminal-root {
          font-family: "Courier New", Courier, monospace;
          background: #f5f5f0;
          color: #333;
          min-height: 100vh;
          margin: 0;
          padding: 0;
        }
        .demo-banner {
          background: #fff3cd;
          border-bottom: 1px solid #ffc107;
          color: #856404;
          text-align: center;
          padding: 6px;
          font-size: 12px;
          font-weight: bold;
        }
        .header {
          background: #1a3a5c;
          color: white;
          padding: 16px 20px;
          text-align: center;
        }
        .header .logo { font-size: 22px; font-weight: bold; }
        .header .subtitle { font-size: 13px; opacity: 0.8; margin-top: 4px; }
        .login-box {
          max-width: 420px;
          margin: 50px auto;
          background: white;
          border: 2px solid #777;
          padding: 30px;
          box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        }
        .login-box h2 {
          color: #1a3a5c;
          font-size: 18px;
          margin-top: 0;
          border-bottom: 2px solid #1a3a5c;
          padding-bottom: 8px;
        }
        .login-box label {
          display: block;
          font-size: 13px;
          margin-top: 16px;
          font-weight: bold;
        }
        .login-box input[type="text"],
        .login-box input[type="password"] {
          width: 100%;
          padding: 8px 10px;
          font-family: "Courier New", monospace;
          font-size: 14px;
          border: 1px solid #777;
          margin-top: 4px;
          box-sizing: border-box;
        }
        .login-box button {
          margin-top: 24px;
          padding: 10px 30px;
          background: #1a3a5c;
          color: white;
          border: 1px solid #0a2a4c;
          cursor: pointer;
          font-family: "Courier New", monospace;
          font-size: 14px;
          font-weight: bold;
          width: 100%;
        }
        .login-box button:hover { background: #2a5a8c; }
        .error-msg {
          background: #fff0f0;
          border: 1px solid #c00;
          padding: 10px;
          font-size: 13px;
          color: #900;
          margin-top: 14px;
        }
        .demo-creds {
          background: #eef4f8;
          border: 1px dashed #2a5a8c;
          padding: 10px;
          font-size: 12px;
          color: #1a3a5c;
          margin-top: 20px;
        }
        .footer {
          text-align: center;
          font-size: 11px;
          color: #888;
          margin-top: 60px;
          padding-bottom: 20px;
        }
      `,
        }}
      />
      <div className="demo-banner" id="demo-banner">
        ⚠ DRAYSIGHT DEMO TERMINAL — Simulated Port Portal for Agent Testing
      </div>
      <div className="header">
        <div className="logo">PacificPort Terminal Operating System</div>
        <div className="subtitle">
          Container Inquiry &amp; Gate Management Gateway
        </div>
      </div>
      <div className="login-box" id="login-container">
        <h2>Terminal Dispatcher Login</h2>
        {hasError && (
          <div className="error-msg" id="login-error">
            Invalid credentials. Please verify username and password.
          </div>
        )}
        <form action="/demo-terminal/api/login" method="POST">
          <label htmlFor="username">Username:</label>
          <input
            type="text"
            id="username"
            name="username"
            autoComplete="username"
            required
          />
          <label htmlFor="password">Password:</label>
          <input
            type="password"
            id="password"
            name="password"
            autoComplete="current-password"
            required
          />
          <button type="submit" id="login-button">
            Sign In to Terminal
          </button>
        </form>
        <div className="demo-creds">
          <strong>Demo Access:</strong> Username: <code>dispatcher</code> | Password: <code>freight2026</code>
        </div>
      </div>
      <div className="footer">
        PacificPort Terminal Operating System &copy; 2024 — DraySight Automation Sandbox
      </div>
    </div>
  );
}
