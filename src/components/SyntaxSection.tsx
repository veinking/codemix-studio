import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { CodeExample } from './CodeExample';

interface SyntaxExample {
  title: string;
  code: string;
  explanation: string;
}

interface SyntaxSectionProps {
  title: string;
  icon?: string;
  examples: SyntaxExample[];
  language: string;
}

export const SyntaxSection = ({ title, icon, examples, language }: SyntaxSectionProps) => {
  return (
    <div className="space-y-3">
      <h3 className="text-lg font-semibold flex items-center gap-2">
        {icon && <span>{icon}</span>}
        {title}
      </h3>
      
      <Accordion type="multiple" className="space-y-2">
        {examples.map((example, index) => (
          <AccordionItem
            key={index}
            value={`${title}-${index}`}
            className="border rounded-lg px-4 bg-card"
          >
            <AccordionTrigger className="text-sm hover:no-underline">
              {example.title}
            </AccordionTrigger>
            <AccordionContent>
              <CodeExample
                code={example.code}
                language={language}
                explanation={example.explanation}
              />
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  );
};
