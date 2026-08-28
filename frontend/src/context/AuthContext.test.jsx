import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AuthProvider, useAuth } from "./AuthContext";

vi.mock("../api/auth", () => ({
  authApi: {
    login: vi.fn(),
    logout: vi.fn(),
    me: vi.fn(),
  },
}));

import { authApi } from "../api/auth";

function TestConsumer() {
  const { user, isAuthenticated, loading, login, logout } = useAuth();
  if (loading) return <p>loading</p>;
  return (
    <div>
      <p>{isAuthenticated ? `logged in as ${user.username}` : "logged out"}</p>
      <button onClick={() => login("admin", "secret")}>login</button>
      <button onClick={logout}>logout</button>
    </div>
  );
}

describe("AuthContext", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it("starts logged out when there is no stored session", async () => {
    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    );
    await waitFor(() => expect(screen.getByText("logged out")).toBeInTheDocument());
    expect(authApi.me).not.toHaveBeenCalled();
  });

  it("logs in, persists tokens, and exposes the returned user", async () => {
    authApi.login.mockResolvedValue({
      access: "access-token",
      refresh: "refresh-token",
      user: { id: 1, username: "admin" },
    });

    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    );
    await waitFor(() => expect(screen.getByText("logged out")).toBeInTheDocument());

    await userEvent.click(screen.getByText("login"));

    await waitFor(() => expect(screen.getByText("logged in as admin")).toBeInTheDocument());
    expect(JSON.parse(localStorage.getItem("mdp_tokens"))).toEqual({
      access: "access-token",
      refresh: "refresh-token",
    });
  });

  it("restores the session on mount when tokens already exist", async () => {
    localStorage.setItem("mdp_tokens", JSON.stringify({ access: "a", refresh: "r" }));
    authApi.me.mockResolvedValue({ id: 1, username: "admin" });

    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    );

    await waitFor(() => expect(screen.getByText("logged in as admin")).toBeInTheDocument());
  });

  it("logs out and clears the stored session even if the API call fails", async () => {
    localStorage.setItem("mdp_tokens", JSON.stringify({ access: "a", refresh: "r" }));
    authApi.me.mockResolvedValue({ id: 1, username: "admin" });
    authApi.logout.mockRejectedValue(new Error("network error"));

    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    );
    await waitFor(() => expect(screen.getByText("logged in as admin")).toBeInTheDocument());

    await userEvent.click(screen.getByText("logout"));

    await waitFor(() => expect(screen.getByText("logged out")).toBeInTheDocument());
    expect(localStorage.getItem("mdp_tokens")).toBeNull();
  });
});
