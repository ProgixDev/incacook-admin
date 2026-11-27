/**
 * One surface for every settings card: the card keeps its border (it is a container, so the border
 * is structure) and gains a soft two-layer shadow for depth. Inner controls use `rounded-sm` (10px)
 * inside the card's `rounded-md` (16px) + 20px padding, so nested corners read as concentric.
 */
export const SETTINGS_CARD = "shadow-[0_1px_2px_rgb(0_0_0/0.04),0_4px_12px_rgb(0_0_0/0.04)]";
