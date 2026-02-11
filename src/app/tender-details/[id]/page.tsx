import TenderDetailsClient from "./TenderDetailsClient";
import app from "@/config";
import { normalizeImageUrl } from "@/utils/url";

export async function generateMetadata(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const id = params.id;
  
  if (!id) {
    return { title: "Tender Details - MazadClick" };
  }

  try {
    const res = await fetch(`${app.baseURL}tender/${id}`, {
      headers: { 
        'x-access-key': app.apiKey,
        'Content-Type': 'application/json'
      },
      next: { revalidate: 0 }
    });
    
    if (!res.ok) {
       return { title: "Tender Details - MazadClick" };
    }

    const json = await res.json();
    const tender = json.data || json; 

    // Tender title and description
    const title = tender.title || tender.name || "Tender Details";
    const description = tender.description || "View this tender on MazadClick";

    // Image logic
    let imageUrl = "/assets/images/logo-dark.png";
    if (tender.attachments && tender.attachments.length > 0) {
        imageUrl = tender.attachments[0].url;
    } else if (tender.images && tender.images.length > 0) {
        imageUrl = tender.images[0];
    }
    
    // Normalize image URL
    const fullImageUrl = normalizeImageUrl(imageUrl);

    return {
      title: `${title} - MazadClick`,
      description: description,
      openGraph: {
        title: title,
        description: description,
        images: fullImageUrl ? [
          {
            url: fullImageUrl,
            width: 800,
            height: 600,
            alt: title,
          },
        ] : [],
        siteName: 'MazadClick',
        type: "website",
      },
      twitter: {
        card: "summary_large_image",
        title: title,
        description: description,
        images: fullImageUrl ? [fullImageUrl] : [],
      },
    };
  } catch (error) {
    console.error("Tender metadata error:", error);
    return { title: "Tender Details - MazadClick" };
  }
}

export default function TenderDetailsPage() {
  return <TenderDetailsClient />;
}