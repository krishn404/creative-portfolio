"use client"

import ClickSpark from "@/components/ClickSpark"

export default function SparkWrapper({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative w-full min-h-screen">
      <ClickSpark
        sparkColor="#ff4da6"
        sparkSize={10}
        sparkRadius={15}
        sparkCount={8}
        duration={400}
      >
        <div className="w-full h-full">
          {children}
        </div>
      </ClickSpark>
    </div>
  )
}
