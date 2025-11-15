import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Mazad Click Inscription - Créer un Compte',
  description: "Inscrivez-vous sur MazadClick, la plateforme B2B d'enchères et de soumissions dédiée aux entreprises algériennes. Créez votre compte et découvrez des opportunités uniques.",
  keywords: "mazad click inscription, inscription mazadclick, créer compte mazadclick, s'inscrire mazadclick, register mazadclick",
  openGraph: {
    title: 'Mazad Click Inscription - Créer un Compte',
    description: "Inscrivez-vous sur MazadClick, la plateforme B2B d'enchères et de soumissions dédiée aux entreprises algériennes. Créez votre compte et découvrez des opportunités uniques.",
    type: 'website',
  },
  twitter: {
    title: 'Mazad Click Inscription - Créer un Compte',
    description: "Inscrivez-vous sur MazadClick, la plateforme B2B d'enchères et de soumissions dédiée aux entreprises algériennes. Créez votre compte et découvrez des opportunités uniques.",
  },
};

export default function RegisterLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}


