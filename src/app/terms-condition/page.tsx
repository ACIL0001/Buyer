"use client";

import React, { useState, useEffect } from 'react';
import Header from '@/components/header/Header';
import Footer from '@/components/footer/Footer';
import { useTranslation } from 'react-i18next';
import { TermsAPI } from '../api/terms';
import { styled } from '@mui/material/styles';
import * as mammoth from 'mammoth';
import DOMPurify from 'dompurify';
import {
  Typography,
  Box,
  CircularProgress,
  Button,
  Container,
  Paper,
  Divider,
} from '@mui/material';
import Iconify from '@/components/Iconify';
import app from '@/config';

const DocumentPage = styled('div')(({ theme }) => ({
  backgroundColor: '#ffffff',
  width: '100%',
  minHeight: '50vh',
  padding: theme.spacing(3),
  margin: '0 auto',
  color: '#000000',
  fontFamily: '"Times New Roman", Times, serif',
  fontSize: '12pt',
  lineHeight: 1.6,
  overflowWrap: 'break-word',
  '& h1': { fontSize: '24pt', fontWeight: 'bold', marginBottom: '24pt', textAlign: 'center' },
  '& h2': { fontSize: '18pt', fontWeight: 'bold', marginTop: '18pt', marginBottom: '12pt', borderBottom: '1px solid #eee', paddingBottom: '4px' },
  '& h3': { fontSize: '14pt', fontWeight: 'bold', marginTop: '14pt', marginBottom: '10pt' },
  '& p': { marginBottom: '12pt', textAlign: 'justify' },
  '& ul, & ol': { marginBottom: '12pt', paddingLeft: '24pt' },
  '& li': { marginBottom: '6pt' },
  [theme.breakpoints.down('md')]: { padding: theme.spacing(2) },
}));

const getFullUrl = (url: string) => {
  if (!url) return '';
  if (url.startsWith('http') || url.startsWith('blob:') || url.startsWith('data:')) return url;
  const cleanPath = url.startsWith('/') ? url.substring(1) : url;
  const cleanBase = app.route.endsWith('/') ? app.route : `${app.route}/`;
  return `${cleanBase}${cleanPath}`;
};

