"use client";
import dynamic from "next/dynamic";

const PlayGroundClient = dynamic(() => import("./PlayGroundClient"), {
  ssr: false,
  loading: () => <main className="play-ground-loading" aria-label="Loading Playground">Loading Playground…</main>,
});

export default function PlayGround() {
  return <PlayGroundClient />;
}
