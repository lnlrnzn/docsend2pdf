import { HomeClient } from "@/components/home-client";
import { JsonLd } from "@/components/json-ld";

export default function Home() {
  const softwareApp = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "DocSend to PDF",
    url: "https://docsend2pdf.app",
    applicationCategory: "UtilitiesApplication",
    operatingSystem: "Web",
    description:
      "Free online tool to convert DocSend presentations and documents to downloadable PDF files. Supports email-gated and passcode-protected documents.",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
    },
    featureList: [
      "Convert DocSend documents to PDF",
      "Support for email-gated documents",
      "Support for passcode-protected documents",
      "No data stored on server",
      "MCP Server for AI assistants",
    ],
  };

  const faqPage = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: "What is DocSend to PDF?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "DocSend to PDF is a free online tool that converts DocSend presentations and documents into downloadable PDF files. It works by loading each page in a headless browser, capturing the images, and assembling them into a single PDF.",
        },
      },
      {
        "@type": "Question",
        name: "How do I convert a DocSend to PDF?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Paste the DocSend URL (e.g. https://docsend.com/view/abc123) into the input field, optionally enter email and passcode if the document requires them, and click Convert to PDF. The PDF will be ready to download in seconds.",
        },
      },
      {
        "@type": "Question",
        name: "Is anything stored?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "No. Documents are converted on-the-fly and the generated PDF is deleted from the server after download. Nothing is saved permanently.",
        },
      },
      {
        "@type": "Question",
        name: "Are my credentials stored?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "No. Email and passcode are only used for the current conversion request and are never logged or persisted.",
        },
      },
      {
        "@type": "Question",
        name: "When do I need credentials?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Only if the DocSend document requires an email address or passcode to view. If you can open the link without logging in, you can leave the fields empty.",
        },
      },
    ],
  };

  const howTo = {
    "@context": "https://schema.org",
    "@type": "HowTo",
    name: "How to Convert a DocSend Document to PDF",
    description:
      "Step-by-step guide to convert any DocSend link into a downloadable PDF file using DocSend to PDF.",
    step: [
      {
        "@type": "HowToStep",
        position: 1,
        name: "Paste DocSend URL",
        text: "Copy the DocSend link (e.g. https://docsend.com/view/abc123) and paste it into the input field.",
      },
      {
        "@type": "HowToStep",
        position: 2,
        name: "Enter credentials (if needed)",
        text: "If the document requires an email address or passcode, enter them in the optional credentials section.",
      },
      {
        "@type": "HowToStep",
        position: 3,
        name: "Convert to PDF",
        text: "Click the Convert to PDF button. The tool will scrape each page and assemble them into a single PDF file.",
      },
      {
        "@type": "HowToStep",
        position: 4,
        name: "Download the PDF",
        text: "Once the conversion is complete, click the download button to save the PDF to your device.",
      },
    ],
  };

  const organization = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "DocSend2PDF",
    url: "https://docsend2pdf.app",
    logo: "https://docsend2pdf.app/favicon.svg",
  };

  return (
    <>
      <JsonLd data={softwareApp} />
      <JsonLd data={faqPage} />
      <JsonLd data={howTo} />
      <JsonLd data={organization} />
      <HomeClient />
    </>
  );
}
