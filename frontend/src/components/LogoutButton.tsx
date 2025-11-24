"use client";

import { signOut } from "next-auth/react";

export default function LogoutButton() {
  return (
    <button
      onClick={() => signOut({ callbackUrl: "/login" })}
      style={{
        padding: "8px 16px",
        borderRadius: 6,
        background: "#f33",
        color: "#fff",
        border: "none",
        cursor: "pointer",
        marginTop: 20,
      }}
    >
      Sair
    </button>
  );
}
