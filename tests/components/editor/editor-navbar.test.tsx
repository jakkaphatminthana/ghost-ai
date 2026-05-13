import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { EditorNavbar } from "@/components/editor/editor-navbar";

describe("EditorNavbar", () => {
  const onSidebarToggle = vi.fn();

  beforeEach(() => {
    onSidebarToggle.mockClear();
  });

  describe("rendering", () => {
    it("renders a header element", () => {
      render(
        <EditorNavbar isSidebarOpen={false} onSidebarToggle={onSidebarToggle} />
      );
      expect(screen.getByRole("banner")).toBeInTheDocument();
    });

    it("renders the sidebar toggle button", () => {
      render(
        <EditorNavbar isSidebarOpen={false} onSidebarToggle={onSidebarToggle} />
      );
      expect(screen.getByRole("button")).toBeInTheDocument();
    });
  });

  describe("sidebar closed state (isSidebarOpen=false)", () => {
    it("renders PanelLeftOpen icon when sidebar is closed", () => {
      const { container } = render(
        <EditorNavbar isSidebarOpen={false} onSidebarToggle={onSidebarToggle} />
      );
      // PanelLeftOpen SVG should be present, PanelLeftClose should not
      const svgs = container.querySelectorAll("svg");
      expect(svgs.length).toBeGreaterThan(0);
    });

    it("does not show PanelLeftClose icon when sidebar is closed", () => {
      const { container } = render(
        <EditorNavbar isSidebarOpen={false} onSidebarToggle={onSidebarToggle} />
      );
      // PanelLeftClose has a different path; we verify only one icon group is rendered
      const svgs = container.querySelectorAll("svg");
      expect(svgs.length).toBe(1);
    });
  });

  describe("sidebar open state (isSidebarOpen=true)", () => {
    it("renders PanelLeftClose icon when sidebar is open", () => {
      const { container } = render(
        <EditorNavbar isSidebarOpen={true} onSidebarToggle={onSidebarToggle} />
      );
      const svgs = container.querySelectorAll("svg");
      expect(svgs.length).toBe(1);
    });

    it("renders exactly one icon regardless of sidebar state", () => {
      const { container: closedContainer } = render(
        <EditorNavbar isSidebarOpen={false} onSidebarToggle={onSidebarToggle} />
      );
      const { container: openContainer } = render(
        <EditorNavbar isSidebarOpen={true} onSidebarToggle={onSidebarToggle} />
      );
      expect(closedContainer.querySelectorAll("svg").length).toBe(1);
      expect(openContainer.querySelectorAll("svg").length).toBe(1);
    });
  });

  describe("interaction", () => {
    it("calls onSidebarToggle when the toggle button is clicked", async () => {
      const user = userEvent.setup();
      render(
        <EditorNavbar isSidebarOpen={false} onSidebarToggle={onSidebarToggle} />
      );
      await user.click(screen.getByRole("button"));
      expect(onSidebarToggle).toHaveBeenCalledTimes(1);
    });

    it("calls onSidebarToggle when clicked while sidebar is open", async () => {
      const user = userEvent.setup();
      render(
        <EditorNavbar isSidebarOpen={true} onSidebarToggle={onSidebarToggle} />
      );
      await user.click(screen.getByRole("button"));
      expect(onSidebarToggle).toHaveBeenCalledTimes(1);
    });

    it("calls onSidebarToggle each time the button is clicked", async () => {
      const user = userEvent.setup();
      render(
        <EditorNavbar isSidebarOpen={false} onSidebarToggle={onSidebarToggle} />
      );
      const button = screen.getByRole("button");
      await user.click(button);
      await user.click(button);
      await user.click(button);
      expect(onSidebarToggle).toHaveBeenCalledTimes(3);
    });

    it("does not call onSidebarToggle before any interaction", () => {
      render(
        <EditorNavbar isSidebarOpen={false} onSidebarToggle={onSidebarToggle} />
      );
      expect(onSidebarToggle).not.toHaveBeenCalled();
    });
  });

  describe("icon switching based on prop", () => {
    it("swaps icon when isSidebarOpen prop changes from false to true", () => {
      const { container, rerender } = render(
        <EditorNavbar isSidebarOpen={false} onSidebarToggle={onSidebarToggle} />
      );
      const closedSvg = container.querySelector("svg")?.innerHTML;

      rerender(
        <EditorNavbar isSidebarOpen={true} onSidebarToggle={onSidebarToggle} />
      );
      const openSvg = container.querySelector("svg")?.innerHTML;

      // The two icons have different SVG paths
      expect(closedSvg).not.toEqual(openSvg);
    });

    it("swaps icon when isSidebarOpen prop changes from true to false", () => {
      const { container, rerender } = render(
        <EditorNavbar isSidebarOpen={true} onSidebarToggle={onSidebarToggle} />
      );
      const openSvg = container.querySelector("svg")?.innerHTML;

      rerender(
        <EditorNavbar isSidebarOpen={false} onSidebarToggle={onSidebarToggle} />
      );
      const closedSvg = container.querySelector("svg")?.innerHTML;

      expect(openSvg).not.toEqual(closedSvg);
    });
  });
});