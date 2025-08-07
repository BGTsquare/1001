import { LegalSection, LegalSubsection, LegalList } from './legal-section';
import { TERMS_CONTENT } from '@/lib/legal/terms-content';

interface TermsContentRendererProps {
  className?: string;
}

export function TermsContentRenderer({ className = '' }: TermsContentRendererProps) {
  const renderContent = (key: keyof typeof TERMS_CONTENT) => {
    const section = TERMS_CONTENT[key];
    
    return (
      <LegalSection key={key} id={key} title={section.title} className={className}>
        {'content' in section && Array.isArray(section.content) && (
          <>
            {section.content.map((paragraph, index) => (
              <p key={index}>{paragraph}</p>
            ))}
          </>
        )}
        
        {'content' in section && typeof section.content === 'string' && (
          <p>{section.content}</p>
        )}
        
        {'list' in section && section.list && (
          <LegalList items={section.list} />
        )}
        
        {'subsections' in section && section.subsections && (
          <>
            {section.subsections.map((subsection, index) => (
              <LegalSubsection key={index} title={subsection.title}>
                <p>{subsection.content}</p>
                {subsection.list && <LegalList items={subsection.list} />}
              </LegalSubsection>
            ))}
          </>
        )}
      </LegalSection>
    );
  };

  return (
    <div className="space-y-8">
      {Object.keys(TERMS_CONTENT).map((key) => 
        renderContent(key as keyof typeof TERMS_CONTENT)
      )}
    </div>
  );
}