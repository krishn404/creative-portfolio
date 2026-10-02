"use client"

import { Suspense } from "react"
import { Canvas } from "@react-three/fiber"
import { AdaptiveDpr } from "@react-three/drei"
import type { MotionValue } from "framer-motion"
import GalleryScene from "./GalleryScene"

type Props = { offsetX: MotionValue<number>; offsetY: MotionValue<number>; colorMode: "inverted" | "original" }

export default function GalleryCanvas({ offsetX, offsetY, colorMode }: Props) {
  return (
    <Canvas
      dpr={[1, 2]}
      camera={{ position: [0, 0, 5], near: 0.1, far: 10 }}
      gl={{ alpha: false, antialias: false, powerPreference: "low-power" }}
      frameloop="demand"
      onCreated={({ gl }) => {
        gl.setClearColor("#0a0a0a", 1)
        gl.domElement.style.touchAction = "none"
        gl.domElement.style.cursor = "grab"
      }}
    >
      <color attach="background" args={["#090909"]} />
      <Suspense fallback={null}>
        <GalleryScene offsetX={offsetX} offsetY={offsetY} colorMode={colorMode} />
        <AdaptiveDpr pixelated />
      </Suspense>
    </Canvas>
  )
}
