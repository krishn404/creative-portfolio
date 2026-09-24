"use client";
import { ChakraProvider, defaultSystem } from "@chakra-ui/react";
import { Toaster } from "sonner";
import TextureLab from "./TextureLab.jsx";
import "./play-ground.css";

export default function PlayGround() {
  return <ChakraProvider value={defaultSystem}>
    <main className="play-ground-shell">
      <header className="play-ground-header"><a href="/" aria-label="Back to portfolio">← Portfolio</a><span>PLAYGROUND / DIY </span><span>LOCAL MEDIA EDITOR</span></header>
      <div className="play-ground-editor"><TextureLab toolSelector={null} /></div>
      <Toaster position="bottom-right" />
    </main>
  </ChakraProvider>;
}
