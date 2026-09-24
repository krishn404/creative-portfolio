"use client";
import { Flex, Text } from "@chakra-ui/react";
type Props = { title: string; value: number; onChange: (value: number) => void; min?: number; max?: number; step?: number };
export default function PreviewSlider({ title, value, onChange, min = 0, max = 1, step = .01 }: Props) {
  return <Flex align="center" gap={3} py={1.5}>
    <Text flex="0 0 108px" fontSize="11px" color="var(--text-primary)">{title}</Text>
    <input aria-label={title} type="range" min={min} max={max} step={step} value={value ?? min} onChange={e => onChange(Number(e.target.value))} style={{ flex: 1, minWidth: 0, accentColor: "var(--color-primary)" }} />
    <Text minW="38px" textAlign="right" fontSize="10px" color="var(--text-muted)" fontFamily="mono">{Number(value ?? 0).toFixed(step < 1 ? 2 : 0)}</Text>
  </Flex>;
}
