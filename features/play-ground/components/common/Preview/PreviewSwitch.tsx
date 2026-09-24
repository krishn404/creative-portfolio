"use client";
import { Flex, Switch, Text } from "@chakra-ui/react";
type Props = { title: string; isChecked: boolean; onChange: (checked: boolean) => void };
export default function PreviewSwitch({ title, isChecked, onChange }: Props) {
  return <Flex align="center" justify="space-between" py={1.5}>
    <Text fontSize="11px" color="var(--text-primary)">{title}</Text>
    <Switch.Root checked={Boolean(isChecked)} onCheckedChange={detail => onChange(detail.checked)} size="sm" colorPalette="purple"><Switch.HiddenInput aria-label={title}/><Switch.Control><Switch.Thumb/></Switch.Control></Switch.Root>
  </Flex>;
}
