import React from 'react';
import Header from '@/components/header/Header';
import Footer from '@/components/footer/Footer';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: "Notice d'information relative à la protection des données à caractère personnel Mazad Click",
  description: 'Notice de protection des personnes physiques dans le traitement de leurs données à caractère personnel sur MazadClick, conformément à la loi algérienne n° 18-07.',
};

export default function PrivacyPolicy() {
  return (
    <>
      <Header />
      <main className="privacy-policy-main" style={{ 
        paddingBottom: '60px',
        paddingLeft: '20px',
        paddingRight: '20px',
        maxWidth: '900px', 
        margin: '0 auto', 
        fontFamily: '"DM Sans", sans-serif', 
        color: '#1e293b',
        backgroundColor: '#ffffff'
      }}>
        {/* Banner Section */}
        <div style={{
          textAlign: 'center',
          marginBottom: '50px',
          background: 'linear-gradient(135deg, #f8fafc 0%, #eff6ff 100%)',
          padding: '40px 20px',
          borderRadius: '24px',
          border: '1px solid rgba(0, 99, 177, 0.1)',
          boxShadow: '0 4px 20px rgba(0, 40, 150, 0.02)'
        }}>
          <h1 style={{ 
            color: '#062C90', 
            fontSize: '32px', 
            fontWeight: '800',
            letterSpacing: '-0.02em',
            lineHeight: '1.3',
            margin: 0
          }}>
            Notice d'information relative à la protection des données à caractère personnel Mazad Click
          </h1>
        </div>

        {/* Content Sections */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
          
          {/* Section 1 */}
          <section style={{
            padding: '30px',
            borderRadius: '20px',
            border: '1px solid #f1f5f9',
            backgroundColor: '#ffffff',
            boxShadow: '0 4px 12px rgba(0,0,0,0.01)',
            transition: 'transform 0.2s ease'
          }}>
            <h2 style={{ fontSize: '20px', color: '#062C90', marginBottom: '14px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '28px', height: '28px', borderRadius: '8px', backgroundColor: '#eff6ff', color: '#0063b1', fontSize: '14px', fontWeight: '800' }}>1</span>
              Objet et cadre légal
            </h2>
            <p style={{ lineHeight: '1.7', color: '#334155', fontSize: '15px' }}>
              Bienvenue sur MazadClick. Cette notice fixe les règles de protection des personnes physiques dans le traitement de leurs données à caractère personnel. Nous traitons vos données dans le respect de la vie privée et des libertés publiques, conformément à la <strong>loi algérienne n° 18-07 du 10 juin 2018</strong> (modifiée et complétée par la loi n° 25-11 du 24 juillet 2025).
            </p>
          </section>

          {/* Section 2 */}
          <section style={{
            padding: '30px',
            borderRadius: '20px',
            border: '1px solid #f1f5f9',
            backgroundColor: '#ffffff',
            boxShadow: '0 4px 12px rgba(0,0,0,0.01)'
          }}>
            <h2 style={{ fontSize: '20px', color: '#062C90', marginBottom: '14px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '28px', height: '28px', borderRadius: '8px', backgroundColor: '#eff6ff', color: '#0063b1', fontSize: '14px', fontWeight: '800' }}>2</span>
              Responsable du traitement
            </h2>
            <p style={{ lineHeight: '1.7', color: '#334155', fontSize: '15px' }}>
              Le responsable du traitement des données est la plateforme MazadClick.
            </p>
          </section>

          {/* Section 3 */}
          <section style={{
            padding: '30px',
            borderRadius: '20px',
            border: '1px solid #f1f5f9',
            backgroundColor: '#ffffff',
            boxShadow: '0 4px 12px rgba(0,0,0,0.01)'
          }}>
            <h2 style={{ fontSize: '20px', color: '#062C90', marginBottom: '14px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '28px', height: '28px', borderRadius: '8px', backgroundColor: '#eff6ff', color: '#0063b1', fontSize: '14px', fontWeight: '800' }}>3</span>
              Données collectées
            </h2>
            <p style={{ lineHeight: '1.7', color: '#334155', fontSize: '15px', marginBottom: '16px' }}>
              Conformément à la loi, nous collectons les informations nécessaires à l'utilisation de la plateforme :
            </p>
            <ul style={{ listStyleType: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <li style={{ padding: '12px 16px', borderRadius: '12px', backgroundColor: '#f8fafc', borderLeft: '4px solid #0063b1' }}>
                <strong style={{ color: '#0f172a' }}>● Identification :</strong> Nom, prénom, numéro de téléphone mobile, adresse email.
              </li>
              <li style={{ padding: '12px 16px', borderRadius: '12px', backgroundColor: '#f8fafc', borderLeft: '4px solid #0063b1' }}>
                <strong style={{ color: '#0f172a' }}>● Entreprises (Vendeurs) :</strong> Registre de commerce, Numéro d'identité fiscale (NIF), Numéro d'identification statistique (NIS).
              </li>
              <li style={{ padding: '12px 16px', borderRadius: '12px', backgroundColor: '#f8fafc', borderLeft: '4px solid #0063b1' }}>
                <strong style={{ color: '#0f172a' }}>● Navigation (Cookies) :</strong> Traceurs (ex: Meta Pixel) pour l'analyse statistique, activés uniquement avec votre consentement.
              </li>
              <li style={{ padding: '12px 16px', borderRadius: '12px', backgroundColor: '#f8fafc', borderLeft: '4px solid #0063b1' }}>
                <strong style={{ color: '#0f172a' }}>● Paiement :</strong> Historiques et notifications techniques des refus et échecs de paiement (date, heure, montant et motif).
              </li>
            </ul>
          </section>

          {/* Section 4 */}
          <section style={{
            padding: '30px',
            borderRadius: '20px',
            border: '1px solid #f1f5f9',
            backgroundColor: '#ffffff',
            boxShadow: '0 4px 12px rgba(0,0,0,0.01)'
          }}>
            <h2 style={{ fontSize: '20px', color: '#062C90', marginBottom: '14px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '28px', height: '28px', borderRadius: '8px', backgroundColor: '#eff6ff', color: '#0063b1', fontSize: '14px', fontWeight: '800' }}>4</span>
              Finalités du traitement
            </h2>
            <p style={{ lineHeight: '1.7', color: '#334155', fontSize: '15px', marginBottom: '16px' }}>
              Vos données sont collectées pour des buts précis et légitimes :
            </p>
            <ul style={{ listStyleType: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <li style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#334155', fontSize: '15px' }}>
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#0063b1', flexShrink: 0 }} />
                Création, gestion et accès à votre compte utilisateur.
              </li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#334155', fontSize: '15px' }}>
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#0063b1', flexShrink: 0 }} />
                Validation, suivi et sécurisation de vos enchères et transactions.
              </li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#334155', fontSize: '15px' }}>
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#0063b1', flexShrink: 0 }} />
                Gestion technique des échecs de paiement (prévention de la fraude, support client et preuve en cas de litige).
              </li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#334155', fontSize: '15px' }}>
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#0063b1', flexShrink: 0 }} />
                Notifications et assistance par le service client.
              </li>
            </ul>
          </section>

          {/* Section 5 */}
          <section style={{
            padding: '30px',
            borderRadius: '20px',
            border: '1px solid #f1f5f9',
            backgroundColor: '#ffffff',
            boxShadow: '0 4px 12px rgba(0,0,0,0.01)'
          }}>
            <h2 style={{ fontSize: '20px', color: '#062C90', marginBottom: '14px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '28px', height: '28px', borderRadius: '8px', backgroundColor: '#eff6ff', color: '#0063b1', fontSize: '14px', fontWeight: '800' }}>5</span>
              Consentement exprès
            </h2>
            <p style={{ lineHeight: '1.7', color: '#334155', fontSize: '15px' }}>
              Le traitement de vos données repose sur votre consentement exprès. Pour les cookies (Meta Pixel), il est recueilli lors de votre première visite. Conformément à l'article 7 de la loi, vous pouvez vous rétracter et retirer ce consentement à tout moment.
            </p>
          </section>

          {/* Section 6 */}
          <section style={{
            padding: '30px',
            borderRadius: '20px',
            border: '1px solid #f1f5f9',
            backgroundColor: '#ffffff',
            boxShadow: '0 4px 12px rgba(0,0,0,0.01)'
          }}>
            <h2 style={{ fontSize: '20px', color: '#062C90', marginBottom: '14px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '28px', height: '28px', borderRadius: '8px', backgroundColor: '#eff6ff', color: '#0063b1', fontSize: '14px', fontWeight: '800' }}>6</span>
              Redirection et données bancaires
            </h2>
            <p style={{ lineHeight: '1.7', color: '#334155', fontSize: '15px' }}>
              Lors du paiement en ligne, vous êtes redirigé vers l'interface sécurisée de notre établissement bancaire partenaire. La saisie s'effectue directement sur le site de la banque : MazadClick ne collecte et ne conserve aucune coordonnée bancaire (numéros de carte, codes de sécurité).
            </p>
          </section>

          {/* Section 7 */}
          <section style={{
            padding: '30px',
            borderRadius: '20px',
            border: '1px solid #f1f5f9',
            backgroundColor: '#ffffff',
            boxShadow: '0 4px 12px rgba(0,0,0,0.01)'
          }}>
            <h2 style={{ fontSize: '20px', color: '#062C90', marginBottom: '14px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '28px', height: '28px', borderRadius: '8px', backgroundColor: '#eff6ff', color: '#0063b1', fontSize: '14px', fontWeight: '800' }}>7</span>
              Hébergement et transfert à l'étranger
            </h2>
            <ul style={{ listStyleType: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <li style={{ padding: '12px 16px', borderRadius: '12px', backgroundColor: '#f8fafc', borderLeft: '4px solid #0063b1' }}>
                <strong style={{ color: '#0f172a' }}>● Hébergeur :</strong> Les données sont stockées sur les serveurs de la sociétéxxxxxxxxxx situés en xxxxxxxxxxxxxxxx.
              </li>
              <li style={{ padding: '12px 16px', borderRadius: '12px', backgroundColor: '#f8fafc', borderLeft: '4px solid #0063b1' }}>
                <strong style={{ color: '#0f172a' }}>● Sécurité :</strong> Cet hébergeur applique des mesures techniques rigoureuses (chiffrement, pare-feu) conformément à l'article 38 de la loi n° 18-07.
              </li>
              <li style={{ padding: '12px 16px', borderRadius: '12px', backgroundColor: '#f8fafc', borderLeft: '4px solid #0063b1' }}>
                <strong style={{ color: '#0f172a' }}>● Cadre légal :</strong> Ce stockage hors d'Algérie constitue un transfert transfrontalier (Art. 44). MazadClick s'engage à accomplir toutes les formalités de déclaration ou d'autorisation requises auprès de l'Autorité Nationale (ANPDP).
              </li>
            </ul>
          </section>

          {/* Section 8 */}
          <section style={{
            padding: '30px',
            borderRadius: '20px',
            border: '1px solid #f1f5f9',
            backgroundColor: '#ffffff',
            boxShadow: '0 4px 12px rgba(0,0,0,0.01)'
          }}>
            <h2 style={{ fontSize: '20px', color: '#062C90', marginBottom: '14px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '28px', height: '28px', borderRadius: '8px', backgroundColor: '#eff6ff', color: '#0063b1', fontSize: '14px', fontWeight: '800' }}>8</span>
              Destinataires des données
            </h2>
            <p style={{ lineHeight: '1.7', color: '#334155', fontSize: '15px' }}>
              Vos données ne sont communiquées qu'aux personnes directement liées aux fonctions du site (ex: mise en relation entre l'acheteur et le vendeur pour finaliser une vente). Nous ne vendons jamais vos données.
            </p>
          </section>

          {/* Section 9 */}
          <section style={{
            padding: '30px',
            borderRadius: '20px',
            border: '1px solid #f1f5f9',
            backgroundColor: '#ffffff',
            boxShadow: '0 4px 12px rgba(0,0,0,0.01)'
          }}>
            <h2 style={{ fontSize: '20px', color: '#062C90', marginBottom: '14px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '28px', height: '28px', borderRadius: '8px', backgroundColor: '#eff6ff', color: '#0063b1', fontSize: '14px', fontWeight: '800' }}>9</span>
              Durée de conservation
            </h2>
            <p style={{ lineHeight: '1.7', color: '#334155', fontSize: '15px' }}>
              Conformément à la loi, vos données sont conservées uniquement pendant la durée nécessaire aux finalités du traitement (durée d'activation du compte, augmentée des délais de prescription légaux et fiscaux).
            </p>
          </section>

          {/* Section 10 */}
          <section style={{
            padding: '30px',
            borderRadius: '20px',
            border: '1px solid #f1f5f9',
            backgroundColor: '#ffffff',
            boxShadow: '0 4px 12px rgba(0,0,0,0.01)'
          }}>
            <h2 style={{ fontSize: '20px', color: '#062C90', marginBottom: '14px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '28px', height: '28px', borderRadius: '8px', backgroundColor: '#eff6ff', color: '#0063b1', fontSize: '14px', fontWeight: '800' }}>10</span>
              Sécurité et secret professionnel
            </h2>
            <p style={{ lineHeight: '1.7', color: '#334155', fontSize: '15px' }}>
              MazadClick met en œuvre les mesures techniques et organisationnelles appropriées pour protéger vos données contre toute perte, altération ou accès non autorisé. Notre personnel est strictement tenu au secret professionnel.
            </p>
          </section>

          {/* Section 11 */}
          <section style={{
            padding: '30px',
            borderRadius: '20px',
            border: '1px solid #f1f5f9',
            backgroundColor: '#ffffff',
            boxShadow: '0 4px 12px rgba(0,0,0,0.01)'
          }}>
            <h2 style={{ fontSize: '20px', color: '#062C90', marginBottom: '14px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '28px', height: '28px', borderRadius: '8px', backgroundColor: '#eff6ff', color: '#0063b1', fontSize: '14px', fontWeight: '800' }}>11</span>
              Droits de la personne concernée
            </h2>
            <p style={{ lineHeight: '1.7', color: '#334155', fontSize: '15px', marginBottom: '16px' }}>
              En application des articles 32 à 36 de la loi n° 18-07, vous pouvez exercer à titre gratuit les droits suivants :
            </p>
            <ul style={{ listStyleType: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <li style={{ padding: '12px 16px', borderRadius: '12px', backgroundColor: '#f8fafc', borderLeft: '4px solid #0063b1' }}>
                <strong style={{ color: '#0f172a' }}>● Droit à l'information :</strong> Connaître les finalités et les destinataires du traitement.
              </li>
              <li style={{ padding: '12px 16px', borderRadius: '12px', backgroundColor: '#f8fafc', borderLeft: '4px solid #0063b1' }}>
                <strong style={{ color: '#0f172a' }}>● Droit d'accès :</strong> Confirmer le traitement de vos données et en obtenir une copie.
              </li>
              <li style={{ padding: '12px 16px', borderRadius: '12px', backgroundColor: '#f8fafc', borderLeft: '4px solid #0063b1' }}>
                <strong style={{ color: '#0f172a' }}>● Droit de rectification :</strong> Corriger, actualiser ou effacer vos données inexactes ou incomplètes.
              </li>
              <li style={{ padding: '12px 16px', borderRadius: '12px', backgroundColor: '#f8fafc', borderLeft: '4px solid #0063b1' }}>
                <strong style={{ color: '#0f172a' }}>● Droit d'opposition :</strong> Vous opposer, pour motifs légitimes, à un traitement ou à la prospection commerciale.
              </li>
            </ul>
          </section>

          {/* Section 12 */}
          <section style={{
            padding: '30px',
            borderRadius: '20px',
            border: '1px solid #f1f5f9',
            backgroundColor: '#ffffff',
            boxShadow: '0 4px 12px rgba(0,0,0,0.01)'
          }}>
            <h2 style={{ fontSize: '20px', color: '#062C90', marginBottom: '14px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '28px', height: '28px', borderRadius: '8px', backgroundColor: '#eff6ff', color: '#0063b1', fontSize: '14px', fontWeight: '800' }}>12</span>
              Contact et recours
            </h2>
            <p style={{ lineHeight: '1.7', color: '#334155', fontSize: '15px' }}>
              Pour exercer vos droits, écrivez à : <a href="mailto:contact@mazadclick.com" style={{ color: '#0063b1', textDecoration: 'none', fontWeight: '600' }}>contact@mazadclick.com</a>. En cas de refus ou d'absence de réponse de notre part sous dix (10) jours, vous pouvez introduire une réclamation auprès de l'Autorité Nationale de Protection des Données à Caractère Personnel (ANPDP).
            </p>
          </section>

        </div>
      </main>
      <style dangerouslySetInnerHTML={{__html: `
        .privacy-policy-main {
          padding-top: 220px;
        }
        @media (max-width: 992px) {
          .privacy-policy-main {
            padding-top: 90px;
          }
        }
        @media (max-width: 768px) {
          .privacy-policy-main {
            padding-top: 85px;
          }
        }
        @media (max-width: 375px) {
          .privacy-policy-main {
            padding-top: 80px;
          }
        }
      `}} />
      <Footer />
    </>
  );
}
