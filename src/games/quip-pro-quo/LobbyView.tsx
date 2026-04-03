"use client";

import { type FormEvent, useState } from "react";
import type { LobbyViewProps } from "@/lib/engine/types";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { PlayerList } from "@/components/party/PlayerList";
import { setCustomPrompts } from "./customPromptStore";

const MAX_CUSTOM_PROMPTS = 20;

export function QuipProQuoLobbyView({
  players,
  partyCode,
  isHost,
}: LobbyViewProps) {
  const [showCustom, setShowCustom] = useState(false);
  const [prompts, setPrompts] = useState<string[]>([]);
  const [draft, setDraft] = useState("");

  function handleAddPrompt(e: FormEvent) {
    e.preventDefault();
    const text = draft.trim();
    if (!text || prompts.length >= MAX_CUSTOM_PROMPTS) return;

    const next = [...prompts, text];
    setPrompts(next);
    setCustomPrompts(next);
    setDraft("");
  }

  function handleRemovePrompt(index: number) {
    const next = prompts.filter((_, i) => i !== index);
    setPrompts(next);
    setCustomPrompts(next);
  }

  return (
    <div className="space-y-5">
      <PlayerList
        players={players}
        currentPlayerId={null}
      />

      {isHost && !showCustom && (
        <Button
          variant="secondary"
          size="sm"
          className="w-full"
          onClick={() => setShowCustom(true)}
        >
          Add custom prompts
        </Button>
      )}

      {isHost && showCustom && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-gray-700">
              Custom prompts ({prompts.length}/{MAX_CUSTOM_PROMPTS})
            </p>
            <button
              type="button"
              className="text-xs text-violet-600 hover:text-violet-800"
              onClick={() => setShowCustom(false)}
            >
              Done
            </button>
          </div>

          {prompts.length < MAX_CUSTOM_PROMPTS && (
            <form onSubmit={handleAddPrompt} className="flex gap-2">
              <Input
                name="custom-prompt"
                placeholder="Type a prompt…"
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                className="flex-1 text-sm"
                autoFocus
              />
              <Button
                type="submit"
                size="sm"
                disabled={!draft.trim()}
              >
                Add
              </Button>
            </form>
          )}

          {prompts.length > 0 && (
            <ul className="space-y-1.5 max-h-48 overflow-y-auto">
              {prompts.map((text, i) => (
                <li
                  key={i}
                  className="flex items-start justify-between gap-2 bg-violet-50 rounded-lg px-3 py-2 text-sm text-violet-900"
                >
                  <span className="flex-1 break-words">{text}</span>
                  <button
                    type="button"
                    className="text-violet-400 hover:text-red-500 shrink-0 text-xs mt-0.5"
                    onClick={() => handleRemovePrompt(i)}
                  >
                    Remove
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {!isHost && (
        <p className="text-center text-gray-400 text-sm">
          Waiting for the host to start the game…
        </p>
      )}
    </div>
  );
}
