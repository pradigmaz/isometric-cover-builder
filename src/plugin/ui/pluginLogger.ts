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
    try {
      fetch('http://127.0.0.1:9876/plugin-log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'plugin-error',
          message: msg,
          args: args.map((a) => (typeof a === 'object' ? JSON.stringify(a) : String(a))),
          time: Date.now(),
        }),
      }).catch(() => {});
    } catch {
      // Local debug bridge server is optional
    }
  },
};
