'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';

export default function OGDebugPage() {
  const searchParams = useSearchParams();
  const [url, setUrl] = useState('');
  const [metaTags, setMetaTags] = useState<any[]>([]);

  useEffect(() => {
    // Get all meta tags from current page
    const allMetaTags = Array.from(document.querySelectorAll('meta'));
    const ogTags = allMetaTags
      .filter(tag => 
        tag.getAttribute('property')?.startsWith('og:') || 
        tag.getAttribute('name')?.startsWith('twitter:')
      )
      .map(tag => ({
        property: tag.getAttribute('property') || tag.getAttribute('name'),
        content: tag.getAttribute('content'),
      }));
    
    setMetaTags(ogTags);
  }, []);

  const handleCheckUrl = () => {
    if (url) {
      // Open social media debugging tools in new tabs
      window.open(`https://developers.facebook.com/tools/debug/?q=${encodeURIComponent(url)}`, '_blank');
      window.open(`https://www.linkedin.com/post-inspector/?url=${encodeURIComponent(url)}`, '_blank');
      window.open(`https://cards-dev.twitter.com/validator?url=${encodeURIComponent(url)}`, '_blank');
    }
  };

  return (
    <div style={{ padding: '40px', maxWidth: '1200px', margin: '0 auto', fontFamily: 'system-ui' }}>
      <h1 style={{ marginBottom: '30px' }}>🔍 Open Graph Metadata Debugger</h1>
      
      <div style={{ marginBottom: '40px', padding: '20px', background: '#f5f5f5', borderRadius: '8px' }}>
        <h2 style={{ marginBottom: '15px' }}>Test a URL</h2>
        <p style={{ marginBottom: '15px', color: '#666' }}>
          Enter a full URL to test how it will appear when shared on social media platforms.
        </p>
        <input
          type="text"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://mazadclick.vercel.app/direct-sale/123"
          style={{
            width: '100%',
            padding: '12px',
            fontSize: '16px',
            border: '1px solid #ddd',
            borderRadius: '6px',
            marginBottom: '15px',
          }}
        />
        <button
          onClick={handleCheckUrl}
          disabled={!url}
          style={{
            padding: '12px 24px',
            fontSize: '16px',
            background: url ? '#667eea' : '#ccc',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: url ? 'pointer' : 'not-allowed',
          }}
        >
          Open Social Media Debuggers
        </button>
        
        <div style={{ marginTop: '20px', padding: '15px', background: '#e3f2fd', borderRadius: '6px' }}>
          <strong>Testing Tools:</strong>
          <ul style={{ marginTop: '10px', paddingLeft: '20px' }}>
            <li><a href="https://developers.facebook.com/tools/debug/" target="_blank" rel="noopener noreferrer">Facebook Sharing Debugger</a></li>
            <li><a href="https://www.linkedin.com/post-inspector/" target="_blank" rel="noopener noreferrer">LinkedIn Post Inspector</a></li>
            <li><a href="https://cards-dev.twitter.com/validator" target="_blank" rel="noopener noreferrer">Twitter Card Validator</a></li>
          </ul>
        </div>
      </div>

      <div style={{ marginBottom: '40px' }}>
        <h2 style={{ marginBottom: '15px' }}>Current Page Meta Tags</h2>
        {metaTags.length > 0 ? (
          <table style={{ width: '100%', borderCollapse: 'collapse', background: 'white' }}>
            <thead>
              <tr style={{ background: '#f5f5f5' }}>
                <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #ddd' }}>Property</th>
                <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #ddd' }}>Content</th>
              </tr>
            </thead>
            <tbody>
              {metaTags.map((tag, idx) => (
                <tr key={idx} style={{ borderBottom: '1px solid #eee' }}>
                  <td style={{ padding: '12px', fontFamily: 'monospace', fontSize: '14px' }}>{tag.property}</td>
                  <td style={{ padding: '12px', fontSize: '14px', wordBreak: 'break-all' }}>{tag.content}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p style={{ color: '#999', padding: '20px', background: '#f9f9f9', borderRadius: '6px' }}>
            No Open Graph or Twitter Card meta tags found on this page.
          </p>
        )}
      </div>

      <div style={{ padding: '20px', background: '#fff3cd', borderRadius: '8px', borderLeft: '4px solid #ffc107' }}>
        <h3 style={{ marginTop: 0 }}>⚠️ Important Notes</h3>
        <ul style={{ marginBottom: 0, paddingLeft: '20px' }}>
          <li><strong>Localhost URLs won't work</strong>: Social media platforms cannot access localhost. You must test on a deployed URL.</li>
          <li><strong>Image requirements</strong>: Images must be publicly accessible, preferably 1200x630px for optimal display.</li>
          <li><strong>Cache clearing</strong>: If you've made changes, use the "Scrape Again" or "Refresh" button in the debugging tools.</li>
          <li><strong>HTTPS required</strong>: Most platforms require HTTPS URLs for images and pages.</li>
        </ul>
      </div>
    </div>
  );
}
