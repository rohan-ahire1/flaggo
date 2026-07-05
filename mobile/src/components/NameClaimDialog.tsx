import { useEffect, useState } from "react";
import { Modal, Pressable, Text, TextInput, View } from "react-native";
import { updateDisplayName } from "@/lib/leaderboard";
import { isValidUsername } from "@/lib/username";
import { Card, PillButton, SectionLabel } from "@/components/ui";

export default function NameClaimDialog({
  open,
  userId,
  onCancel,
  onSaved
}: {
  open: boolean;
  userId: string | null;
  onCancel: () => void;
  onSaved: (name: string) => void;
}) {
  const [name, setName] = useState("");
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!open) {
      setName("");
      setStatus("");
      setBusy(false);
    }
  }, [open]);

  const clean = name.trim();
  const valid = isValidUsername(clean);
  const canSave = Boolean(userId && valid && !busy);

  async function save() {
    if (!userId || !valid || busy) return;
    setBusy(true);
    setStatus("");
    try {
      const saved = await updateDisplayName(userId, clean);
      onSaved(saved);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Could not save that name.");
      setBusy(false);
    }
  }

  return (
    <Modal visible={open} transparent animationType="fade" onRequestClose={onCancel}>
      <View className="flex-1 items-center justify-center bg-slate-900/40 p-5">
        <Card className="w-full max-w-[360px] gap-4">
          <View className="flex-row items-start justify-between gap-3">
            <View className="min-w-0 flex-1">
              <SectionLabel>Leaderboards</SectionLabel>
              <Text className="mt-1 text-[24px] font-black text-ink">Claim your player name</Text>
              <Text className="mt-1 text-[14px] font-semibold text-muted">Shown on leaderboards and challenges</Text>
            </View>
            <Pressable accessibilityRole="button" onPress={onCancel} hitSlop={10}>
              <Text className="text-[20px] font-black text-muted">x</Text>
            </Pressable>
          </View>

          <View>
            <TextInput
              value={name}
              onChangeText={setName}
              maxLength={20}
              autoComplete="username"
              autoCapitalize="none"
              placeholder="flag_explorer"
              className={`rounded-2xl border-2 bg-paper px-4 py-3 text-[16px] font-bold text-ink ${
                clean && !valid ? "border-error" : "border-line"
              }`}
            />
            <Text className={`mt-2 text-[12px] font-bold ${clean && !valid ? "text-error" : "text-muted"}`}>
              {clean && !valid ? "Use 3-20 letters, numbers, or underscores." : "3-20 letters, numbers, or underscores."}
            </Text>
          </View>

          {status ? <Text className="rounded-2xl bg-error/10 p-3 text-[13px] font-bold text-error">{status}</Text> : null}

          <View className="gap-2">
            <PillButton label={busy ? "Saving..." : "Save name"} variant="primary" onPress={canSave ? save : undefined} className={canSave ? "" : "opacity-50"} />
            <PillButton label="Not now" variant="secondary" onPress={onCancel} />
          </View>
        </Card>
      </View>
    </Modal>
  );
}
