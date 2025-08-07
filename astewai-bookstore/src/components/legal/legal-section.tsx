import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ReactNode } from 'react';

interface LegalSectionProps {
  id: string;
  title: string;
  children: ReactNode;
  className?: string;
}

export function LegalSection({ id, title, children, className = '' }: LegalSectionProps) {
  return (
    <Card id={id} className={className}>
      <CardHeader>
        <CardTitle className="text-xl">{title}</CardTitle>
      </CardHeader>
      <CardContent className="prose max-w-none">
        {children}
      </CardContent>
    </Card>
  );
}

interface LegalSubsectionProps {
  title: string;
  children: ReactNode;
}

export function LegalSubsection({ title, children }: LegalSubsectionProps) {
  return (
    <div className="mb-4">
      <h4 className="font-semibold mb-2">{title}</h4>
      {children}
    </div>
  );
}

interface LegalListProps {
  items: string[];
  ordered?: boolean;
}

export function LegalList({ items, ordered = false }: LegalListProps) {
  const ListComponent = ordered ? 'ol' : 'ul';
  
  return (
    <ListComponent className={ordered ? 'list-decimal list-inside space-y-1' : 'list-disc list-inside space-y-1'}>
      {items.map((item, index) => (
        <li key={index}>{item}</li>
      ))}
    </ListComponent>
  );
}