"use client";
import { Flex, Text } from "@chakra-ui/react";
type Option = { value: string; label: string };
type Props = { title: string; value: string; onChange: (value: string) => void; options?: Option[] };
export default function PreviewSelect({ title, value, onChange, options = [] }: Props) {
  return <Flex align="center" justify="space-between" gap={3} py={1.5}>
    <Text fontSize="11px" color="var(--text-primary)">{title}</Text>
    <select aria-label={title} value={value ?? ""} onChange={e => onChange(e.target.value)} style={{ maxWidth: "58%", background: "var(--bg-elevated)", color: "var(--text-primary)", border: "1px solid var(--border-primary)", borderRadius: 6, padding: "5px 8px", fontSize: 11 }}>
      {options.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
    </select>
  </Flex>;
}
