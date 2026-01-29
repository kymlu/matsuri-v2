type LogLevel = 'LOG' | 'WARN' | 'ERROR';
const MAX_LOG_ENTRIES = 500;
const logs: string[] = [];

function logInterceptor(
  level: LogLevel,
  originalFn: (...args: any[]) => void
): (...args: any[]) => void {
  return (...args: any[]) => {
    const message = args
      .map(arg => {
        try {
          return typeof arg === 'string' ? arg : JSON.stringify(arg);
        } catch {
          return String(arg);
        }
      })
      .join(' ');

    const timestamp = new Date().toISOString();
    logs.push(`[${timestamp}] [${level}] ${message}`);
    if (logs.length > MAX_LOG_ENTRIES) {
      logs.shift(); // Remove oldest log to stay within limit
    }

    // Forward the call to the original console method
    originalFn.apply(console, args);
  };
}

// Override global console methods
console.log = logInterceptor('LOG', console.log);
console.warn = logInterceptor('WARN', console.warn);
console.error = logInterceptor('ERROR', console.error);

export function downloadLogs() {
  downloadFile(logs.join("\n"), "text/plain", `logs_${formatExportDate(new Date())}.txt`);
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