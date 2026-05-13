import { SignUp } from "@clerk/nextjs";
import { Bot, Share2, FileText } from "lucide-react";

const features = [
  {
    icon: Bot,
    title: "AI Architecture Generation",
    description: "Describe your system. AI maps it to nodes and edges on a live canvas.",
  },
  {
    icon: Share2,
    title: "Real-time Collaboration",
    description: "Live cursors, presence indicators, and shared node editing across your team.",
  },
  {
    icon: FileText,
    title: "Instant Spec Generation",
    description: "Export a complete Markdown technical spec directly from the canvas graph.",
  },
];

export default function SignUpPage() {
  return (
    <div className="min-h-screen bg-bg-base flex">
      <div className="hidden lg:flex lg:w-1/2 flex-col bg-bg-surface p-12">
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-lg bg-accent-primary shrink-0" />
          <span className="font-semibold text-text-primary">Ghost AI</span>
        </div>

        <div className="flex-1 flex flex-col justify-center max-w-md">
          <h1 className="text-4xl font-bold text-text-primary leading-tight mb-4">
            Design systems at the speed of thought.
          </h1>
          <p className="text-text-secondary text-base mb-10">
            Describe your architecture in plain English. Ghost AI maps it to a
            shared canvas your whole team can refine in real time.
          </p>
          <ul className="space-y-6">
            {features.map(({ icon: Icon, title, description }) => (
              <li key={title} className="flex gap-4">
                <div className="h-9 w-9 shrink-0 rounded-lg bg-accent-primary-dim flex items-center justify-center">
                  <Icon className="h-4 w-4 text-accent-primary" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-text-primary">{title}</p>
                  <p className="text-sm text-text-muted mt-0.5">{description}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <p className="text-xs text-text-faint">© 2026 Ghost AI. All rights reserved.</p>
      </div>

      <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
        <SignUp forceRedirectUrl="/editor" />
      </div>
    </div>
  );
}