import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '../../../../components/ui/accordion';

export function TopicAccordion({ items }) {
  return (
    <Accordion type="single" collapsible className="space-y-2">
      {items.map((item) => (
        <AccordionItem 
          key={item.id} 
          value={item.id}
          className="bg-[#0B0B1A] border border-gray-800/30 rounded-lg overflow-hidden data-[state=open]:border-[#6C63FF]/30"
        >
          <AccordionTrigger className="px-4 py-3 hover:bg-gray-800/30 text-white hover:no-underline">
            {item.title}
          </AccordionTrigger>
          <AccordionContent className="px-4 pb-4 text-gray-400 border-t border-gray-800/30">
            {item.content}
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
}
