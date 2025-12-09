'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  Box,
  Card,
  Container,
  Grid,
  Stack,
  TextField,
  Typography,
  InputAdornment,
  Stepper,
  Step,
  StepLabel,
  Button,
  Paper,
  MenuItem,
  LinearProgress,
  FormControlLabel,
  Switch,
  styled,
  alpha,
} from '@mui/material';
import { LoadingButton } from '@mui/lab';
import { useTheme } from '@mui/material/styles';
import * as Yup from 'yup';
import { useFormik, FormikProvider } from 'formik';
import { MdCloudUpload, MdLocationOn } from 'react-icons/md';
import useAuth from '@/hooks/useAuth';

// Styled Components (reuse from Create Auction)
const MainContainer = styled(Container)(({ theme }) => ({
  paddingTop: theme.spacing(3),
  paddingBottom: theme.spacing(6),
  maxWidth: '1200px',
}));

const HeaderCard = styled(Card)(({ theme }) => ({
  background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
  color: 'white',
  padding: theme.spacing(4),
  marginBottom: theme.spacing(4),
  borderRadius: 16,
  boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
}));

const StepCard = styled(Card)(({ theme }) => ({
  padding: theme.spacing(4),
  borderRadius: 16,
  boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
  border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
  marginBottom: theme.spacing(3),
}));

const SelectionCard = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(3),
  borderRadius: 12,
  cursor: 'pointer',
  transition: 'all 0.3s ease',
  border: `2px solid transparent`,
  '&:hover': {
    transform: 'translateY(-4px)',
    boxShadow: '0 12px 24px rgba(0,0,0,0.15)',
    borderColor: alpha(theme.palette.primary.main, 0.3),
  },
  '&.selected': {
    borderColor: theme.palette.primary.main,
    backgroundColor: alpha(theme.palette.primary.light, 0.05),
    boxShadow: `0 8px 24px ${alpha(theme.palette.primary.main, 0.2)}`,
  },
}));

const TENDER_TYPES = {
  PRODUCT: 'PRODUCT',
  SERVICE: 'SERVICE',
};

const TENDER_AUCTION_TYPES = {
  CLASSIC: 'CLASSIC',
  EXPRESS: 'EXPRESS',
};

const TENDER_EVALUATION_TYPES = {
  MOINS_DISANT: 'MOINS_DISANT', // Lowest price
  MIEUX_DISANT: 'MIEUX_DISANT', // Best offer
};

const DURATION_OPTIONS = [
  { label: '2 days', value: 2 },
  { label: '7 days', value: 7 },
  { label: '15 days', value: 15 },
  { label: '1 month', value: 30 },
  { label: '2 months', value: 60 },
];

const WILAYAS = [
  'Adrar', 'Chlef', 'Laghouat', 'Oum El Bouaghi', 'Batna', 'Béjaïa', 'Biskra',
  'Béchar', 'Blida', 'Bouira', 'Tamanrasset', 'Tébessa', 'Tlemcen', 'Tiaret',
  'Tizi Ouzou', 'Alger', 'Djelfa', 'Jijel', 'Sétif', 'Saïda', 'Skikda',
  'Sidi Bel Abbès', 'Annaba', 'Guelma', 'Constantine', 'Médéa', 'Mostaganem',
  "M'Sila", 'Mascara', 'Ouargla', 'Oran', 'El Bayadh', 'Illizi',
  'Bordj Bou Arreridj', 'Boumerdès', 'El Tarf', 'Tindouf', 'Tissemsilt',
  'El Oued', 'Khenchela', 'Souk Ahras', 'Tipaza', 'Mila', 'Aïn Defla',
  'Naâma', 'Aïn Témouchent', 'Ghardaïa', 'Relizane',
];

