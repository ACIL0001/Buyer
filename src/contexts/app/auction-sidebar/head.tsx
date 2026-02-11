const PAGE_DESCRIPTION =
  "Parcourez les enchères MazadClick, découvrez des articles uniques et participez facilement aux ventes en ligne.";

export default function Head() {
  return (
    <>
      <title>MazadClick - Enchères</title>
      <meta name="description" content={PAGE_DESCRIPTION} />
      <meta property="og:title" content="MazadClick - Enchères" />
      <meta property="og:description" content={PAGE_DESCRIPTION} />
      <meta property="twitter:title" content="MazadClick - Enchères" />
      <meta property="twitter:description" content={PAGE_DESCRIPTION} />
    </>
  );
}



