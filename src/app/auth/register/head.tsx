const PAGE_DESCRIPTION =
  "Inscrivez-vous sur MazadClick, la plateforme B2B d'enchères et de soumissions dédiée aux entreprises algériennes. Créez votre compte et découvrez des opportunités uniques.";

export default function Head() {
  return (
    <>
      <title>Mazad Click Inscription - Créer un Compte</title>
      <meta name="description" content={PAGE_DESCRIPTION} />
      <meta
        name="keywords"
        content="mazad click inscription, inscription mazadclick, créer compte mazadclick, s'inscrire mazadclick, register mazadclick"
      />
      <meta property="og:title" content="Mazad Click Inscription - Créer un Compte" />
      <meta property="og:description" content={PAGE_DESCRIPTION} />
      <meta property="og:type" content="website" />
      <meta property="twitter:title" content="Mazad Click Inscription - Créer un Compte" />
      <meta property="twitter:description" content={PAGE_DESCRIPTION} />
    </>
  );
}


