"use client";

import { useOthers } from "@liveblocks/react/suspense";
import { useAuth } from "@clerk/nextjs";

const MAX_VISIBLE = 5;

function getInitials(name: string): string {
  return name
    .split(" ")
    .slice(0, 2)
    .map((part) => part[0] ?? "")
    .join("")
    .toUpperCase();
}

interface CollaboratorAvatarProps {
  name: string;
  avatar: string;
  color: string;
}

function CollaboratorAvatar({ name, avatar, color }: CollaboratorAvatarProps) {
  return (
    <div
      className="relative h-8 w-8 shrink-0 rounded-full ring-2 ring-bg-base overflow-hidden"
      title={name}
      style={{ boxShadow: `0 0 0 2px ${color}` }}
    >
      {avatar ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={avatar}
          alt={name}
          className="h-full w-full object-cover"
        />
      ) : (
        <div
          className="flex h-full w-full items-center justify-center text-xs font-semibold text-white"
          style={{ backgroundColor: color }}
        >
          {getInitials(name)}
        </div>
      )}
    </div>
  );
}

export function PresenceAvatars() {
  const { userId } = useAuth();
  const others = useOthers();

  const collaborators = others.filter(
    (other) => other.info && other.id !== userId
  );

  const visible = collaborators.slice(0, MAX_VISIBLE);
  const overflow = collaborators.length - MAX_VISIBLE;

  return (
    <div className="flex items-center gap-1.5">
      {visible.length > 0 && (
        <div className="flex items-center">
          {visible.map((other, i) => (
            <div
              key={other.connectionId}
              className="relative"
              style={{ marginLeft: i === 0 ? 0 : -8 }}
            >
              <CollaboratorAvatar
                name={other.info.name}
                avatar={other.info.avatar}
                color={other.info.color}
              />
            </div>
          ))}
          {overflow > 0 && (
            <div
              className="relative flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-bg-elevated text-xs font-semibold text-text-secondary ring-2 ring-bg-base"
              style={{ marginLeft: -8 }}
            >
              +{overflow}
            </div>
          )}
        </div>
      )}

    </div>
  );
}