import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Dashboard } from "./dashboard";

describe("Dashboard", () => {
  it("identifica de forma inequívoca los datos de demostración", () => {
    render(<Dashboard data={{ displayName: "Alex", appointments: 3, contactCount: 12, recentContacts: [], isDemo: true }} />);
    expect(screen.getByText(/modo demostración/i)).toBeInTheDocument();
    expect(screen.getByText(/Buenos|Buenas/)).toHaveTextContent("Alex");
  });

  it("no inventa cifras en modo real sin agenda", () => {
    render(<Dashboard data={{ displayName: "Marta", appointments: null, contactCount: 0, recentContacts: [], isDemo: false }} />);
    expect(screen.queryByText(/modo demostración/i)).not.toBeInTheDocument();
    expect(screen.getByText("—")).toBeInTheDocument();
    expect(screen.getByText(/Agenda prevista para un hito futuro/i)).toBeInTheDocument();
  });

  it("explica por qué las acciones futuras están deshabilitadas", () => {
    render(<Dashboard data={{ displayName: "Alex", appointments: 0, contactCount: 12, recentContacts: [], isDemo: true }} />);
    expect(screen.getByRole("button", { name: /nuevo contacto/i })).toBeDisabled();
    expect(screen.getByText("Próximamente")).toBeInTheDocument();
  });
});
