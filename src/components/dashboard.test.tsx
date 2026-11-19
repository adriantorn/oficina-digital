import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Dashboard } from "./dashboard";

describe("Dashboard", () => {
  it("identifica de forma inequívoca los datos de demostración", () => {
    render(<Dashboard data={{ displayName: "Alex", appointments: 3, contactCount: 12, recentContacts: [], isDemo: true }} />);
    expect(screen.getByText(/modo demostración/i)).toBeInTheDocument();
    expect(screen.getByText(/Buenos|Buenas/)).toHaveTextContent("Alex");
  });

  it("muestra cero cuando la agenda real no contiene citas", () => {
    render(<Dashboard data={{ displayName: "Marta", appointments: null, contactCount: 0, recentContacts: [], isDemo: false }} />);
    expect(screen.queryByText(/modo demostración/i)).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: /0.*Próximas citas.*Abrir agenda/i })).toHaveAttribute("href", "/app/agenda");
    const quickAction = screen.getByRole("link", { name: /nuevo contacto/i });
    const summary = screen.getByRole("heading", { name: /de un vistazo/i });
    expect(quickAction.compareDocumentPosition(summary) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it("mantiene las acciones que escriben datos deshabilitadas en demostración", () => {
    render(<Dashboard data={{ displayName: "Alex", appointments: 0, contactCount: 12, recentContacts: [], isDemo: true }} />);
    expect(screen.getByRole("button", { name: /nuevo contacto/i })).toBeDisabled();
    expect(screen.getAllByText(/Accede para gestionar datos reales/i).length).toBeGreaterThan(0);
  });
});
