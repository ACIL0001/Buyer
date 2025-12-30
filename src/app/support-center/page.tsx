'use client';

import React from 'react';
import { Container, Typography, Card, CardContent, Paper, Box, Button, Stack } from '@mui/material';
import { Phone, Email, QuestionMark, LiveHelp, Support, ContactSupport } from '@mui/icons-material';
import Link from 'next/link';

export default function SupportCenterPage() {
  return (
    <Container maxWidth="lg" sx={{ py: 6, minHeight: '100vh' }}>
      <Box textAlign="center" mb={6}>
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
          Centre de Support
        </Typography>
        <Typography variant="h6" color="text.secondary" sx={{ maxWidth: 600, mx: 'auto' }}>
          Notre équipe est là pour vous aider. Choisissez le moyen de contact qui vous convient le mieux.
        </Typography>
      </Box>
      
      <Box 
        sx={{ 
          display: 'flex', 
          flexWrap: 'wrap', 
          gap: 4, 
          mb: 6,
          justifyContent: 'center'
        }}
      >
        {/* Phone Support */}
        <Box sx={{ flex: { xs: '1 1 100%', md: '1 1 calc(33.333% - 32px)' }, minWidth: { xs: '100%', md: '280px' } }}>
          <Card 
            sx={{ 
              height: '100%',
              transition: 'all 0.3s ease',
              '&:hover': {
                transform: 'translateY(-8px)',
                boxShadow: 6,
              }
            }}
          >
            <CardContent sx={{ textAlign: 'center', p: 4 }}>
              <Phone sx={{ fontSize: 60, color: 'primary.main', mb: 2 }} />
              <Typography variant="h5" gutterBottom fontWeight={600}>
                Téléphone
              </Typography>
              <Typography variant="body1" color="text.secondary" paragraph>
                Appelez-nous pour une assistance immédiate
              </Typography>
              <Typography variant="h6" color="primary.main" fontWeight={600}>
                +213 XXX XXX XXX
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                Disponible du Lundi au Vendredi<br/>
                9h00 - 18h00
              </Typography>
            </CardContent>
          </Card>
        </Box>
        
        {/* Email Support */}
        <Box sx={{ flex: { xs: '1 1 100%', md: '1 1 calc(33.333% - 32px)' }, minWidth: { xs: '100%', md: '280px' } }}>
          <Card 
            sx={{ 
              height: '100%',
              transition: 'all 0.3s ease',
              '&:hover': {
                transform: 'translateY(-8px)',
                boxShadow: 6,
              }
            }}
          >
            <CardContent sx={{ textAlign: 'center', p: 4 }}>
              <Email sx={{ fontSize: 60, color: 'success.main', mb: 2 }} />
              <Typography variant="h5" gutterBottom fontWeight={600}>
                Email
              </Typography>
              <Typography variant="body1" color="text.secondary" paragraph>
                Envoyez-nous un message
              </Typography>
              <Typography variant="h6" color="success.main" fontWeight={600}>
                support@mazadclick.com
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                Réponse sous 24h<br/>
                (jours ouvrables)
              </Typography>
            </CardContent>
          </Card>
        </Box>
        
        {/* FAQ */}
        <Box sx={{ flex: { xs: '1 1 100%', md: '1 1 calc(33.333% - 32px)' }, minWidth: { xs: '100%', md: '280px' } }}>
          <Card 
            sx={{ 
              height: '100%',
              transition: 'all 0.3s ease',
              '&:hover': {
                transform: 'translateY(-8px)',
                boxShadow: 6,
              }
            }}
          >
            <CardContent sx={{ textAlign: 'center', p: 4 }}>
              <LiveHelp sx={{ fontSize: 60, color: 'warning.main', mb: 2 }} />
              <Typography variant="h5" gutterBottom fontWeight={600}>
                FAQ
              </Typography>
              <Typography variant="body1" color="text.secondary" paragraph>
                Questions fréquemment posées
              </Typography>
              <Button 
                variant="contained" 
                color="warning"
                sx={{ mt: 2 }}
                onClick={() => window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' })}
              >
                Voir les FAQ
              </Button>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                Trouvez rapidement<br/>
                des réponses
              </Typography>
            </CardContent>
          </Card>
        </Box>
      </Box>

      {/* FAQ Section */}
      <Paper elevation={3} sx={{ p: 4, mt: 6, borderRadius: 2 }}>
        <Typography variant="h4" gutterBottom fontWeight={600} sx={{ mb: 4 }}>
          Questions Fréquentes
        </Typography>

        <Box sx={{ mb: 4 }}>
          <Typography variant="h6" fontWeight={600} color="primary" gutterBottom>
            Comment créer un compte sur MazadClick ?
          </Typography>
          <Typography variant="body1" paragraph>
            Cliquez sur "S'inscrire" en haut de la page, remplissez le formulaire avec vos informations 
            et vérifiez votre numéro de téléphone avec le code OTP reçu par SMS.
          </Typography>
        </Box>

        <Box sx={{ mb: 4 }}>
          <Typography variant="h6" fontWeight={600} color="primary" gutterBottom>
            Comment participer à une enchère ?
          </Typography>
          <Typography variant="body1" paragraph>
            Une fois connecté, parcourez les enchères actives, sélectionnez celle qui vous intéresse 
            et placez votre enchère. Vous serez notifié si vous êtes surenchéri.
          </Typography>
        </Box>

        <Box sx={{ mb: 4 }}>
          <Typography variant="h6" fontWeight={600} color="primary" gutterBottom>
            Comment puis-je vendre sur MazadClick ?
          </Typography>
          <Typography variant="body1" paragraph>
            Créez un compte professionnel ou revendeur, puis accédez à votre tableau de bord vendeur 
            pour créer vos enchères, ventes directes ou appels d'offres.
          </Typography>
        </Box>

        <Box sx={{ mb: 4 }}>
          <Typography variant="h6" fontWeight={600} color="primary" gutterBottom>
            Les enchères sont-elles sécurisées ?
          </Typography>
          <Typography variant="body1" paragraph>
            Oui, toutes les transactions sont sécurisées et nous vérifions l'identité de nos utilisateurs. 
            Nous utilisons des protocoles de sécurité avancés pour protéger vos données.
          </Typography>
        </Box>

        <Box sx={{ mb: 4 }}>
          <Typography variant="h6" fontWeight={600} color="primary" gutterBottom>
            Que faire si j'ai oublié mon mot de passe ?
          </Typography>
          <Typography variant="body1" paragraph>
            Cliquez sur "Mot de passe oublié" sur la page de connexion et suivez les instructions 
            pour réinitialiser votre mot de passe via SMS.
          </Typography>
        </Box>

        <Box sx={{ textAlign: 'center', mt: 6, p: 3, bgcolor: 'primary.light', borderRadius: 2 }}>
          <Typography variant="h6" gutterBottom color="white">
            Vous ne trouvez pas ce que vous cherchez ?
          </Typography>
          <Button 
            variant="contained" 
            color="secondary"
            size="large"
            startIcon={<ContactSupport />}
            sx={{ mt: 2 }}
          >
            Contactez-nous
          </Button>
        </Box>
      </Paper>
    </Container>
  );
}
