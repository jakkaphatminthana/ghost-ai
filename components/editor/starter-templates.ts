import { MarkerType } from "@xyflow/react";
import type { CanvasNode, CanvasEdge, NodeShape } from "@/types/canvas";
import { NODE_COLORS } from "@/types/canvas";

export interface CanvasTemplate {
  id: string;
  name: string;
  description: string;
  nodes: CanvasNode[];
  edges: CanvasEdge[];
}

function n(
  id: string,
  label: string,
  x: number,
  y: number,
  shape: NodeShape,
  colorIndex: number,
  width = 140,
  height = 48
): CanvasNode {
  return {
    id,
    type: "canvasNode",
    position: { x, y },
    data: { label, color: NODE_COLORS[colorIndex].fill, shape },
    width,
    height,
  };
}

function e(id: string, source: string, target: string, label?: string): CanvasEdge {
  return {
    id,
    type: "canvasEdge",
    source,
    target,
    markerEnd: { type: MarkerType.ArrowClosed },
    data: label ? { label } : {},
  };
}

const microservices: CanvasTemplate = {
  id: "microservices",
  name: "Microservices",
  description: "API Gateway routes traffic to isolated services, each backed by a dedicated database and connected via a shared message bus.",
  nodes: [
    n("client",        "Client",              120,   0, "rectangle", 4, 120, 44),
    n("gateway",       "API Gateway",         100,  80, "hexagon",   1, 160, 56),
    n("auth",          "Auth Service",          0, 200, "rectangle", 2, 140, 48),
    n("user",          "User Service",        170, 200, "rectangle", 1, 140, 48),
    n("order",         "Order Service",       340, 200, "rectangle", 3, 140, 48),
    n("notify",        "Notification Svc",    510, 200, "rectangle", 7, 160, 48),
    n("bus",           "Message Bus",         340, 100, "pill",      5, 160, 40),
    n("userdb",        "Users DB",            170, 300, "cylinder",  0, 120, 52),
    n("orderdb",       "Orders DB",           340, 300, "cylinder",  0, 120, 52),
  ],
  edges: [
    e("c-g",   "client",  "gateway"),
    e("g-auth","gateway", "auth"),
    e("g-user","gateway", "user"),
    e("g-ord", "gateway", "order"),
    e("ord-b", "order",   "bus"),
    e("b-not", "bus",     "notify"),
    e("user-db","user",   "userdb"),
    e("ord-db","order",   "orderdb"),
  ],
};

const cicd: CanvasTemplate = {
  id: "cicd-pipeline",
  name: "CI/CD Pipeline",
  description: "End-to-end delivery from source commit through build, test, containerisation, and staged deployment to production.",
  nodes: [
    n("repo",     "Source Repo",      0,   60, "rectangle", 1, 130, 48),
    n("build",    "Build",          160,   60, "rectangle", 6, 110, 48),
    n("test",     "Test Suite",     300,   60, "rectangle", 3, 120, 48),
    n("registry", "Artifact Registry", 450, 60, "cylinder",  1, 150, 52),
    n("staging",  "Staging Deploy", 630,   60, "rectangle", 7, 140, 48),
    n("smoke",    "Smoke Tests",    630,  150, "rectangle", 2, 130, 48),
    n("prod",     "Prod Deploy",    800,   60, "rectangle", 6, 130, 48),
  ],
  edges: [
    e("r-b",  "repo",     "build",    "push"),
    e("b-t",  "build",    "test"),
    e("t-r",  "test",     "registry", "pass"),
    e("r-s",  "registry", "staging"),
    e("s-sm", "staging",  "smoke"),
    e("sm-p", "smoke",    "prod",     "approved"),
  ],
};

const eventDriven: CanvasTemplate = {
  id: "event-driven",
  name: "Event-Driven System",
  description: "Producers publish events to a central bus. Independent consumers handle emails, push notifications, analytics, and error queues.",
  nodes: [
    n("p1",   "Producer A",       0,  80, "hexagon",   1, 130, 48),
    n("p2",   "Producer B",       0, 160, "hexagon",   3, 130, 48),
    n("bus",  "Event Bus",       190, 120, "pill",      2, 160, 48),
    n("c1",   "Consumer Group 1",360,  60, "rectangle", 7, 150, 48),
    n("c2",   "Consumer Group 2",360, 160, "rectangle", 6, 150, 48),
    n("dlq",  "Dead-Letter Queue",360, 260, "rectangle", 3, 160, 48),
    n("store","Storage",         550, 100, "cylinder",  0, 120, 52),
  ],
  edges: [
    e("p1-b", "p1",  "bus"),
    e("p2-b", "p2",  "bus"),
    e("b-c1", "bus", "c1"),
    e("b-c2", "bus", "c2"),
    e("b-dlq","bus", "dlq",   "failure"),
    e("c1-s", "c1",  "store"),
    e("c2-s", "c2",  "store"),
  ],
};

export const CANVAS_TEMPLATES: CanvasTemplate[] = [
  microservices,
  cicd,
  eventDriven,
];
