import React, { useRef, useState } from 'react';
import { Box, Typography, Paper, IconButton, alpha, useTheme, Grid } from '@mui/material';
import { MdCloudUpload, MdClose, MdInsertDriveFile, MdImage } from 'react-icons/md';
import { motion, AnimatePresence } from 'framer-motion';

interface RichFileUploadProps {
  files: File[];
  onFilesChange: (files: File[]) => void;
  accept?: string;
  multiple?: boolean;
  maxFiles?: number;
  title?: string;
  subtitle?: string;
}

export default function RichFileUpload({
    files,
    onFilesChange,
    accept = "image/*,.pdf,.doc,.docx",
    multiple = true,
    maxFiles = 10,
    title = "Drop files here or click to upload",
    subtitle = "Support for images, PDF, and documents"
}: RichFileUploadProps) {
    const theme = useTheme();
    const inputRef = useRef<HTMLInputElement>(null);
    const [isDragging, setIsDragging] = useState(false);

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            handleFiles(Array.from(e.dataTransfer.files));
        }
    };

    const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            handleFiles(Array.from(e.target.files));
        }
    };

    const handleFiles = (newFiles: File[]) => {
        const validFiles = newFiles.slice(0, maxFiles - files.length); // Limit total files
        onFilesChange([...files, ...validFiles]);
    };

    const removeFile = (index: number, e: React.MouseEvent) => {
        e.stopPropagation();
        const newFiles = [...files];
        newFiles.splice(index, 1);
        onFilesChange(newFiles);
    };

    const renderFilePreview = (file: File) => {
        const isImage = file.type.startsWith('image/');
        const sizeInMb = (file.size / (1024 * 1024)).toFixed(2);
        
        return (
            <Box sx={{ p: 2, height: '100%', display: 'flex', alignItems: 'center', gap: 2 }}>
                <Box sx={{
                    width: 48,
                    height: 48,
                    borderRadius: 2,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: isImage ? 'transparent' : alpha(theme.palette.primary.main, 0.1),
                    overflow: 'hidden',
                    flexShrink: 0
                }}>
                    {isImage ? (
                        <img 
                            src={URL.createObjectURL(file)} 
                            alt="preview" 
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                        />
                    ) : (
                        <MdInsertDriveFile size={24} color={theme.palette.primary.main} />
                    )}
                </Box>
                <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                    <Typography variant="subtitle2" noWrap>{file.name}</Typography>
                    <Typography variant="caption" color="text.secondary">{sizeInMb} MB</Typography>
                </Box>
            </Box>
        );
    };

    return (
        <Box>
            <Paper
                variant="outlined"
                onClick={() => inputRef.current?.click()}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                sx={{
                    p: 3,
                    textAlign: 'center',
                    cursor: 'pointer',
                    borderRadius: 2,
                    borderStyle: 'dashed',
                    borderWidth: 2,
                    borderColor: isDragging ? theme.palette.primary.main : alpha(theme.palette.text.disabled, 0.3),
                    backgroundColor: isDragging ? alpha(theme.palette.primary.main, 0.05) : theme.palette.background.default,
                    transition: 'all 0.2s ease',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 1.5,
                    '&:hover': {
                        borderColor: theme.palette.primary.main,
                        backgroundColor: alpha(theme.palette.primary.main, 0.02)
                    }
                }}
            >
                <input
                    ref={inputRef}
                    type="file"
                    multiple={multiple}
                    accept={accept}
                    style={{ display: 'none' }}
                    onChange={handleFileInput}
                />
                
                <Box sx={{ 
                    width: 48, 
                    height: 48, 
                    borderRadius: '50%', 
                    backgroundColor: alpha(theme.palette.primary.main, 0.1),
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: theme.palette.primary.main
                }}>
                    <MdCloudUpload size={24} />
                </Box>

                <Box>
                    <Typography variant="subtitle2" fontWeight={700}>
                        {title}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                        {subtitle}
                    </Typography>
                </Box>
            </Paper>

            {/* File List */}
            {files.length > 0 && (
                <Box sx={{ mt: 2 }}>
                    <Typography variant="caption" sx={{ mb: 1, ml: 1, fontWeight: 700, color: 'text.secondary' }}>
                        Selected Files ({files.length})
                    </Typography>
                    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: '1fr 1fr 1fr' }, gap: 1.5 }}>
                        <AnimatePresence>
                            {files.map((file, index) => (
                                <motion.div
                                    key={`${file.name}-${index}`}
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.9 }}
                                    layout
                                >
                                    <Paper sx={{ 
                                        position: 'relative', 
                                        borderRadius: 2, 
                                        overflow: 'hidden',
                                        border: `1px solid ${alpha(theme.palette.divider, 0.5)}` 
                                    }}>
                                        {renderFilePreview(file)}
                                        <IconButton
                                            size="small"
                                            onClick={(e) => removeFile(index, e)}
                                            sx={{
                                                position: 'absolute',
                                                top: 4,
                                                right: 4,
                                                p: 0.5,
                                                backgroundColor: alpha(theme.palette.background.paper, 0.8),
                                                '&:hover': { backgroundColor: theme.palette.error.light, color: 'white' }
                                            }}
                                        >
                                            <MdClose size={14} />
                                        </IconButton>
                                    </Paper>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </Box>
                </Box>
            )}
        </Box>
    );
}
