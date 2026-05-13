import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect } from "vitest";
import Home from "@/app/page";

describe("Home page", () => {
  describe("rendering", () => {
    it("renders without crashing", () => {
      render(<Home />);
      expect(document.body).toBeInTheDocument();
    });

    it("renders the canvas placeholder text", () => {
      render(<Home />);
      expect(screen.getByText("Canvas placeholder")).toBeInTheDocument();
    });

    it("renders a main element for the canvas area", () => {
      render(<Home />);
      expect(screen.getByRole("main")).toBeInTheDocument();
    });

    it("renders a header (EditorNavbar)", () => {
      render(<Home />);
      expect(screen.getByRole("banner")).toBeInTheDocument();
    });

    it("renders the sidebar toggle button in the navbar header", () => {
      render(<Home />);
      const header = screen.getByRole("banner");
      expect(within(header).getByRole("button")).toBeInTheDocument();
    });

    it("renders the sidebar (ProjectSidebar)", () => {
      render(<Home />);
      expect(screen.getByRole("complementary")).toBeInTheDocument();
    });

    it("renders the Projects title in the sidebar", () => {
      render(<Home />);
      expect(screen.getByText("Projects")).toBeInTheDocument();
    });

    it("renders the New Project button in the sidebar", () => {
      render(<Home />);
      expect(screen.getByText("New Project")).toBeInTheDocument();
    });
  });

  describe("initial state", () => {
    it("starts with the sidebar closed (has -translate-x-full class)", () => {
      render(<Home />);
      const sidebar = screen.getByRole("complementary");
      expect(sidebar.className).toContain("-translate-x-full");
    });

    it("starts with the sidebar not open (does not have translate-x-0 class)", () => {
      render(<Home />);
      const sidebar = screen.getByRole("complementary");
      expect(sidebar.className).not.toContain("translate-x-0");
    });
  });

  describe("sidebar toggle interaction", () => {
    it("opens the sidebar when the navbar toggle button is clicked", async () => {
      const user = userEvent.setup();
      render(<Home />);

      const header = screen.getByRole("banner");
      const toggleButton = within(header).getByRole("button");
      await user.click(toggleButton);

      const sidebar = screen.getByRole("complementary");
      expect(sidebar.className).toContain("translate-x-0");
    });

    it("removes -translate-x-full class when sidebar opens", async () => {
      const user = userEvent.setup();
      render(<Home />);

      const header = screen.getByRole("banner");
      const toggleButton = within(header).getByRole("button");
      await user.click(toggleButton);

      const sidebar = screen.getByRole("complementary");
      expect(sidebar.className).not.toContain("-translate-x-full");
    });

    it("closes the sidebar when the navbar toggle button is clicked a second time", async () => {
      const user = userEvent.setup();
      render(<Home />);

      const header = screen.getByRole("banner");
      const toggleButton = within(header).getByRole("button");
      await user.click(toggleButton); // open
      await user.click(toggleButton); // close

      const sidebar = screen.getByRole("complementary");
      expect(sidebar.className).toContain("-translate-x-full");
    });

    it("toggles the sidebar icon each time the button is clicked", async () => {
      const user = userEvent.setup();
      render(<Home />);

      const header = screen.getByRole("banner");
      const initialSvgHtml = header.querySelector("svg")?.innerHTML;
      const toggleButton = within(header).getByRole("button");

      await user.click(toggleButton);
      const afterClickSvgHtml = header.querySelector("svg")?.innerHTML;

      expect(initialSvgHtml).not.toEqual(afterClickSvgHtml);
    });

    it("restores the original icon after toggling twice", async () => {
      const user = userEvent.setup();
      render(<Home />);

      const header = screen.getByRole("banner");
      const initialSvgHtml = header.querySelector("svg")?.innerHTML;
      const toggleButton = within(header).getByRole("button");

      await user.click(toggleButton);
      await user.click(toggleButton);
      const afterTwoClicksSvgHtml = header.querySelector("svg")?.innerHTML;

      expect(initialSvgHtml).toEqual(afterTwoClicksSvgHtml);
    });

    it("opens and closes sidebar multiple times correctly", async () => {
      const user = userEvent.setup();
      render(<Home />);

      const header = screen.getByRole("banner");
      const toggleButton = within(header).getByRole("button");
      const sidebar = screen.getByRole("complementary");

      // open
      await user.click(toggleButton);
      expect(sidebar.className).toContain("translate-x-0");

      // close
      await user.click(toggleButton);
      expect(sidebar.className).toContain("-translate-x-full");

      // open again
      await user.click(toggleButton);
      expect(sidebar.className).toContain("translate-x-0");
    });
  });

  describe("sidebar close button", () => {
    it("closes the sidebar when the sidebar close (X) button is clicked", async () => {
      const user = userEvent.setup();
      render(<Home />);

      const header = screen.getByRole("banner");
      const toggleButton = within(header).getByRole("button");

      // Open sidebar first via navbar toggle
      await user.click(toggleButton);

      const sidebar = screen.getByRole("complementary");
      expect(sidebar.className).toContain("translate-x-0");

      // The close button is the first button inside the sidebar
      const sidebarButtons = within(sidebar).getAllByRole("button");
      await user.click(sidebarButtons[0]);

      expect(sidebar.className).toContain("-translate-x-full");
    });

    it("sets sidebar to closed state (not just toggled) via close button", async () => {
      const user = userEvent.setup();
      render(<Home />);

      const header = screen.getByRole("banner");
      const toggleButton = within(header).getByRole("button");

      await user.click(toggleButton); // open

      const sidebar = screen.getByRole("complementary");
      const sidebarButtons = within(sidebar).getAllByRole("button");
      await user.click(sidebarButtons[0]); // close via X button

      // Clicking navbar toggle again should open (since state was set to false)
      await user.click(toggleButton);
      expect(sidebar.className).toContain("translate-x-0");
    });
  });

  describe("structural layout", () => {
    it("wraps content in a full-height flex column container", () => {
      const { container } = render(<Home />);
      const root = container.firstElementChild as HTMLElement;
      expect(root.className).toContain("h-screen");
      expect(root.className).toContain("flex-col");
    });

    it("has overflow-hidden on the root to prevent scrollbar during sidebar animation", () => {
      const { container } = render(<Home />);
      const root = container.firstElementChild as HTMLElement;
      expect(root.className).toContain("overflow-hidden");
    });

    it("renders header before the main content wrapper", () => {
      const { container } = render(<Home />);
      const root = container.firstElementChild as HTMLElement;
      const children = Array.from(root.children);
      const headerIndex = children.findIndex((el) => el.tagName === "HEADER");
      const mainWrapperIndex = children.findIndex((el) => el.tagName === "DIV");
      expect(headerIndex).toBeLessThan(mainWrapperIndex);
    });
  });
});