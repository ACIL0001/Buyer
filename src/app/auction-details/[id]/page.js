import AuctionDetailsClient from "./AuctionDetailsClient";
import app from "@/config";
import { normalizeImageUrl } from "@/utils/url";

export async function generateMetadata(props) {
  const params = await props.params;
  const id = params.id;
  
  if (!id) {
    return {
      title: "Auction Details - MazadClick",
    };
  }

  try {
    // Fetch auction data server-side
    // using fetch directly to avoid axios issues on server or complex interceptors
    const res = await fetch(`${app.baseURL}bid/${id}`, {
      headers: { 
        'x-access-key': app.apiKey,
        'Content-Type': 'application/json'
      },
      next: { revalidate: 0 } // No cache to ensure fresh data
    });
    
    if (!res.ok) {
       console.error("Metadata fetch failed:", res.status, res.statusText);
       return {
            title: "Auction Details - MazadClick",
            description: "View details about this auction on MazadClick",
       };
    }

    const json = await res.json();
    const auction = json.data || json; 

    // Get title and description
    const title = auction.title || auction.name || "Auction Item";
    const description = auction.description || "Bid on this item at MazadClick";

    // Get image URL
    let imageUrl = "/assets/images/logo-dark.png";
    if (auction.thumbs && auction.thumbs.length > 0) {
        imageUrl = auction.thumbs[0].url || auction.thumbs[0].fullUrl;
    } else if (auction.images && auction.images.length > 0) {
        imageUrl = auction.images[0];
    } else if (auction.image) {
        imageUrl = auction.image;
    }
    
    // Normalize image URL to be absolute
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
    console.error("Error generating metadata:", error);
    return {
      title: "Auction Details - MazadClick",
    };
  }
}

export default async function AuctionDetailsPage(props) {
  const params = await props.params;
  return (
    <AuctionDetailsClient params={params} />
  );
} 