export default function CreateTenderPage() {
  const theme = useTheme();
  const router = useRouter();
  const { auth, isLogged } = useAuth();
  
  const [activeStep, setActiveStep] = useState(0);
  const [categories, setCategories] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<any>(null);
  const [attachments, setAttachments] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const locationInputRef = useRef<HTMLInputElement>(null);

  const steps = [
    'Product/Service Type',
    'Tender Type',
    'Evaluation Type',
    'Category',
    'Details & Location'
  ];

  const validationSchema = Yup.object().shape({
    tenderType: Yup.string()
      .oneOf(Object.values(TENDER_TYPES))
      .required('Product or Service type is required'),
    auctionType: Yup.string()
      .oneOf(Object.values(TENDER_AUCTION_TYPES))
      .required('Tender type is required'),
    evaluationType: Yup.string()
      .oneOf(Object.values(TENDER_EVALUATION_TYPES))
      .required('Evaluation type is required'),
    category: Yup.string().required('Category is required'),
    duration: Yup.number().required('Duration is required'),
    title: Yup.string()
      .min(3, 'Title must be at least 3 characters')
      .max(100, 'Title is too long')
      .required('Title is required'),
    description: Yup.string()
      .min(10, 'Description must be at least 10 characters')
      .required('Description is required'),
    location: Yup.string().required('Location is required'),
    wilaya: Yup.string().required('Wilaya is required'),
  });

  const formik = useFormik({
    initialValues: {
      tenderType: '',
      auctionType: '',
      evaluationType: '',
      category: '',
      subCategory: '',
      duration: null as number | null,
      title: '',
      description: '',
      requirements: '',
      quantity: '',
      location: '',
      wilaya: '',
      hidden: false,
      isPro: false,
    },
    validationSchema,
    validateOnChange: false,
    validateOnBlur: true,
    onSubmit: async (values) => {
      await handleSubmit(values);
    },
  });

  useEffect(() => {
    if (!isLogged) {
      router.push('/auth/login');
      return;
    }
    loadCategories();
  }, [isLogged]);

  const loadCategories = async () => {
    try {
      const { CategoryAPI } = await import('@/services/category');
      
      console.log('🔄 Fetching categories from database...');
      const response = await CategoryAPI.getCategoryTree();
      console.log('📦 Raw category response:', response);
      
      let categoryData = [];
      
      // Handle different response formats
      if (response?.data && Array.isArray(response.data)) {
        categoryData = response.data;
        console.log('✅ Loaded categories from response.data');
      } else if (Array.isArray(response)) {
        categoryData = response;
        console.log('✅ Loaded categories from direct array response');
      } else if (response?.success && response?.data) {
        categoryData = Array.isArray(response.data) ? response.data : [];
        console.log('✅ Loaded categories from success response');
      }
      
      if (categoryData.length > 0) {
        console.log(`✅ Successfully loaded ${categoryData.length} real categories from database`);
        setCategories(categoryData);
        return;
      }
      
      console.warn('⚠️ No categories returned from API, using fallback');
      
      // Fallback to mock categories only if API returns empty data
      const mockCategories = [
        { _id: '1', name: 'Electronics', type: 'PRODUCT', children: [] },
        { _id: '2', name: 'Vehicles', type: 'PRODUCT', children: [] },
        { _id: '3', name: 'Real Estate', type: 'PRODUCT', children: [] },
        { _id: '4', name: 'Services', type: 'SERVICE', children: [] },
        { _id: '5', name: 'Furniture', type: 'PRODUCT', children: [] },
        { _id: '6', name: 'Clothing', type: 'PRODUCT', children: [] },
        { _id: '7', name: 'Construction', type: 'SERVICE', children: [] },
        { _id: '8', name: 'Food & Beverages', type: 'PRODUCT', children: [] },
      ];
      
      console.log('📝 Using mock categories as fallback');
      setCategories(mockCategories);
      
    } catch (error: any) {
      console.error('❌ Error loading categories:', error);
      console.error('Error details:', {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data
      });
      
      // Use mock categories as emergency fallback
      const mockCategories = [
        { _id: '1', name: 'Electronics', type: 'PRODUCT', children: [] },
        { _id: '2', name: 'Vehicles', type: 'PRODUCT', children: [] },
        { _id: '3', name: 'Real Estate', type: 'PRODUCT', children: [] },
        { _id: '4', name: 'Services', type: 'SERVICE', children: [] },
        { _id: '5', name: 'Furniture', type: 'PRODUCT', children: [] },
        { _id: '6', name: 'Clothing', type: 'PRODUCT', children: [] },
        { _id: '7', name: 'Construction', type: 'SERVICE', children: [] },
        { _id: '8', name: 'Food & Beverages', type: 'PRODUCT', children: [] },
      ];
      
      console.log('🔄 Using mock categories due to error');
      setCategories(mockCategories);
    }
  };

  const validateStep = (step: number): boolean => {
    switch (step) {
      case 0:
        return !!formik.values.tenderType;
      case 1:
        return !!formik.values.auctionType;
      case 2:
        return !!formik.values.evaluationType;
      case 3:
        return !!formik.values.category;
      case 4:
        return !!(
          formik.values.title &&
          formik.values.description &&
          formik.values.duration &&
          formik.values.location &&
          formik.values.wilaya
        );
      default:
        return true;
    }
  };

  const handleNext = () => {
    if (!validateStep(activeStep)) {
      return;
    }
    setActiveStep((prev) => prev + 1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBack = () => {
    setActiveStep((prev) => prev - 1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmit = async (values: any) => {
    try {
      setIsSubmitting(true);
      const { TendersAPI } = await import('@/services/tenders');
      
      const formData = new FormData();
      Object.keys(values).forEach(key => {
        if (values[key] !== null && values[key] !== '') {
          formData.append(key, values[key]);
        }
      });
      
      attachments.forEach((file) => {
        formData.append('attachments', file);
      });
      
      await TendersAPI.create(formData);
      router.push('/dashboard/tenders');
    } catch (error: any) {
      console.error('Error creating tender:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStepContent = (step: number) => {
    switch (step) {
      case 0:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>Select Type</Typography>
            </Grid>
            {Object.entries(TENDER_TYPES).map(([key, value]) => (
              <Grid item xs={12} md={6} key={value}>
                <SelectionCard
                  className={formik.values.tenderType === value ? 'selected' : ''}
                  onClick={() => formik.setFieldValue('tenderType', value)}
                >
                  <Stack alignItems="center" spacing={2}>
                    <Typography variant="h6">{key}</Typography>
                    <Typography variant="body2" color="text.secondary" textAlign="center">
                      {value === 'PRODUCT' && 'Physical goods or materials'}
                      {value === 'SERVICE' && 'Professional services or work'}
                    </Typography>
                  </Stack>
                </SelectionCard>
              </Grid>
            ))}
          </Grid>
        );

      case 1:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>Select Tender Type</Typography>
            </Grid>
            {Object.entries(TENDER_AUCTION_TYPES).map(([key, value]) => (
              <Grid item xs={12} md={6} key={value}>
                <SelectionCard
                  className={formik.values.auctionType === value ? 'selected' : ''}
                  onClick={() => formik.setFieldValue('auctionType', value)}
                >
                  <Stack alignItems="center" spacing={2}>
                    <Typography variant="h6">{key}</Typography>
                    <Typography variant="body2" color="text.secondary" textAlign="center">
                      {value === 'CLASSIC' && 'Standard tender with extended timeline'}
                      {value === 'EXPRESS' && 'Fast-track tender with quick response'}
                    </Typography>
                  </Stack>
                </SelectionCard>
              </Grid>
            ))}
          </Grid>
        );

      case 2:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>Select Evaluation Type</Typography>
            </Grid>
            {Object.entries(TENDER_EVALUATION_TYPES).map(([key, value]) => (
              <Grid item xs={12} md={6} key={value}>
                <SelectionCard
                  className={formik.values.evaluationType === value ? 'selected' : ''}
                  onClick={() => formik.setFieldValue('evaluationType', value)}
                >
                  <Stack alignItems="center" spacing={2}>
                    <Typography variant="h6">
                      {value === 'MOINS_DISANT' ? 'Lowest Price' : 'Best Offer'}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" textAlign="center">
                      {value === 'MOINS_DISANT' && 'Award based on lowest price bid'}
                      {value === 'MIEUX_DISANT' && 'Award based on best overall proposal'}
                    </Typography>
                  </Stack>
                </SelectionCard>
              </Grid>
            ))}
          </Grid>
        );

      case 3:
        return (
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>Select Category</Typography>
            </Grid>
            {categories.map((category) => (
              <Grid item xs={12} sm={6} md={4} key={category._id}>
                <SelectionCard
                  className={formik.values.category === category._id ? 'selected' : ''}
                  onClick={() => {
                    setSelectedCategory(category);
                    formik.setFieldValue('category', category._id);
                  }}
                >
                  <Typography variant="subtitle1" textAlign="center">{category.name}</Typography>
                </SelectionCard>
              </Grid>
            ))}
          </Grid>
        );

      case 4:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>Tender Details</Typography>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                name="title"
                label="Title"
                value={formik.values.title}
                onChange={formik.handleChange}
                error={formik.touched.title && Boolean(formik.errors.title)}
                helperText={formik.touched.title && formik.errors.title}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={4}
                name="description"
                label="Description"
                value={formik.values.description}
                onChange={formik.handleChange}
                error={formik.touched.description && Boolean(formik.errors.description)}
                helperText={formik.touched.description && formik.errors.description}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={3}
                name="requirements"
                label="Requirements (Optional)"
                value={formik.values.requirements}
                onChange={formik.handleChange}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                type="number"
                name="quantity"
                label="Quantity (Optional)"
                value={formik.values.quantity}
                onChange={formik.handleChange}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                select
                fullWidth
                name="duration"
                label="Duration"
                value={formik.values.duration || ''}
                onChange={formik.handleChange}
                error={formik.touched.duration && Boolean(formik.errors.duration)}
                helperText={formik.touched.duration && formik.errors.duration}
              >
                {DURATION_OPTIONS.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                name="location"
                label="Location"
                inputRef={locationInputRef}
                value={formik.values.location}
                onChange={formik.handleChange}
                error={formik.touched.location && Boolean(formik.errors.location)}
                helperText={formik.touched.location && formik.errors.location}
                InputProps={{
                  startAdornment: <InputAdornment position="start"><MdLocationOn /></InputAdornment>,
                }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                select
                fullWidth
                name="wilaya"
                label="Wilaya"
                value={formik.values.wilaya}
                onChange={formik.handleChange}
                error={formik.touched.wilaya && Boolean(formik.errors.wilaya)}
                helperText={formik.touched.wilaya && formik.errors.wilaya}
              >
                {WILAYAS.map((wilaya) => (
                  <MenuItem key={wilaya} value={wilaya}>
                    {wilaya}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12}>
              <Card sx={{ p: 3, border: '2px dashed', borderColor: 'divider' }}>
                <Stack alignItems="center" spacing={2}>
                  <MdCloudUpload size={48} />
                  <Typography>Upload Attachments (Optional)</Typography>
                  <input
                    type="file"
                    multiple
                    onChange={(e) => {
                      if (e.target.files) {
                        setAttachments(Array.from(e.target.files));
                      }
                    }}
                  />
                  {attachments.length > 0 && (
                    <Typography variant="body2" color="primary">
                      {attachments.length} file(s) selected
                    </Typography>
                  )}
                </Stack>
              </Card>
            </Grid>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formik.values.hidden}
                    onChange={(e) => formik.setFieldValue('hidden', e.target.checked)}
                  />
                }
                label="Make tender private"
              />
            </Grid>
          </Grid>
        );

      default:
        return null;
    }
  };

  return (
    <FormikProvider value={formik}>
      <MainContainer>
        <HeaderCard>
          <Typography variant="h3" fontWeight={700}>Create New Tender</Typography>
          <Typography variant="body1" sx={{ mt: 1, opacity: 0.9 }}>
            Follow the steps to publish your tender
          </Typography>
        </HeaderCard>

        <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        {isSubmitting && <LinearProgress sx={{ mb: 2 }} />}

        <StepCard>
          <form onSubmit={formik.handleSubmit}>
            {renderStepContent(activeStep)}

            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
              <Button
                disabled={activeStep === 0}
                onClick={handleBack}
                variant="outlined"
              >
                Back
              </Button>
              <Box>
                {activeStep === steps.length - 1 ? (
                  <LoadingButton
                    variant="contained"
                    onClick={() => formik.handleSubmit()}
                    loading={isSubmitting}
                  >
                    Create Tender
                  </LoadingButton>
                ) : (
                  <Button
                    variant="contained"
                    onClick={handleNext}
                    disabled={!validateStep(activeStep)}
                  >
                    Next
                  </Button>
                )}
              </Box>
            </Box>
          </form>
        </StepCard>
      </MainContainer>
    </FormikProvider>
  );
}
