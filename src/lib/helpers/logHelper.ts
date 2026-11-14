type LogLevel = 'LOG' | 'WARN' | 'ERROR';
// Kept in memory for the downloadable log file. console.debug is not kept: it is for routine detail
// that is only useful while watching the browser console.
const MAX_LOG_ENTRIES = 2000;
const MAX_LINE_LENGTH = 2000;
const logs: string[] = [];

// JSON.stringify writes an Error (or DOMException) as "{}", so write its name, message and stack instead.
function formatError(error: Error): string {
  const head = `${error.name}: ${error.message}`;
  const stack = error.stack ?? "";
  // Chrome's stack starts with the same "name: message" line; Firefox and Safari's do not.
  const frames = stack.startsWith(head) ? stack.slice(head.length) : stack ? `\n${stack}` : "";
  const { cause: reason } = error as { cause?: unknown };
  const cause = reason !== undefined ? `\nCaused by: ${formatArg(reason)}` : "";
  return head + frames + cause;
}

function formatArg(arg: unknown): string {
  if (typeof arg === 'string') return arg;
  if (arg instanceof Error) return formatError(arg);
  // DOMException is not an Error subclass in every browser.
  if (typeof DOMException !== 'undefined' && arg instanceof DOMException) return `${arg.name}: ${arg.message}`;
  if (arg === undefined) return 'undefined';
  try {
    return JSON.stringify(arg) ?? String(arg);
  } catch {
    return String(arg);
  }
}

function record(level: LogLevel, args: unknown[]) {
  let message = args.map(formatArg).join(' ');
  if (message.length > MAX_LINE_LENGTH) {
    message = `${message.slice(0, MAX_LINE_LENGTH)}…(trimmed ${message.length - MAX_LINE_LENGTH} characters)`;
  }
  logs.push(`[${new Date().toISOString()}] [${level}] ${message}`);
  if (logs.length > MAX_LOG_ENTRIES) {
    logs.shift(); // Remove oldest log to stay within limit
  }
}

function logInterceptor(
  level: LogLevel,
  originalFn: (...args: any[]) => void
): (...args: any[]) => void {
  return (...args: any[]) => {
    record(level, args);
    // Forward the call to the original console method
    originalFn.apply(console, args);
  };
}

// Override global console methods
console.log = logInterceptor('LOG', console.log);
console.info = logInterceptor('LOG', console.info);
console.warn = logInterceptor('WARN', console.warn);
console.error = logInterceptor('ERROR', console.error);

// Crashes and failed promises nobody caught: the browser prints these itself, so only record them.
if (typeof window !== 'undefined') {
  window.addEventListener('error', (event) => {
    record('ERROR', ['Uncaught:', event.error ?? `${event.message} (${event.filename}:${event.lineno}:${event.colno})`]);
  });
  window.addEventListener('unhandledrejection', (event) => {
    record('ERROR', ['Unhandled promise rejection:', event.reason]);
  });
}

let buildDate: string | undefined;
// Written at the top of the downloaded file, so it can't be pushed out of the buffer.
export function setBuildDateForLogs(date: string) {
  buildDate = date;
}

export function getLogText() {
  const header = `Matsuri log, ${new Date().toISOString()}\nBuild: ${buildDate ?? "unknown"}\nPage: ${window.location.pathname}\nBrowser: ${navigator.userAgent}\n`;
  return header + "\n" + logs.join("\n");
}

export function downloadLogs() {
  downloadFile(getLogText(), "text/plain", `logs_${formatExportDate(new Date())}.txt`);
}

function formatExportDate(date = new Date()) {
  const pad = (n: number) => String(n).padStart(2, '0');

  const year = date.getFullYear();
  const month = pad(date.getMonth() + 1); // getMonth() is 0-based
  const day = pad(date.getDate());
  const hours = pad(date.getHours());
  const minutes = pad(date.getMinutes());
  const seconds = pad(date.getSeconds());

  return `${year}${month}${day}${hours}${minutes}${seconds}`;
}

function downloadFile(data: string, type: string, fileName: string) {
  const blob = new Blob([data], { type: type });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;

  document.body.appendChild(link);
  link.click();

  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}