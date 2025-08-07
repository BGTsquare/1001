import { Card, CardContent } from '@/components/ui/card';
import { Loader2, AlertCircle, Package } from 'lucide-react';

interface LoadingStateProps {
  message?: string;
  className?: string;
}

export function LoadingState({ message = "Loading...", className }: LoadingStateProps) {
  return (
    <Card className={className}>
      <CardContent className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin" />
        <span className="ml-2">{message}</span>
      </CardContent>
    </Card>
  );
}

interface ErrorStateProps {
  message?: string;
  className?: string;
}

export function ErrorState({ message = "Something went wrong", className }: ErrorStateProps) {
  return (
    <Card className={className}>
      <CardContent className="flex items-center justify-center py-8">
        <AlertCircle className="h-6 w-6 text-destructive" />
        <span className="ml-2">{message}</span>
      </CardContent>
    </Card>
  );
}

interface EmptyStateProps {
  title: string;
  description: string;
  icon?: React.ComponentType<{ className?: string }>;
  className?: string;
}

export function EmptyState({ 
  title, 
  description, 
  icon: Icon = Package, 
  className 
}: EmptyStateProps) {
  return (
    <Card className={className}>
      <CardContent className="text-center py-8">
        <Icon className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold mb-2">{title}</h3>
        <p className="text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  );
}