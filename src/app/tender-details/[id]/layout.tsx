// Layout for tender details - metadata is generated dynamically by the page
export default function TenderDetailsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div style={{
      minHeight: '100vh',
      background: '#f8f9fa',
      paddingTop: '0px',
      paddingBottom: '50px',
    }}>
      {children}
    </div>
  );
}
