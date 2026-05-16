import Brand from './Brand';

interface LoadingStateProps {
  label?: string;
}

export default function LoadingState({ label = 'Warming up your workspace' }: LoadingStateProps) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-bg bg-panel-gradient">
      <div className="flex flex-col items-center gap-5">
        <div className="animate-icon-pop">
          <Brand size="lg" withWordmark={false} />
        </div>
        <div className="flex items-center gap-3">
          <span className="h-2 w-2 animate-pulse rounded-full bg-accent" />
          <p className="text-sm font-medium text-muted">{label}</p>
        </div>
      </div>
    </div>
  );
}
