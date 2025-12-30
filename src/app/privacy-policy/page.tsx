import React from 'react';
import { Box, Container, Typography, Paper, Divider } from '@mui/material';

export const metadata = {
  title: 'Politique de Confidentialité - MazadClick',
  description: 'Politique de confidentialité de MazadClick',
};

export default function PrivacyPolicyPage() {
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
          Politique de Confidentialité
        </Typography>
        
        <Typography variant="body2" color="text.secondary" paragraph>
          Dernière mise à jour : {new Date().toLocaleDateString('fr-FR')}
        </Typography>
        
        <Divider sx={{ my: 4 }} />
        
        <Typography variant="h5" gutterBottom sx={{ mt: 4, fontWeight: 600 }}>
          1. Introduction
        </Typography>
        <Typography variant="body1" paragraph>
          Bienvenue sur MazadClick. Nous accordons une grande importance à la protection de vos données personnelles. 
          Cette politique de confidentialité explique comment nous collectons, utilisons et protégeons vos informations.
        </Typography>
        
        <Typography variant="h5" gutterBottom sx={{ mt: 4, fontWeight: 600 }}>
          2. Collecte des Informations
        </Typography>
        <Typography variant="body1" paragraph>
          Nous collectons les informations suivantes :
        </Typography>
        <Box component="ul" sx={{ pl: 4 }}>
          <li><Typography variant="body1" paragraph>Informations d'identification (nom, prénom, email, téléphone)</Typography></li>
          <li><Typography variant="body1" paragraph>Informations de profil et photos</Typography></li>
          <li><Typography variant="body1" paragraph>Historique des enchères et transactions</Typography></li>
          <li><Typography variant="body1" paragraph>Données de navigation et cookies</Typography></li>
        </Box>

        <Typography variant="h5" gutterBottom sx={{ mt: 4, fontWeight: 600 }}>
          3. Utilisation des Données
        </Typography>
        <Typography variant="body1" paragraph>
          Vos données sont utilisées pour :
        </Typography>
        <Box component="ul" sx={{ pl: 4 }}>
          <li><Typography variant="body1" paragraph>Fournir et améliorer nos services</Typography></li>
          <li><Typography variant="body1" paragraph>Gérer les enchères et les ventes</Typography></li>
          <li><Typography variant="body1" paragraph>Communiquer avec vous concernant votre compte</Typography></li>
          <li><Typography variant="body1" paragraph>Assurer la sécurité de la plateforme</Typography></li>
        </Box>

        <Typography variant="h5" gutterBottom sx={{ mt: 4, fontWeight: 600 }}>
          4. Protection des Données
        </Typography>
        <Typography variant="body1" paragraph>
          Nous mettons en œuvre des mesures de sécurité techniques et organisationnelles appropriées pour protéger 
          vos données personnelles contre tout accès non autorisé, perte ou destruction.
        </Typography>

        <Typography variant="h5" gutterBottom sx={{ mt: 4, fontWeight: 600 }}>
          5. Vos Droits
        </Typography>
        <Typography variant="body1" paragraph>
          Vous disposez des droits suivants concernant vos données personnelles :
        </Typography>
        <Box component="ul" sx={{ pl: 4 }}>
          <li><Typography variant="body1" paragraph>Droit d'accès à vos données</Typography></li>
          <li><Typography variant="body1" paragraph>Droit de rectification</Typography></li>
          <li><Typography variant="body1" paragraph>Droit à l'effacement</Typography></li>
          <li><Typography variant="body1" paragraph>Droit à la portabilité</Typography></li>
        </Box>

        <Typography variant="h5" gutterBottom sx={{ mt: 4, fontWeight: 600 }}>
          6. Cookies
        </Typography>
        <Typography variant="body1" paragraph>
          Nous utilisons des cookies pour améliorer votre expérience sur notre plateforme. Vous pouvez gérer vos 
          préférences en matière de cookies dans les paramètres de votre navigateur.
        </Typography>

        <Typography variant="h5" gutterBottom sx={{ mt: 4, fontWeight: 600 }}>
          7. Contact
        </Typography>
        <Typography variant="body1" paragraph>
          Pour toute question concernant cette politique de confidentialité, veuillez nous contacter à :
        </Typography>
        <Typography variant="body1" paragraph>
          Email: <strong>privacy@mazadclick.com</strong>
        </Typography>

        <Divider sx={{ my: 4 }} />

        <Typography variant="body2" color="text.secondary" align="center">
          © {new Date().getFullYear()} MazadClick. Tous droits réservés.
        </Typography>
      </Paper>
    </Container>
  );
}
