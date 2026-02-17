const SITE_DESCRIPTION =
  "MazadClick est la plateforme B2B d'enchères et de soumissions dédiée aux entreprises algériennes. Achetez, vendez et découvrez des opportunités uniques.";

export default function Head() {
  return (
    <>
      <title>MazadClick</title>
      <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover" />
      <meta name="theme-color" content="#0063b1" />
      <meta name="apple-mobile-web-app-capable" content="yes" />
      <meta name="apple-mobile-web-app-status-bar-style" content="default" />
      <meta name="apple-mobile-web-app-title" content="MazadClick" />
      <meta name="mobile-web-app-capable" content="yes" />
      <meta name="format-detection" content="telephone=no" />
      <link rel="icon" href="/assets/icon.png" type="image/png" sizes="32x32" />
      <link rel="icon" href="/assets/icon.png" type="image/png" sizes="192x192" />
      <link rel="shortcut icon" href="/assets/icon.png" type="image/png" />
      <link rel="apple-touch-icon" href="/assets/icon.png" sizes="180x180" />
      <meta name="description" content={SITE_DESCRIPTION} />
      <meta
        name="keywords"
        content="MazadClick, enchères, soumissions, B2B, entreprise, Algérie, marketplace"
      />
      <meta property="og:title" content="MazadClick" />
      <meta property="og:description" content={SITE_DESCRIPTION} />
      <meta property="og:site_name" content="MazadClick" />
      <meta property="twitter:title" content="MazadClick" />
      <meta property="twitter:description" content={SITE_DESCRIPTION} />

      {/* Preload critical assets */}
      <link rel="preload" href="/assets/css/bootstrap.min.css" as="style" />
      <link rel="preload" href="/assets/css/style.css" as="style" />
      
      {/* Load critical CSS */}
      <link rel="stylesheet" href="/assets/css/bootstrap.min.css" precedence="default" />
      <link rel="stylesheet" href="/assets/css/style.css" precedence="default" />

      {/* Defer non-critical CSS */}
      <link rel="stylesheet" href="/assets/css/animate.min.css" media="print" onLoad={(e: any) => { (e.target as any).media = 'all' }} />
      <link rel="stylesheet" href="/assets/css/slick.css" media="print" onLoad={(e: any) => { (e.target as any).media = 'all' }} />
    </>
  );
}


