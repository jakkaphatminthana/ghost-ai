"use client";

import { useEffect, useRef, useState } from "react";
import { Copy, Check, Loader2, X, UserPlus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface CollaboratorProfile {
  id: string;
  email: string;
  name: string | null;
  avatarUrl: string | null;
}

interface ShareDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  projectName: string;
  isOwner: boolean;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function CollaboratorAvatar({
  name,
  email,
  avatarUrl,
}: {
  name: string | null;
  email: string;
  avatarUrl: string | null;
}) {
  const initial = (name ?? email).charAt(0).toUpperCase();

  if (avatarUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={avatarUrl}
        alt={name ?? email}
        className="h-7 w-7 rounded-full shrink-0 object-cover"
      />
    );
  }

  return (
    <span className="h-7 w-7 rounded-full shrink-0 flex items-center justify-center bg-bg-subtle text-xs font-medium text-text-secondary">
      {initial}
    </span>
  );
}

export function ShareDialog({
  open,
  onOpenChange,
  projectId,
  projectName,
  isOwner,
}: ShareDialogProps) {
  // null = loading, [] = loaded/empty, [...] = loaded with data
  const [collaborators, setCollaborators] = useState<
    CollaboratorProfile[] | null
  >(null);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [inviting, setInviting] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    let active = true;
    fetch(`/api/projects/${projectId}/collaborators`)
      .then((r) => r.json())
      .then((data) => {
        if (active) setCollaborators(data.collaborators ?? []);
      })
      .catch(() => {
        if (active) setCollaborators([]);
      });
    return () => {
      active = false;
    };
  }, [open, projectId]);

  function handleOpenChange(next: boolean) {
    if (!next) {
      setInviteEmail("");
      setInviteError(null);
      setCollaborators(null);
    }
    onOpenChange(next);
  }

  async function handleInvite() {
    const email = inviteEmail.trim().toLowerCase();
    if (!EMAIL_RE.test(email)) {
      setInviteError("Enter a valid email address.");
      return;
    }
    setInviteError(null);
    setInviting(true);
    try {
      const res = await fetch(`/api/projects/${projectId}/collaborators`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) {
        setInviteError(data.error ?? "Failed to invite collaborator.");
        return;
      }
      setCollaborators((prev) => [...(prev ?? []), data.collaborator]);
      setInviteEmail("");
    } catch {
      setInviteError("Failed to invite collaborator.");
    } finally {
      setInviting(false);
    }
  }

  async function handleRemove(collaboratorId: string) {
    setRemovingId(collaboratorId);
    try {
      await fetch(
        `/api/projects/${projectId}/collaborators/${collaboratorId}`,
        { method: "DELETE" },
      );
      setCollaborators((prev) =>
        (prev ?? []).filter((c) => c.id !== collaboratorId),
      );
    } catch {
      // silently fail — list stays unchanged
    } finally {
      setRemovingId(null);
    }
  }

  function handleCopyLink() {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        className="rounded-3xl overflow-hidden bg-bg-elevated border-border-default sm:max-w-md"
        showCloseButton={false}
      >
        <DialogHeader>
          <DialogTitle className="text-text-primary">
            Share &ldquo;{projectName}&rdquo;
          </DialogTitle>
        </DialogHeader>

        {/* Copy link */}
        <div className="flex items-center gap-2 rounded-xl border border-border-default bg-bg-surface px-3 py-2">
          <span className="flex-1 min-w-0 truncate text-xs text-text-muted font-mono">
            {typeof window !== "undefined" ? window.location.href : ""}
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleCopyLink}
            className="h-7 gap-1.5 shrink-0 text-text-muted hover:text-text-primary hover:bg-bg-elevated"
          >
            {copied ? (
              <>
                <Check className="h-3.5 w-3.5 text-state-success" />
                <span className="text-state-success">Copied!</span>
              </>
            ) : (
              <>
                <Copy className="h-3.5 w-3.5" />
                Copy link
              </>
            )}
          </Button>
        </div>

        {/* Invite (owner only) */}
        {isOwner && (
          <div className="flex flex-col gap-1.5">
            <div className="flex gap-2">
              <Input
                ref={inputRef}
                type="email"
                placeholder="Invite by email"
                value={inviteEmail}
                onChange={(e) => {
                  setInviteEmail((e.target as HTMLInputElement).value);
                  setInviteError(null);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !inviting && inviteEmail.trim()) {
                    handleInvite();
                  }
                }}
                disabled={inviting}
                className="flex-1 min-w-0"
              />
              <Button
                onClick={handleInvite}
                disabled={inviting || !inviteEmail.trim()}
                className="gap-1.5 shrink-0"
              >
                {inviting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <UserPlus className="h-4 w-4" />
                )}
                Invite
              </Button>
            </div>
            {inviteError && (
              <p className="text-xs text-state-error">{inviteError}</p>
            )}
          </div>
        )}

        {/* Collaborator list */}
        <div className="flex flex-col gap-1">
          <p className="text-xs font-medium text-text-muted uppercase tracking-wide mb-1">
            Collaborators
          </p>
          {collaborators === null ? (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="h-4 w-4 animate-spin text-text-muted" />
            </div>
          ) : collaborators.length === 0 ? (
            <p className="text-sm text-text-faint py-2">
              No collaborators yet.
            </p>
          ) : (
            collaborators.map((c) => (
              <div
                key={c.id}
                className="flex items-center gap-2.5 rounded-xl px-2 py-1.5 hover:bg-bg-subtle"
              >
                <CollaboratorAvatar
                  name={c.name}
                  email={c.email}
                  avatarUrl={c.avatarUrl}
                />
                <div className="flex flex-col flex-1 min-w-0">
                  {c.name && (
                    <span className="text-sm font-medium text-text-primary truncate">
                      {c.name}
                    </span>
                  )}
                  <span className="text-xs text-text-muted truncate">
                    {c.email}
                  </span>
                </div>
                {isOwner && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleRemove(c.id)}
                    disabled={removingId === c.id}
                    aria-label={`Remove ${c.email}`}
                    className="h-7 w-7 shrink-0 text-text-faint hover:text-state-error hover:bg-bg-subtle"
                  >
                    {removingId === c.id ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <X className="h-3.5 w-3.5" />
                    )}
                  </Button>
                )}
              </div>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
