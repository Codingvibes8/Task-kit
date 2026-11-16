import { cn, initials } from "@/lib/utils";

type AvatarUser = {
  firstName?: string | null;
  lastName?: string | null;
  email?: string;
  imageUrl?: string | null;
};

export function Avatar({
  user,
  size = "md",
  className,
}: {
  user: AvatarUser | null | undefined;
  size?: "xs" | "sm" | "md";
  className?: string;
}) {
  const sizes = {
    xs: "size-5 text-[9px]",
    sm: "size-6.5 text-[10px]",
    md: "size-8 text-[11px]",
  } as const;

  if (user?.imageUrl) {
    return (
      // Clerk-hosted avatars are already sized; plain img keeps dependencies slim.
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={user.imageUrl}
        alt=""
        className={cn(
          "rounded-full object-cover ring-1 ring-white/10",
          sizes[size],
          className,
        )}
      />
    );
  }

  return (
    <span
      className={cn(
        "inline-flex items-center justify-center rounded-full bg-surface-3 font-semibold uppercase text-muted ring-1 ring-white/10",
        sizes[size],
        className,
      )}
      aria-hidden="true"
    >
      {initials(user ?? null)}
    </span>
  );
}

export function AvatarStack({
  users,
  max = 3,
}: {
  users: AvatarUser[];
  max?: number;
}) {
  const visible = users.slice(0, max);
  const extra = users.length - visible.length;

  return (
    <div className="flex items-center -space-x-1.5">
      {visible.map((user, index) => (
        <Avatar
          key={`${user.email ?? index}`}
          user={user}
          size="xs"
          className="ring-2 ring-surface"
        />
      ))}
      {extra > 0 ? (
        <span className="inline-flex size-5 items-center justify-center rounded-full bg-surface-3 text-[9px] font-semibold text-muted ring-2 ring-surface">
          +{extra}
        </span>
      ) : null}
    </div>
  );
}
