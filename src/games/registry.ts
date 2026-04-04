import { registerGame } from "@/lib/engine/registry";
// import { hotTakeGame } from "./hot-take";
import { blitzkriegGame } from "./blitzkrieg";
import { quipProQuoGame } from "./quip-pro-quo";
import { fibOrFableGame } from "./fib-or-fable";
import { kayakAttackGame } from "./kayak-attack";

// registerGame(hotTakeGame);
registerGame(blitzkriegGame);
registerGame(quipProQuoGame);
registerGame(fibOrFableGame);
registerGame(kayakAttackGame);
