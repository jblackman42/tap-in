/** Hand → wood flip-in (staggered in `flipHand`). Do not change without visual QA. */
export const WOOD_PILE_PERSPECTIVE_PX = 880;

export const woodFlipTransition = {
  duration: 0.11,
  ease: [0.22, 1, 0.36, 1] as const,
};

export const woodFlipInitial = { rotateY: 86, opacity: 0.9 };
export const woodFlipAnimate = { rotateY: 0, opacity: 1 };
