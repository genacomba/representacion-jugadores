import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { extractErrorMessage } from "../api/client";
import Button from "../components/common/Button";
import { Field, Input } from "../components/common/Field";
import Brand from "../components/common/Brand";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(username, password);
      navigate(location.state?.from?.pathname || "/", { replace: true });
    } catch (err) {
      setError(extractErrorMessage(err, "Usuario o contraseña incorrectos."));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-pitch-950 px-6">
      <div className="w-full max-w-sm">
        <div className="mb-10 flex flex-col items-center text-center">
          <Brand size="lg" tagline align="center" />
          <p className="mt-3 text-sm text-ink-400">Acceso privado del representante</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Field label="Usuario">
            <Input
              autoComplete="username"
              autoFocus
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </Field>
          <Field label="Contraseña">
            <Input
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </Field>

          {error && <p className="text-sm text-danger">{error}</p>}

          <Button type="submit" className="w-full" loading={loading}>
            Ingresar
          </Button>
        </form>

        <p className="mt-8 text-center text-xs text-ink-500">
          Herramienta privada. No es una red social ni un servicio público.
        </p>
      </div>
    </div>
  );
}
