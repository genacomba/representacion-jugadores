import { AlertTriangle, RotateCw } from "lucide-react";
import Button from "./Button";

export default function ErrorMessage({ message = "Ocurrió un error.", onRetry }) {
  return (
    <div className="flex flex-col items-center gap-3 px-6 py-14 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-danger/10 text-danger">
        <AlertTriangle size={24} strokeWidth={1.5} />
      </div>
      <p className="max-w-xs text-sm text-ink-300">{message}</p>
      {onRetry && (
        <Button variant="secondary" onClick={onRetry}>
          <RotateCw size={16} /> Reintentar
        </Button>
      )}
    </div>
  );
}
