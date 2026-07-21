import type { Metadata } from "next";

// Every route defines its own title + description for the page itself
// already — this just mirrors those into the openGraph/twitter fields so
// link previews (WhatsApp, Slack, iMessage, Twitter) render the same copy
// instead of falling back to whatever each platform's crawler guesses.
export function withSocial(meta: { title: string; description: string } & Omit<Metadata, "title" | "description">): Metadata {
  const { title, description, ...rest } = meta;
  return {
    title,
    description,
    openGraph: { title, description, type: "website" },
    twitter: { card: "summary_large_image", title, description },
    ...rest,
  };
}
