'use client';

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  Box,
  Typography,
  CircularProgress,
  Button,
} from '@mui/material';
import { MdClose, MdFileDownload } from 'react-icons/md';
import mammoth from 'mammoth';

interface DocxViewerModalProps {
  open: boolean;
  onClose: () => void;
  fileUrl: string;
  fileName?: string;
}

const DocxViewerModal: React.FC<DocxViewerModalProps> = ({ open, onClose, fileUrl, fileName }) => {
  const [html, setHtml] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open && fileUrl) {
      loadDocument();
    } else {
      setHtml('');
      setError(null);
    }
  }, [open, fileUrl]);

  const loadDocument = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(fileUrl);
      if (!response.ok) throw new Error('Failed to fetch document');
      
      const arrayBuffer = await response.arrayBuffer();
      const result = await mammoth.convertToHtml({ arrayBuffer });
      
      setHtml(result.value);
      if (result.messages.length > 0) {
        console.warn('Mammoth messages:', result.messages);
      }
    } catch (err: any) {
      console.error('Error rendering DOCX:', err);
      setError('Impossible de prévisualiser ce document. Il est peut-être corrompu ou dans un format non supporté.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="md" 
      fullWidth
      sx={{ zIndex: 9999 }}
      PaperProps={{
        sx: {
          borderRadius: '16px',
          minHeight: '60vh',
          maxHeight: '90vh'
        }
      }}
    >
      <DialogTitle sx={{ 
        m: 0, p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        borderBottom: '1px solid #f1f5f9'
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box sx={{ 
            width: 32, height: 32, borderRadius: '8px', background: '#fef2f2', 
            display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#dc2626' 
          }}>
            📝
          </Box>
          <Typography variant="h6" sx={{ fontWeight: 700, fontSize: '1.1rem', color: '#1e293b' }}>
            {fileName || 'Prévisualisation du document'}
          </Typography>
        </Box>
        <Box>
          <Button 
            startIcon={<MdFileDownload />}
            href={fileUrl}
            download
            size="small"
            sx={{ mr: 1, textTransform: 'none', color: '#64748b' }}
          >
            Télécharger
          </Button>
          <IconButton onClick={onClose} size="small" sx={{ color: '#94a3b8' }}>
            <MdClose />
          </IconButton>
        </Box>
      </DialogTitle>
      
      <DialogContent sx={{ p: 0, backgroundColor: '#f8fafc' }}>
        {loading ? (
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', py: 10, gap: 2 }}>
            <CircularProgress size={40} sx={{ color: '#002795' }} />
            <Typography sx={{ color: '#64748b', fontSize: '0.9rem' }}>Chargement du document...</Typography>
          </Box>
        ) : error ? (
          <Box sx={{ p: 4, textAlign: 'center' }}>
            <Typography color="error" sx={{ mb: 2 }}>{error}</Typography>
            <Button variant="outlined" href={fileUrl} download startIcon={<MdFileDownload />}>
              Télécharger pour ouvrir localement
            </Button>
          </Box>
        ) : (
          <Box 
            sx={{ 
              p: { xs: 2, md: 4 }, 
              backgroundColor: '#fff', 
              margin: { xs: 0, md: 3 }, 
              borderRadius: '8px',
              boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
              minHeight: '50vh',
              '& h1, & h2, & h3, & h4': { color: '#002795', mb: 2 },
              '& p': { mb: 1.5, lineHeight: 1.6, color: '#334155' },
              '& table': { width: '100%', borderCollapse: 'collapse', mb: 3 },
              '& td, & th': { border: '1px solid #e2e8f0', p: 1 },
              '& img': { maxWidth: '100%', height: 'auto' }
            }}
            dangerouslySetInnerHTML={{ __html: html }}
          />
        )}
      </DialogContent>
    </Dialog>
  );
};

export default DocxViewerModal;
