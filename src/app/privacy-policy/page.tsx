import React from 'react';
import Header from '@/components/header/Header';
import Footer from '@/components/footer/Footer';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Politique de Confidentialité | MazadClick',
  description: 'Politique de Confidentialité et gestion des données personnelles sur MazadClick, conformément au RGPD.',
};

export default function PrivacyPolicy() {
  return (
    <>
      <Header />
      <main style={{ padding: '40px 20px', maxWidth: '800px', margin: '0 auto', fontFamily: '"DM Sans", sans-serif', color: '#1e293b' }}>
        <h1 style={{ color: '#002896', fontSize: '36px', marginBottom: '20px', fontWeight: 'bold' }}>Politique de Confidentialité</h1>
        <p style={{ fontSize: '14px', color: '#64748b', marginBottom: '40px' }}>Dernière mise à jour : {new Date().toLocaleDateString('fr-FR')}</p>

        <section style={{ marginBottom: '30px' }}>
          <h2 style={{ fontSize: '24px', color: '#002896', marginBottom: '15px' }}>1. Introduction</h2>
          <p style={{ lineHeight: '1.6', marginBottom: '10px' }}>
            Bienvenue sur MazadClick. Nous accordons une grande importance à la confidentialité de vos données personnelles. 
            Cette politique explique comment nous collectons, utilisons, partageons et protégeons vos informations lorsque vous utilisez notre plateforme, 
            conformément aux réglementations en vigueur (dont le RGPD).
          </p>
        </section>

        <section style={{ marginBottom: '30px' }}>
          <h2 style={{ fontSize: '24px', color: '#002896', marginBottom: '15px' }}>2. Données Collectées</h2>
          <p style={{ lineHeight: '1.6', marginBottom: '10px' }}>
            Nous collectons les informations suivantes :
          </p>
          <ul style={{ paddingLeft: '20px', lineHeight: '1.6' }}>
            <li><strong>Données d'identification :</strong> Nom, prénom, adresse email, numéro de téléphone.</li>
            <li><strong>Données d'entreprise :</strong> Registre de commerce, NIF, NIS, statuts juridiques (pour les vendeurs vérifiés).</li>
            <li><strong>Données techniques :</strong> Adresse IP, type de navigateur, journaux de connexion.</li>
            <li><strong>Cookies et traceurs :</strong> Nous utilisons des cookies pour le fonctionnement du site et le suivi analytique (ex: Meta Pixel).</li>
          </ul>
        </section>

        <section style={{ marginBottom: '30px' }}>
          <h2 style={{ fontSize: '24px', color: '#002896', marginBottom: '15px' }}>3. Utilisation de vos Données</h2>
          <p style={{ lineHeight: '1.6', marginBottom: '10px' }}>
            Vos données sont utilisées pour :
          </p>
          <ul style={{ paddingLeft: '20px', lineHeight: '1.6' }}>
            <li>Créer et gérer votre compte utilisateur.</li>
            <li>Sécuriser et valider vos enchères et transactions.</li>
            <li>Vous envoyer des notifications liées à vos activités sur la plateforme.</li>
            <li>Améliorer notre plateforme via des analyses statistiques anonymisées.</li>
          </ul>
        </section>

        <section style={{ marginBottom: '30px' }}>
          <h2 style={{ fontSize: '24px', color: '#002896', marginBottom: '15px' }}>4. Partage des Données</h2>
          <p style={{ lineHeight: '1.6', marginBottom: '10px' }}>
            Nous ne vendons <strong>jamais</strong> vos données personnelles. Elles peuvent être partagées uniquement avec :
          </p>
          <ul style={{ paddingLeft: '20px', lineHeight: '1.6' }}>
            <li>Nos prestataires de paiement sécurisés.</li>
            <li>Les autorités légales en cas de réquisition judiciaire.</li>
            <li>L'autre partie de la transaction (acheteur/vendeur) pour finaliser une vente.</li>
          </ul>
        </section>

        <section style={{ marginBottom: '30px' }}>
          <h2 style={{ fontSize: '24px', color: '#002896', marginBottom: '15px' }}>5. Cookies et Consentement (Meta Pixel)</h2>
          <p style={{ lineHeight: '1.6', marginBottom: '10px' }}>
            Notre plateforme utilise des cookies pour améliorer votre expérience. Nous utilisons notamment le <strong>Meta Pixel (Facebook)</strong> pour 
            mesurer l'efficacité de nos campagnes publicitaires. Ce traceur n'est activé que <strong>si vous donnez votre consentement explicite</strong> via 
            notre bannière de cookies à votre première visite. Vous pouvez retirer ce consentement à tout moment en vidant le cache de votre navigateur.
          </p>
        </section>

        <section style={{ marginBottom: '30px' }}>
          <h2 style={{ fontSize: '24px', color: '#002896', marginBottom: '15px' }}>6. Vos Droits (RGPD)</h2>
          <p style={{ lineHeight: '1.6', marginBottom: '10px' }}>
            Conformément à la réglementation (Art. 13 RGPD), vous disposez des droits suivants :
          </p>
          <ul style={{ paddingLeft: '20px', lineHeight: '1.6' }}>
            <li>Droit d'accès à vos données.</li>
            <li>Droit de rectification si vos données sont inexactes.</li>
            <li>Droit à l'effacement (droit à l'oubli).</li>
            <li>Droit de retirer votre consentement à tout moment.</li>
          </ul>
          <p style={{ lineHeight: '1.6', marginTop: '10px' }}>
            Pour exercer ces droits, contactez-nous à : <strong>contact@mazadclick.com</strong>.
          </p>
        </section>

      </main>
      <Footer />
    </>
  );
}
