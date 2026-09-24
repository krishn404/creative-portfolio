"use client";
import { Flex, Text } from "@chakra-ui/react";
type Props = { title: string; color: string; onChange: (color: string) => void };
export default function PreviewColorPickerCustom({ title, color, onChange }: Props) {
  return <Flex align="center" justify="space-between" py={1.5}>
    <Text fontSize="11px" color="var(--text-primary)">{title}</Text>
    <input aria-label={title} type="color" value={color || "#ffffff"} onChange={e => onChange(e.target.value)} style={{ width: 36, height: 26, padding: 2, border: "1px solid var(--border-primary)", borderRadius: 6, background: "transparent" }}/>
  </Flex>;
}
