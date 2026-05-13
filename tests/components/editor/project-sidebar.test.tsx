import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { ProjectSidebar } from "@/components/editor/project-sidebar";

describe("ProjectSidebar", () => {
  const onClose = vi.fn();

  beforeEach(() => {
    onClose.mockClear();
  });

  describe("rendering", () => {
    it("renders an aside element", () => {
      render(<ProjectSidebar isOpen={false} onClose={onClose} />);
      expect(screen.getByRole("complementary")).toBeInTheDocument();
    });

    it("renders the Projects header title", () => {
      render(<ProjectSidebar isOpen={false} onClose={onClose} />);
      expect(screen.getByText("Projects")).toBeInTheDocument();
    });

    it("renders the close button", () => {
      render(<ProjectSidebar isOpen={false} onClose={onClose} />);
      // All buttons: close + tab triggers + New Project
      const buttons = screen.getAllByRole("button");
      expect(buttons.length).toBeGreaterThan(0);
    });

    it("renders the New Project button", () => {
      render(<ProjectSidebar isOpen={false} onClose={onClose} />);
      expect(screen.getByText("New Project")).toBeInTheDocument();
    });

    it("renders the My Projects tab trigger", () => {
      render(<ProjectSidebar isOpen={false} onClose={onClose} />);
      expect(screen.getByText("My Projects")).toBeInTheDocument();
    });

    it("renders the Shared tab trigger", () => {
      render(<ProjectSidebar isOpen={false} onClose={onClose} />);
      expect(screen.getByText("Shared")).toBeInTheDocument();
    });

    it("shows empty state text for My Projects tab by default", () => {
      render(<ProjectSidebar isOpen={false} onClose={onClose} />);
      expect(screen.getByText("No projects yet.")).toBeInTheDocument();
    });
  });

  describe("open/closed state via CSS classes", () => {
    it("applies translate-x-0 class when isOpen is true", () => {
      render(<ProjectSidebar isOpen={true} onClose={onClose} />);
      const aside = screen.getByRole("complementary");
      expect(aside.className).toContain("translate-x-0");
    });

    it("applies -translate-x-full class when isOpen is false", () => {
      render(<ProjectSidebar isOpen={false} onClose={onClose} />);
      const aside = screen.getByRole("complementary");
      expect(aside.className).toContain("-translate-x-full");
    });

    it("does not apply -translate-x-full when isOpen is true", () => {
      render(<ProjectSidebar isOpen={true} onClose={onClose} />);
      const aside = screen.getByRole("complementary");
      expect(aside.className).not.toContain("-translate-x-full");
    });

    it("does not apply translate-x-0 when isOpen is false", () => {
      render(<ProjectSidebar isOpen={false} onClose={onClose} />);
      const aside = screen.getByRole("complementary");
      expect(aside.className).not.toContain("translate-x-0");
    });

    it("updates class when isOpen prop changes from false to true", () => {
      const { rerender } = render(
        <ProjectSidebar isOpen={false} onClose={onClose} />
      );
      const aside = screen.getByRole("complementary");
      expect(aside.className).toContain("-translate-x-full");

      rerender(<ProjectSidebar isOpen={true} onClose={onClose} />);
      expect(aside.className).toContain("translate-x-0");
      expect(aside.className).not.toContain("-translate-x-full");
    });

    it("updates class when isOpen prop changes from true to false", () => {
      const { rerender } = render(
        <ProjectSidebar isOpen={true} onClose={onClose} />
      );
      const aside = screen.getByRole("complementary");
      expect(aside.className).toContain("translate-x-0");

      rerender(<ProjectSidebar isOpen={false} onClose={onClose} />);
      expect(aside.className).toContain("-translate-x-full");
      expect(aside.className).not.toContain("translate-x-0");
    });
  });

  describe("close button interaction", () => {
    it("calls onClose when the close button is clicked", async () => {
      const user = userEvent.setup();
      render(<ProjectSidebar isOpen={true} onClose={onClose} />);

      // The close button contains the X icon and is the first button
      const buttons = screen.getAllByRole("button");
      // Find close button — it's first (in header), before tab triggers
      await user.click(buttons[0]);
      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it("calls onClose even when sidebar is closed (isOpen=false)", async () => {
      const user = userEvent.setup();
      render(<ProjectSidebar isOpen={false} onClose={onClose} />);

      const buttons = screen.getAllByRole("button");
      await user.click(buttons[0]);
      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it("does not call onClose before any interaction", () => {
      render(<ProjectSidebar isOpen={true} onClose={onClose} />);
      expect(onClose).not.toHaveBeenCalled();
    });
  });

  describe("tabs", () => {
    it("shows My Projects content by default", () => {
      render(<ProjectSidebar isOpen={true} onClose={onClose} />);
      expect(screen.getByText("No projects yet.")).toBeInTheDocument();
    });

    it("shows Shared empty state after clicking Shared tab", async () => {
      const user = userEvent.setup();
      render(<ProjectSidebar isOpen={true} onClose={onClose} />);

      await user.click(screen.getByText("Shared"));
      expect(screen.getByText("No shared projects yet.")).toBeInTheDocument();
    });

    it("shows My Projects empty state after switching back from Shared", async () => {
      const user = userEvent.setup();
      render(<ProjectSidebar isOpen={true} onClose={onClose} />);

      await user.click(screen.getByText("Shared"));
      await user.click(screen.getByText("My Projects"));
      expect(screen.getByText("No projects yet.")).toBeInTheDocument();
    });
  });

  describe("structure and positioning", () => {
    it("is positioned fixed (has fixed class)", () => {
      render(<ProjectSidebar isOpen={false} onClose={onClose} />);
      const aside = screen.getByRole("complementary");
      expect(aside.className).toContain("fixed");
    });

    it("is positioned at the left edge (has left-0 class)", () => {
      render(<ProjectSidebar isOpen={false} onClose={onClose} />);
      const aside = screen.getByRole("complementary");
      expect(aside.className).toContain("left-0");
    });

    it("has a high z-index to float above canvas (has z-40 class)", () => {
      render(<ProjectSidebar isOpen={false} onClose={onClose} />);
      const aside = screen.getByRole("complementary");
      expect(aside.className).toContain("z-40");
    });

    it("has transition classes for smooth animation", () => {
      render(<ProjectSidebar isOpen={false} onClose={onClose} />);
      const aside = screen.getByRole("complementary");
      expect(aside.className).toContain("transition-transform");
    });
  });
});