export default function TermsAndConditions() {
  const { i18n } = useTranslation();
  const [termsContent, setTermsContent] = useState<string>('');
  const [termsAttachment, setTermsAttachment] = useState<{ url: string; mimetype: string; filename?: string } | undefined>(undefined);
  const [termsVersion, setTermsVersion] = useState<string>('');
  const [termsUpdatedAt, setTermsUpdatedAt] = useState<string>('');
  
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isConverting, setIsConverting] = useState<boolean>(false);
  const [conversionError, setConversionError] = useState<boolean>(false);
  const [fetchError, setFetchError] = useState<boolean>(false);
  const [docxContent, setDocxContent] = useState<string>('');

  const isArabic = i18n.language === 'ar';
  const hasArabic = termsContent && /[\u0600-\u06FF]/.test(termsContent);
  const isRtl = isArabic || hasArabic;

  const loadTerms = async () => {
    setIsLoading(true);
    setFetchError(false);
    try {
      const latest: any = await TermsAPI.getLatest();
      let content = '';
      let attachment;
      let version = '';
      let updatedAt = '';

      if (latest?.success && latest?.data) {
        content = latest.data.content;
        attachment = latest.data.attachment;
        version = latest.data.version;
        updatedAt = latest.data.updatedAt;
      } else if (latest?.content) {
        content = latest.content;
        attachment = latest.attachment;
        version = latest.version;
        updatedAt = latest.updatedAt;
      } else {
        const pub: any = await TermsAPI.getPublic();
        const arr = pub?.success && Array.isArray(pub?.data) ? pub.data : Array.isArray(pub) ? pub : [];
        if (arr.length) {
          content = arr[0].content;
          attachment = arr[0].attachment;
          version = arr[0].version;
          updatedAt = arr[0].updatedAt;
        } else {
          throw new Error('No terms found');
        }
      }

      setTermsContent(content || '');
      setTermsAttachment(attachment);
      setTermsVersion(version || '1.0.0');
      setTermsUpdatedAt(updatedAt || '');
    } catch (err) {
      console.error('Error fetching terms:', err);
      setFetchError(true);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadTerms();
  }, []);

  useEffect(() => {
    if (
      termsAttachment &&
      termsAttachment.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ) {
      setIsConverting(true);
      setConversionError(false);
      fetch(getFullUrl(termsAttachment.url))
        .then((r) => {
          if (!r.ok) throw new Error(`HTTP error! status: ${r.status}`);
          return r.arrayBuffer();
        })
        .then((ab) => mammoth.convertToHtml({ arrayBuffer: ab }))
        .then((result) => {
          setDocxContent(result.value);
          setIsConverting(false);
        })
        .catch((err) => {
          console.error('Error converting DOCX:', err);
          setConversionError(true);
          setIsConverting(false);
        });
    }
  }, [termsAttachment]);

  const hasAttachment = !!termsAttachment;
  const isPdf = termsAttachment?.mimetype === 'application/pdf';
  const isDocx = termsAttachment?.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
  
  const showTextContent =
    !hasAttachment ||
    (termsContent &&
      termsContent.trim() !== 'Document attached' &&
      termsContent.trim().length > 20);

  const formattedDate = termsUpdatedAt 
    ? new Date(termsUpdatedAt).toLocaleDateString(isArabic ? 'ar-DZ' : 'fr-FR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    : '';

  return (
    <>
      <Header />
      <main style={{ padding: '40px 20px', minHeight: '80vh', backgroundColor: '#f8fafc', fontFamily: '"DM Sans", sans-serif' }}>
        <Container maxWidth="lg">
          <Paper 
            elevation={0} 
            sx={{ 
              p: { xs: 3, md: 5 }, 
              borderRadius: 4, 
              border: '1px solid #e2e8f0',
              direction: isRtl ? 'rtl' : 'ltr',
              textAlign: isRtl ? 'right' : 'left'
            }}
          >
            {/* Title Section */}
            <Box mb={4}>
              <Typography 
                variant="h3" 
                component="h1" 
                sx={{ 
                  color: '#002896', 
                  fontWeight: 'bold', 
                  fontSize: { xs: '28px', md: '36px' },
                  fontFamily: isRtl ? '"Cairo", "Tajawal", "DM Sans", sans-serif' : 'inherit',
                  mb: 1
                }}
              >
                {isArabic ? 'الشروط والأحكام العامة للاستخدام' : "Conditions Générales d'Utilisation"}
              </Typography>
              <Box display="flex" flexDirection={{ xs: 'column', sm: 'row' }} gap={2} mt={1}>
                {termsVersion && (
                  <Typography variant="body2" color="text.secondary">
                    <strong>Version:</strong> {termsVersion}
                  </Typography>
                )}
                {formattedDate && (
                  <Typography variant="body2" color="text.secondary">
                    <strong>{isArabic ? 'آخر تحديث:' : 'Dernière mise à jour :'}</strong> {formattedDate}
                  </Typography>
                )}
              </Box>
            </Box>

            <Divider sx={{ mb: 4 }} />

            {/* Content Display */}
            {isLoading || isConverting ? (
              <Box display="flex" justifyContent="center" alignItems="center" py={10}>
                <CircularProgress sx={{ color: '#002896' }} />
              </Box>
            ) : fetchError ? (
              <Box py={6} textAlign="center">
                <Typography color="error" variant="h6" gutterBottom sx={{ fontFamily: isRtl ? '"Cairo", "Tajawal", sans-serif' : 'inherit' }}>
                  {isArabic ? 'خطأ في تحميل الشروط والأحكام' : 'Erreur lors du chargement des termes et conditions'}
                </Typography>
                <Button 
                  variant="contained" 
                  onClick={loadTerms}
                  sx={{ 
                    mt: 2, 
                    bgcolor: '#002896', 
                    '&:hover': { bgcolor: '#001e70' },
                    fontFamily: isRtl ? '"Cairo", "Tajawal", sans-serif' : 'inherit'
                  }}
                >
                  {isArabic ? 'إعادة المحاولة' : 'Réessayer'}
                </Button>
              </Box>
            ) : (
              <Box>
                {showTextContent ? (
                  <Box sx={{ bgcolor: 'white', borderRadius: 2 }}>
                    {termsContent ? (
                      termsContent.split('\n').map((paragraph, index) => {
                        const trimmed = paragraph.trim();
                        if (!trimmed) return <Box key={index} sx={{ height: '0.8em' }} />;
                        
                        const isParaArabic = /[\u0600-\u06FF]/.test(trimmed);
                        return (
                          <Typography
                            key={index}
                            component="p"
                            variant="body1"
                            sx={{ 
                              whiteSpace: 'pre-wrap', 
                              color: '#1e293b',
                              textAlign: isParaArabic ? 'right' : 'justify',
                              fontFamily: isParaArabic ? '"Cairo", "Tajawal", "DM Sans", sans-serif' : 'inherit',
                              lineHeight: isParaArabic ? 1.85 : 1.7,
                              fontSize: isParaArabic ? '16px' : '15px',
                              direction: isParaArabic ? 'rtl' : 'ltr',
                              mb: '14px'
                            }}
                          >
                            {paragraph}
                          </Typography>
                        );
                      })
                    ) : (
                      <Typography component="div" sx={{ p: 4, textAlign: 'center', color: 'text.secondary', fontFamily: isRtl ? '"Cairo", "Tajawal", sans-serif' : 'inherit' }}>
                        {isArabic ? 'محتوى الشروط والأحكام غير متوفر حالياً.' : "Le contenu des termes et conditions n'est pas disponible pour le moment."}
                      </Typography>
                    )}
                  </Box>
                ) : hasAttachment ? (
                  <Box sx={{ bgcolor: 'white', borderRadius: 2, overflow: 'hidden' }}>
                    {isPdf ? (
                      <Box sx={{ width: '100%', height: '80vh', border: '1px solid #e2e8f0', borderRadius: 2 }}>
                        <iframe
                          src={`${getFullUrl(termsAttachment.url)}#toolbar=1&navpanes=1`}
                          width="100%"
                          height="100%"
                          style={{ border: 'none' }}
                          title="Terms PDF"
                        />
                      </Box>
                    ) : isDocx && !conversionError ? (
                      <Box sx={{ direction: isRtl ? 'rtl' : 'ltr', textAlign: isRtl ? 'right' : 'justify' }}>
                        <DocumentPage 
                          dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(docxContent) }} 
                          style={{ 
                            fontFamily: isRtl ? '"Cairo", "Tajawal", "Times New Roman", serif' : undefined,
                            lineHeight: isRtl ? 1.85 : undefined 
                          }} 
                        />
                      </Box>
                    ) : (
                      <Box
                        display="flex"
                        flexDirection="column"
                        alignItems="center"
                        justifyContent="center"
                        py={8}
                        px={3}
                        textAlign="center"
                        border="1px dashed #cbd5e1"
                        borderRadius={2}
                      >
                        <Typography variant="h6" gutterBottom sx={{ fontFamily: isRtl ? '"Cairo", "Tajawal", sans-serif' : 'inherit' }}>
                          {isRtl ? 'المستند الكامل متوفر' : 'Document complet disponible'}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" paragraph sx={{ fontFamily: isRtl ? '"Cairo", "Tajawal", sans-serif' : 'inherit', mb: 3 }}>
                          {isRtl ? 'يرجى تحميل الملف للاطلاع على الشروط والأحكام الكاملة.' : 'Veuillez télécharger le fichier pour consulter les termes et conditions complets.'}
                        </Typography>
                        <Button
                          variant="contained"
                          startIcon={<Iconify icon="eva:download-fill" />}
                          href={getFullUrl(termsAttachment.url)}
                          target="_blank"
                          download
                          sx={{ 
                            bgcolor: '#002896', 
                            '&:hover': { bgcolor: '#001e70' },
                            fontFamily: isRtl ? '"Cairo", "Tajawal", sans-serif' : 'inherit',
                            px: 4,
                            py: 1.2,
                            borderRadius: '8px'
                          }}
                        >
                          {isRtl ? 'تحميل المستند' : 'Télécharger le document'} (
                          {termsAttachment.mimetype.split('/').pop()?.toUpperCase()})
                        </Button>
                      </Box>
                    )}
                  </Box>
                ) : (
                  <Box py={4} textAlign="center">
                    <Typography color="text.secondary" sx={{ fontFamily: isRtl ? '"Cairo", "Tajawal", sans-serif' : 'inherit' }}>
                      {isArabic ? 'محتوى الشروط والأحكام غير متوفر حالياً.' : "Le contenu des termes et conditions n'est pas disponible pour le moment."}
                    </Typography>
                  </Box>
                )}
              </Box>
            )}
          </Paper>
        </Container>
      </main>
      <Footer />
    </>
  );
}
