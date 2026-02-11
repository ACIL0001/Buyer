
import { AuctionsAPI } from '@/app/api/auctions';
import { DirectSaleAPI } from '@/app/api/direct-sale';
import { TendersAPI } from '@/app/api/tenders';

// Force dynamic rendering so fetch happens on request
export const dynamic = 'force-dynamic';

export default async function FetchTestPage({ params }: { params: Promise<{ type: string, id: string }> }) {
  const { type, id } = await params;
  let data = null;
  let error = null;

  try {
    if (type === 'auction') {
      data = await AuctionsAPI.getAuctionById(id);
    } else if (type === 'direct-sale') {
      data = await DirectSaleAPI.getDirectSaleById(id);
    } else if (type === 'tender') {
      data = await TendersAPI.getTenderById(id);
    } else {
      throw new Error('Invalid type. Use: auction, direct-sale, tender');
    }
  } catch (err: any) {
    error = err.message + (err.response ? ` Status: ${err.response.status}` : '');
    console.error('Fetch Check Failed:', err);
  }

  return (
    <div style={{ padding: 40, fontFamily: 'monospace', whiteSpace: 'pre-wrap' }}>
      <h1>Server-Side Fetch Test</h1>
      <p>Type: {type}</p>
      <p>ID: {id}</p>
      
      <hr />
      
      {error ? (
        <div style={{ color: 'red', border: '1px solid red', padding: 20 }}>
          <h2>❌ Fetch Failed</h2>
          <p>{error}</p>
        </div>
      ) : (
        <div style={{ color: 'green', border: '1px solid green', padding: 20 }}>
          <h2>✅ Fetch Successful</h2>
          <details open>
            <summary>Raw Data</summary>
            {JSON.stringify(data, null, 2)}
          </details>
        </div>
      )}
    </div>
  );
}
