import DirectSaleDetailsClient from "./DirectSaleDetailsClient";
import app from "@/config";
import { normalizeImageUrl } from "@/utils/url";

export async function generateMetadata(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const id = params.id;
  
  if (!id) {
    return { title: "Direct Sale Details - MazadClick" };
  }

  try {
    const res = await fetch(`${app.baseURL}direct-sales/${id}`, {
      headers: { 
        'x-access-key': app.apiKey,
        'Content-Type': 'application/json'
      },
      next: { revalidate: 0 }
    });
    
    if (!res.ok) {
       return { title: "Direct Sale Details - MazadClick" };
    }

    const json = await res.json();
    const directSale = json.data || json; 

    // Title and description
    const title = directSale.title || directSale.name || "Direct Sale Details";
    const description = directSale.description || "View this product on MazadClick";

    // Image logic
    let imageUrl = "/assets/images/logo-dark.png";
    if (directSale.thumbs && directSale.thumbs.length > 0) {
        imageUrl = directSale.thumbs[0].url;
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
    console.error("Direct Sale metadata error:", error);
    return { title: "Direct Sale Details - MazadClick" };
  }
}

export default function DirectSaleDetailsPage() {
  return <DirectSaleDetailsClient />;
}
