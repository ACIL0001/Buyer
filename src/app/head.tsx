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
      <link rel="icon" href="/assets/icon.png" type="image/png" sizes="any" />
      <link rel="alternate icon" href="/assets/icon.png" type="image/png" sizes="32x32" />
      <link rel="apple-touch-icon" href="/assets/icon.png" />
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
    </>
  );
}


