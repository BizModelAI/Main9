// Utility functions for converting markdown to HTML

export const convertMarkdownToHTML = (text: string): string => {
  if (!text) return "";

  // Convert markdown bold syntax (**text**) to HTML
  let htmlText = text.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");

  // Convert markdown italic syntax (*text*) to HTML
  htmlText = htmlText.replace(/\*(.*?)\*/g, "<em>$1</em>");

  // Convert markdown code syntax (`text`) to HTML
  htmlText = htmlText.replace(/`(.*?)`/g, "<code>$1</code>");

  // Convert markdown bullet points (- text) to HTML
  htmlText = htmlText.replace(/^- (.+)$/gm, "<li>$1</li>");

  // Wrap consecutive li elements in ul tags
  htmlText = htmlText.replace(/(<li>.*<\/li>)/g, "<ul>$1</ul>");

  // Convert markdown numbered lists (1. text) to HTML
  htmlText = htmlText.replace(/^\d+\. (.+)$/gm, "<li>$1</li>");

  // Convert line breaks to HTML br tags
  htmlText = htmlText.replace(/\n/g, "<br>");

  return htmlText;
};

export const renderMarkdownContent = (content: string): { __html: string } => {
  return { __html: convertMarkdownToHTML(content) };
};
