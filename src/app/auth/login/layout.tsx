import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'MazadClick Connection - Connexion',
  description: "Connectez-vous à votre compte MazadClick pour accéder aux enchères B2B, soumissions et opportunités uniques pour les entreprises algériennes.",
  keywords: 'mazadclick connection, connexion mazadclick, login mazadclick, se connecter mazadclick, compte mazadclick',
  openGraph: {
    title: 'MazadClick Connection - Connexion',
    description: "Connectez-vous à votre compte MazadClick pour accéder aux enchères B2B, soumissions et opportunités uniques pour les entreprises algériennes.",
    type: 'website',
  },
  twitter: {
    title: 'MazadClick Connection - Connexion',
    description: "Connectez-vous à votre compte MazadClick pour accéder aux enchères B2B, soumissions et opportunités uniques pour les entreprises algériennes.",
  },
};

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}


