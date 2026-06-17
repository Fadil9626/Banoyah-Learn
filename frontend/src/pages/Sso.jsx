import React, { useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Loader2, ShieldAlert } from "lucide-react";
import api, { setToken } from "../lib/api";
import { useAuth } from "../context/AuthContext";
import Brand from "../components/Brand";

// One-time SSO landing: exchange the token for a session, then go to My Learning.
export default function Sso() {
  const { token } = useParams();
  const navigate = useNavigate();
  const { refresh } = useAuth();
  const [error, setError] = useState("");
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return; // tokens are single-use — never fire twice
    ran.current = true;
    (async () => {
      try {
        const res = await api("auth/sso", { method: "POST", body: JSON.stringify({ token }) });
        setToken(res.token);
        await refresh();
        navigate("/learn", { replace: true });
      } catch (e) {
        setError(e.message || "This sign-in link is invalid or has expired.");
      }
    })();
  }, [token]); // eslint-disable-line

  return (
    <div className="min-h-full bg-bg grid place-items-center px-6">
      <div className="text-center">
        <div className="flex justify-center mb-6"><Brand /></div>
        {error ? (
          <div className="max-w-sm">
            <div className="w-14 h-14 rounded-2xl grid place-items-center mx-auto text-danger" style={{ backgroundColor: "rgb(var(--danger) / 0.12)" }}>
              <ShieldAlert size={28} />
            </div>
            <h2 className="text-lg font-black text-content mt-4">Couldn't sign you in</h2>
            <p className="text-sm text-muted mt-1">{error}</p>
            <button onClick={() => navigate("/login", { replace: true })} className="btn-brand mt-6">Go to sign in</button>
          </div>
        ) : (
          <div className="flex items-center gap-3 text-muted">
            <Loader2 className="animate-spin" /> Signing you in…
          </div>
        )}
      </div>
    </div>
  );
}
