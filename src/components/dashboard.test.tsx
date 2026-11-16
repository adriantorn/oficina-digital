import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Dashboard } from "./dashboard";

describe("Dashboard", () => {
  it("identifica de forma inequívoca los datos de demostración", () => {
    render(<Dashboard data={{ displayName: "Alex", appointments: 3, pending: 2, isDemo: true }} />);
    expect(screen.getByText(/modo demostración/i)).toBeInTheDocument();
    expect(screen.getByText(/Buenos|Buenas/)).toHaveTextContent("Alex");
  });

  it("no inventa cifras en modo real sin agenda", () => {
    render(<Dashboard data={{ displayName: "Marta", appointments: null, pending: null, isDemo: false }} />);
    expect(screen.queryByText(/modo demostración/i)).not.toBeInTheDocument();
    expect(screen.getAllByText("—")).toHaveLength(2);
    expect(screen.getAllByText(/Se activará al incorporar la agenda/i)).toHaveLength(2);
  });

  it("explica por qué las acciones futuras están deshabilitadas", () => {
    render(<Dashboard data={{ displayName: "Alex", appointments: 0, pending: 0, isDemo: true }} />);
    expect(screen.getByRole("button", { name: /nuevo cliente/i })).toBeDisabled();
    expect(screen.getAllByText("Próximamente")).toHaveLength(4);
  });
});
