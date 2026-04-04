"use client";

import type { Coordinate } from "./types";
import { GRID_SIZE } from "./types";

export type AttackCellState =
  | "untouched"
  | "selected"
  | "miss"
  | "hit"
  | "sunk";

export type DefenseCellState =
  | "empty"
  | "ship"
  | "hit"
  | "sunk"
  /** Opponent fired here but missed (open water) */
  | "miss";

export interface AttackGridProps {
  mode: "attack";
  cellStates: Record<string, AttackCellState>;
  onCellTap?: (coord: Coordinate) => void;
  disabled?: boolean;
  /** Cells that belong to a ship being sunk this moment (for sunk-moment pulse) */
  sunkMomentCells?: Set<string>;
}

export interface DefenseGridProps {
  mode: "defense";
  cellStates: Record<string, DefenseCellState>;
  /** Cells that belong to a ship being sunk this moment */
  sunkMomentCells?: Set<string>;
}

type GridProps = AttackGridProps | DefenseGridProps;

const COL_LABELS = ["A", "B", "C", "D", "E", "F", "G", "H"];

function coordKey(col: number, row: number): string {
  return `${col},${row}`;
}

export function Grid(props: GridProps) {
  const isAttack = props.mode === "attack";
  const isSunkMoment = (col: number, row: number) =>
    props.sunkMomentCells?.has(coordKey(col, row)) ?? false;

  function getCellContent(col: number, row: number) {
    const key = coordKey(col, row);
    const sunkPulse = isSunkMoment(col, row);

    if (isAttack) {
      const state = (props as AttackGridProps).cellStates[key] ?? "untouched";
      const onTap = (props as AttackGridProps).onCellTap;
      const disabled = (props as AttackGridProps).disabled ?? false;
      const tappable =
        !disabled && (state === "untouched" || state === "selected");

      let cellClass =
        "relative flex items-center justify-center transition-all duration-150 select-none ";
      let inner: React.ReactNode = null;

      switch (state) {
        case "untouched":
          cellClass += "bg-surface border border-foreground/20 active:scale-95 ";
          if (!disabled) cellClass += "cursor-pointer hover:bg-secondary/10 ";
          break;
        case "selected":
          cellClass +=
            "bg-blue-100 border-2 border-blue-500 cursor-pointer active:scale-95 ";
          inner = (
            <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
          );
          break;
        case "miss":
          cellClass += "bg-surface border border-foreground/20 cursor-default ";
          inner = <div className="w-2 h-2 rounded-full bg-gray-400" />;
          break;
        case "hit":
          cellClass += "bg-red-500 border border-red-700 cursor-default ";
          inner = (
            <span className="text-white font-bold text-sm leading-none select-none">
              ✕
            </span>
          );
          break;
        case "sunk":
          cellClass +=
            "border border-red-900 cursor-default ";
          cellClass += sunkPulse ? "bg-red-800 ka-sunk-pulse " : "bg-red-800 ";
          inner = (
            <span className="text-white font-bold text-sm leading-none select-none opacity-80">
              ✕
            </span>
          );
          break;
      }

      return (
        <button
          key={key}
          className={cellClass + "w-full h-full rounded-sm"}
          onClick={tappable ? () => onTap?.({ col, row }) : undefined}
          disabled={!tappable}
          aria-label={`${COL_LABELS[col]}${row + 1}`}
        >
          {inner}
        </button>
      );
    } else {
      // Defense grid — read only
      const state = (props as DefenseGridProps).cellStates[key] ?? "empty";
      const sunkPulse = isSunkMoment(col, row);

      let cellClass =
        "relative flex items-center justify-center rounded-sm transition-colors duration-300 ";
      let inner: React.ReactNode = null;

      switch (state) {
        case "empty":
          cellClass += "bg-surface border border-foreground/10 ";
          break;
        case "miss":
          cellClass += "bg-surface border border-foreground/10 ";
          inner = <div className="w-2 h-2 rounded-full bg-gray-400" />;
          break;
        case "ship":
          cellClass += "bg-secondary/70 border border-secondary ";
          break;
        case "hit":
          cellClass += "bg-red-500 border border-red-700 ";
          inner = (
            <span className="text-white font-bold text-xs leading-none select-none">
              ✕
            </span>
          );
          break;
        case "sunk":
          cellClass += sunkPulse
            ? "bg-foreground border border-foreground ka-sunk-pulse "
            : "bg-foreground border border-foreground ";
          inner = (
            <span className="text-surface font-bold text-xs leading-none select-none opacity-70">
              ✕
            </span>
          );
          break;
      }

      return (
        <div key={key} className={cellClass + "w-full h-full"}>
          {inner}
        </div>
      );
    }
  }

  return (
    <div className="flex flex-col gap-0.5">
      {/* Column labels */}
      <div
        className="grid gap-0.5"
        style={{ gridTemplateColumns: `20px repeat(${GRID_SIZE}, 1fr)` }}
      >
        <div />
        {COL_LABELS.map((label) => (
          <div
            key={label}
            className="text-center text-[9px] font-label font-bold text-outline/60 uppercase tracking-widest leading-none pb-0.5"
          >
            {label}
          </div>
        ))}
      </div>

      {/* Rows */}
      {Array.from({ length: GRID_SIZE }, (_, row) => (
        <div
          key={row}
          className="grid gap-0.5"
          style={{ gridTemplateColumns: `20px repeat(${GRID_SIZE}, 1fr)` }}
        >
          {/* Row label */}
          <div className="flex items-center justify-center text-[9px] font-label font-bold text-outline/60 leading-none">
            {row + 1}
          </div>
          {/* Cells */}
          {Array.from({ length: GRID_SIZE }, (_, col) => (
            <div key={col} className="aspect-square">
              {getCellContent(col, row)}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
