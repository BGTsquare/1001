import { cn } from '@/lib/utils';

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {}

function Skeleton({ className, ...props }: SkeletonProps) {
  return (
    <div
      className={cn('animate-pulse rounded-md bg-muted', className)}
      {...props}
    />
  );
}

const LoadingSkeletons = {
  Text: ({ className, ...props }: SkeletonProps) => (
    <Skeleton className={cn('h-4 w-full', className)} {...props} />
  ),
  
  Button: ({ className, ...props }: SkeletonProps) => (
    <Skeleton className={cn('h-10 w-24', className)} {...props} />
  ),
  
  Card: ({ className, ...props }: SkeletonProps) => (
    <div className={cn('space-y-3', className)} {...props}>
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-4/5" />
      <Skeleton className="h-4 w-3/5" />
    </div>
  ),
  
  Avatar: ({ className, ...props }: SkeletonProps) => (
    <Skeleton className={cn('h-10 w-10 rounded-full', className)} {...props} />
  ),
  
  Image: ({ className, ...props }: SkeletonProps) => (
    <Skeleton className={cn('h-48 w-full', className)} {...props} />
  ),
};

export { LoadingSkeletons, Skeleton };