interface SoftwareApplicationSchemaProps {
  language: string;
  languageName: string;
  description: string;
}

export const SoftwareApplicationSchema = ({ language, languageName, description }: SoftwareApplicationSchemaProps) => {
  const schema = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "name": `bIDE - ${languageName} Online IDE`,
    "applicationCategory": "DeveloperApplication",
    "operatingSystem": "Web Browser",
    "description": description,
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "USD"
    },
    "programmingLanguage": {
      "@type": "ComputerLanguage",
      "name": languageName,
      "url": `https://codemixapp.com/docs/${language}`
    },
    "featureList": [
      "Online code editor",
      "Syntax highlighting",
      "Code autocompletion",
      "AI code assistance",
      "Mobile-friendly interface",
      "Offline support",
      "No installation required"
    ],
    "screenshot": "https://codemixapp.com/bide-og-preview.png?v=2",
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": "4.8",
      "reviewCount": "1247"
    }
  };

  return (
    <script 
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
};
