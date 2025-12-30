import React from 'react';
import { Container, Typography, Paper, Divider, Box } from '@mui/material';

export const metadata = {
  title: 'Conditions d\'Utilisation - MazadClick',
  description: 'Conditions générales d\'utilisation de la plateforme MazadClick',
};

export default function TermsConditionPage() {
  return (
    <Container maxWidth="lg" sx={{ py: 6, minHeight: '100vh' }}>
      <Paper 
        elevation={3} 
        sx={{ 
          p: { xs: 3, md: 6 },
          borderRadius: 2,
          background: 'linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(255,255,255,1) 100%)'
        }}
      >
        <Typography 
          variant="h3" 
          gutterBottom 
          sx={{ 
            fontWeight: 700,
            background: 'linear-gradient(135deg, #1976d2 0%, #0d47a1 100%)',
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            mb: 2
          }}
        >
          Conditions d'Utilisation
        </Typography>
        
        <Typography variant="body2" color="text.secondary" paragraph>
          Dernière mise à jour : {new Date().toLocaleDateString('fr-FR')}
        </Typography>
        
        <Divider sx={{ my: 4 }} />
        
        <Typography variant="h5" gutterBottom sx={{ mt: 4, fontWeight: 600 }}>
          1. Acceptation des Conditions
        </Typography>
        <Typography variant="body1" paragraph>
          En accédant et en utilisant la plateforme MazadClick, vous acceptez d'être lié par ces conditions 
          d'utilisation. Si vous n'acceptez pas ces conditions, veuillez ne pas utiliser nos services.
        </Typography>
        
        <Typography variant="h5" gutterBottom sx={{ mt: 4, fontWeight: 600 }}>
          2. Description du Service
        </Typography>
        <Typography variant="body1" paragraph>
          MazadClick est une plateforme en ligne qui permet aux utilisateurs de :
        </Typography>
        <Box component="ul" sx={{ pl: 4 }}>
          <li><Typography variant="body1" paragraph>Participer à des enchères en ligne</Typography></li>
          <li><Typography variant="body1" paragraph>Acheter et vendre des produits via des ventes directes</Typography></li>
          <li><Typography variant="body1" paragraph>Soumettre et répondre à des appels d'offres</Typography></li>
          <li><Typography variant="body1" paragraph>Communiquer avec d'autres utilisateurs via le système de messagerie</Typography></li>
        </Box>

        <Typography variant="h5" gutterBottom sx={{ mt: 4, fontWeight: 600 }}>
          3. Inscription et Compte Utilisateur
        </Typography>
        <Typography variant="body1" paragraph>
          Pour utiliser nos services, vous devez :
        </Typography>
        <Box component="ul" sx={{ pl: 4 }}>
          <li><Typography variant="body1" paragraph>Créer un compte avec des informations exactes et à jour</Typography></li>
          <li><Typography variant="body1" paragraph>Vérifier votre numéro de téléphone via OTP</Typography></li>
          <li><Typography variant="body1" paragraph>Maintenir la confidentialité de vos identifiants de connexion</Typography></li>
          <li><Typography variant="body1" paragraph>Être responsable de toutes les activités effectuées depuis votre compte</Typography></li>
        </Box>

        <Typography variant="h5" gutterBottom sx={{ mt: 4, fontWeight: 600 }}>
          4. Règles des Enchères
        </Typography>
        <Typography variant="body1" paragraph>
          Les enchères sur MazadClick sont soumises aux règles suivantes :
        </Typography>
        <Box component="ul" sx={{ pl: 4 }}>
          <li><Typography variant="body1" paragraph>Toutes les enchères sont contraignantes une fois placées</Typography></li>
          <li><Typography variant="body1" paragraph>Le plus haut enchérisseur à la fin de l'enchère remporte l'article</Typography></li>
          <li><Typography variant="body1" paragraph>Les enchères frauduleuses ou manipulatrices sont strictement interdites</Typography></li>
          <li><Typography variant="body1" paragraph>MazadClick se réserve le droit d'annuler toute enchère suspecte</Typography></li>
        </Box>

        <Typography variant="h5" gutterBottom sx={{ mt: 4, fontWeight: 600 }}>
          5. Obligations des Vendeurs
        </Typography>
        <Typography variant="body1" paragraph>
          Les vendeurs sur la plateforme s'engagent à :
        </Typography>
        <Box component="ul" sx={{ pl: 4 }}>
          <li><Typography variant="body1" paragraph>Fournir des descriptions précises et honnêtes des produits</Typography></li>
          <li><Typography variant="body1" paragraph>Respecter les délais de livraison convenus</Typography></li>
          <li><Typography variant="body1" paragraph>Livrer les produits dans l'état décrit</Typography></li>
          <li><Typography variant="body1" paragraph>Communiquer de manière professionnelle avec les acheteurs</Typography></li>
        </Box>

        <Typography variant="h5" gutterBottom sx={{ mt: 4, fontWeight: 600 }}>
          6. Obligations des Acheteurs
        </Typography>
        <Typography variant="body1" paragraph>
          Les acheteurs s'engagent à :
        </Typography>
        <Box component="ul" sx={{ pl: 4 }}>
          <li><Typography variant="body1" paragraph>Honorer toutes les enchères gagnées et offres acceptées</Typography></li>
          <li><Typography variant="body1" paragraph>Effectuer les paiements dans les délais convenus</Typography></li>
          <li><Typography variant="body1" paragraph>Communiquer de manière respectueuse avec les vendeurs</Typography></li>
          <li><Typography variant="body1" paragraph>Signaler tout problème via les canaux appropriés</Typography></li>
        </Box>

        <Typography variant="h5" gutterBottom sx={{ mt: 4, fontWeight: 600 }}>
          7. Contenu Interdit
        </Typography>
        <Typography variant="body1" paragraph>
          Il est strictement interdit de publier ou vendre :
        </Typography>
        <Box component="ul" sx={{ pl: 4 }}>
          <li><Typography variant="body1" paragraph>Des articles illégaux ou contrefaits</Typography></li>
          <li><Typography variant="body1" paragraph>Du contenu offensant, discriminatoire ou inapproprié</Typography></li>
          <li><Typography variant="body1" paragraph>Des articles qui violent les droits de propriété intellectuelle</Typography></li>
          <li><Typography variant="body1" paragraph>Des produits dangereux ou non conformes aux réglementations</Typography></li>
        </Box>

        <Typography variant="h5" gutterBottom sx={{ mt: 4, fontWeight: 600 }}>
          8. Frais et Commissions
        </Typography>
        <Typography variant="body1" paragraph>
          MazadClick peut prélever des frais de service et des commissions sur certaines transactions. 
          Tous les frais applicables seront clairement communiqués avant la finalisation de toute transaction.
        </Typography>

        <Typography variant="h5" gutterBottom sx={{ mt: 4, fontWeight: 600 }}>
          9. Résolution des Litiges
        </Typography>
        <Typography variant="body1" paragraph>
          En cas de litige entre utilisateurs, MazadClick peut intervenir en tant que médiateur. 
          Nous encourageons toujours une résolution à l'amiable en premier lieu.
        </Typography>

        <Typography variant="h5" gutterBottom sx={{ mt: 4, fontWeight: 600 }}>
          10. Limitation de Responsabilité
        </Typography>
        <Typography variant="body1" paragraph>
          MazadClick agit en tant que plateforme intermédiaire et n'est pas responsable des transactions 
          entre utilisateurs. Nous ne garantissons pas la qualité, la sécurité ou la légalité des articles listés.
        </Typography>

        <Typography variant="h5" gutterBottom sx={{ mt: 4, fontWeight: 600 }}>
          11. Suspension et Résiliation de Compte
        </Typography>
        <Typography variant="body1" paragraph>
          MazadClick se réserve le droit de suspendre ou résilier tout compte utilisateur qui :
        </Typography>
        <Box component="ul" sx={{ pl: 4 }}>
          <li><Typography variant="body1" paragraph>Viole ces conditions d'utilisation</Typography></li>
          <li><Typography variant="body1" paragraph>Engage des activités frauduleuses</Typography></li>
          <li><Typography variant="body1" paragraph>Reçoit de multiples plaintes fondées d'autres utilisateurs</Typography></li>
          <li><Typography variant="body1" paragraph>Nuit à la réputation ou au fonctionnement de la plateforme</Typography></li>
        </Box>

        <Typography variant="h5" gutterBottom sx={{ mt: 4, fontWeight: 600 }}>
          12. Modifications des Conditions
        </Typography>
        <Typography variant="body1" paragraph>
          Nous nous réservons le droit de modifier ces conditions à tout moment. Les utilisateurs seront 
          notifiés des changements importants et l'utilisation continue de la plateforme constituera 
          l'acceptation des nouvelles conditions.
        </Typography>

        <Typography variant="h5" gutterBottom sx={{ mt: 4, fontWeight: 600 }}>
          13. Loi Applicable
        </Typography>
        <Typography variant="body1" paragraph>
          Ces conditions sont régies par les lois algériennes. Tout litige sera soumis à la juridiction 
          exclusive des tribunaux algériens.
        </Typography>

        <Typography variant="h5" gutterBottom sx={{ mt: 4, fontWeight: 600 }}>
          14. Contact
        </Typography>
        <Typography variant="body1" paragraph>
          Pour toute question concernant ces conditions d'utilisation, veuillez nous contacter à :
        </Typography>
        <Typography variant="body1" paragraph>
          Email: <strong>legal@mazadclick.com</strong><br />
          Support: <strong>support@mazadclick.com</strong>
        </Typography>

        <Divider sx={{ my: 4 }} />

        <Typography variant="body2" color="text.secondary" align="center">
          © {new Date().getFullYear()} MazadClick. Tous droits réservés.
        </Typography>
      </Paper>
    </Container>
  );
}
