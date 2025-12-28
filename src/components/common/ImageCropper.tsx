import React, { useState, useCallback } from 'react';
import Cropper from 'react-easy-crop';
import { getCroppedImg } from '../../utils/canvasUtils';
import { motion } from 'framer-motion';

interface ImageCropperProps {
    imageSrc: string;
    aspectRatio?: number;
    onCancel: () => void;
    onCropComplete: (croppedImage: Blob) => void;
    cropShape?: 'rect' | 'round';
}

const ImageCropper: React.FC<ImageCropperProps> = ({
    imageSrc,
    aspectRatio = 1,
    onCancel,
    onCropComplete,
    cropShape = 'rect'
}) => {
    const [crop, setCrop] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [rotation, setRotation] = useState(0);
    const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);

    const onCropChange = (crop: { x: number; y: number }) => {
        setCrop(crop);
    };

    const onZoomChange = (zoom: number) => {
        setZoom(zoom);
    };

    const onRotationChange = (rotation: number) => {
        setRotation(rotation);
    };

    const onCropCompleteHandler = useCallback((croppedArea: any, croppedAreaPixels: any) => {
        setCroppedAreaPixels(croppedAreaPixels);
    }, []);

    const handleSave = async () => {
        try {
            const croppedImage = await getCroppedImg(imageSrc, croppedAreaPixels, rotation);
            if (croppedImage) {
                onCropComplete(croppedImage);
            }
        } catch (e) {
            console.error('Error creating cropped image:', e);
        }
    };

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 9999,
            backgroundColor: 'rgba(0, 0, 0, 0.85)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px'
        }}>
            <div style={{
                position: 'relative',
                width: '100%',
                maxWidth: '600px',
                height: '400px',
                backgroundColor: '#333',
                borderRadius: '8px',
                overflow: 'hidden',
                marginBottom: '20px'
            }}>
                <Cropper
                    image={imageSrc}
                    crop={crop}
                    zoom={zoom}
                    rotation={rotation}
                    aspect={aspectRatio}
                    onCropChange={onCropChange}
                    onCropComplete={onCropCompleteHandler}
                    onZoomChange={onZoomChange}
                    cropShape={cropShape}
                />
            </div>

            <div style={{
                width: '100%',
                maxWidth: '600px',
                backgroundColor: 'white',
                padding: '20px',
                borderRadius: '12px',
                display: 'flex',
                flexDirection: 'column',
                gap: '15px'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <i className="bi bi-zoom-in" style={{ fontSize: '1.2rem', color: '#666' }}></i>
                    <input
                        type="range"
                        value={zoom}
                        min={1}
                        max={3}
                        step={0.1}
                        aria-labelledby="Zoom"
                        onChange={(e) => setZoom(Number(e.target.value))}
                        style={{ width: '100%', cursor: 'pointer' }}
                    />
                </div>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <i className="bi bi-arrow-repeat" style={{ fontSize: '1.2rem', color: '#666' }}></i>
                    <input
                        type="range"
                        value={rotation}
                        min={0}
                        max={360}
                        step={1}
                        aria-labelledby="Rotation"
                        onChange={(e) => setRotation(Number(e.target.value))}
                        style={{ width: '100%', cursor: 'pointer' }}
                    />
                </div>

                <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                    <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={onCancel}
                        style={{
                            flex: 1,
                            padding: '10px',
                            border: '1px solid #e5e7eb',
                            backgroundColor: 'white',
                            borderRadius: '8px',
                            fontWeight: 600,
                            color: '#374151',
                            cursor: 'pointer'
                        }}
                    >
                        Annuler
                    </motion.button>
                    <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={handleSave}
                        style={{
                            flex: 1,
                            padding: '10px',
                            border: 'none',
                            backgroundColor: '#4F46E5', // Primary color
                            borderRadius: '8px',
                            fontWeight: 600,
                            color: 'white',
                            cursor: 'pointer'
                        }}
                    >
                        Enregistrer
                    </motion.button>
                </div>
            </div>
        </div>
    );
};

export default ImageCropper;
