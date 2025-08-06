import Script from 'next/script';

interface StructuredDataProps {
  data: string;
  id?: string;
}

export function StructuredData({ data, id }: StructuredDataProps) {
  return (
    <Script
      id={id || 'structured-data'}
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: data }}
    />
  );
}

interface MultipleStructuredDataProps {
  dataArray: Array<{ data: string; id: string }>;
}

export function MultipleStructuredData({ dataArray }: MultipleStructuredDataProps) {
  return (
    <>
      {dataArray.map(({ data, id }) => (
        <StructuredData key={id} data={data} id={id} />
      ))}
    </>
  );
}