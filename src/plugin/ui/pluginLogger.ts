/**
 * Logger for Figma Plugin UI with console formatting and optional local debug bridge
 */
export const pluginLogger = {
  info: (msg: string, ...args: unknown[]) => {
    console.log(`[Figma Plugin] ${msg}`, ...args);
  },
  warn: (msg: string, ...args: unknown[]) => {
    console.warn(`[Figma Plugin WARN] ${msg}`, ...args);
  },
  error: (msg: string, ...args: unknown[]) => {
    console.error(`[Figma Plugin ERROR] ${msg}`, ...args);
  },
};
