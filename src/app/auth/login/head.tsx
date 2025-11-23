const PAGE_DESCRIPTION =
  "Connectez-vous à votre compte MazadClick pour accéder aux enchères B2B, soumissions et opportunités uniques pour les entreprises algériennes.";

export default function Head() {
  return (
    <>
      <title>MazadClick Connection - Connexion</title>
      <meta name="description" content={PAGE_DESCRIPTION} />
      <meta
        name="keywords"
        content="mazadclick connection, connexion mazadclick, login mazadclick, se connecter mazadclick, compte mazadclick"
      />
      <meta property="og:title" content="MazadClick Connection - Connexion" />
      <meta property="og:description" content={PAGE_DESCRIPTION} />
      <meta property="og:type" content="website" />
      <meta property="twitter:title" content="MazadClick Connection - Connexion" />
      <meta property="twitter:description" content={PAGE_DESCRIPTION} />
    </>
  );
}







