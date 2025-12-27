import React, { useState } from 'react';
import { useFormik, Form, FormikProvider } from 'formik';
import { useRouter } from 'next/navigation';
import * as Yup from 'yup';
import {
  Stack,
  TextField,
  IconButton,
  InputAdornment,
  Alert,
  Link,
  styled,
} from '@mui/material';
import { LoadingButton } from '@mui/lab';
import Iconify from '../../../components/Iconify';
import { AuthAPI } from '../../../app/api/auth';
import { authStore } from '../../../contexts/authStore';
import app from '../../../config';

// ----------------------------------------------------------------------

// Helper function to create alpha color
function alpha(color: string, value: number) {
  return `rgba(${hexToRgb(color)}, ${value})`;
}

// Helper function to convert hex to RGB
function hexToRgb(hex: string) {
  hex = hex.replace('#', '');
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  return `${r}, ${g}, ${b}`;
}

// Styled TextField with glassmorphism
const StyledTextField = styled(TextField)(({ theme }) => ({
  '& .MuiOutlinedInput-root': {
    borderRadius: 12,
    backgroundColor: alpha(theme.palette.background.paper, 0.6),
    backdropFilter: 'blur(10px)',
    border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    fontSize: '1rem',
    
    '&:hover': {
      backgroundColor: alpha(theme.palette.background.paper, 0.8),
      borderColor: alpha(theme.palette.primary.main, 0.3),
      transform: 'translateY(-1px)',
      boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.15)}`,
    },
    '&.Mui-focused': {
      backgroundColor: alpha(theme.palette.background.paper, 0.9),
      borderColor: theme.palette.primary.main,
      boxShadow: `0 0 0 3px ${alpha(theme.palette.primary.main, 0.2)}`,
      transform: 'translateY(-2px)',
    },
    '& fieldset': {
      border: 'none',
    },
    
    // Responsive font sizes
    [theme.breakpoints.down('sm')]: {
      fontSize: '0.95rem',
      '& input': {
        fontSize: '0.95rem',
      },
    },
  },
  
  '& .MuiInputLabel-root': {
    fontSize: '1rem',
    [theme.breakpoints.down('sm')]: {
      fontSize: '0.9rem',
    },
  },
  
  '& .MuiFormHelperText-root': {
    fontSize: '0.75rem',
    [theme.breakpoints.down('sm')]: {
      fontSize: '0.7rem',
    },
  },
}));

interface LoginFormProps {
  onSuccess?: () => void;
}

export default function LoginForm({ onSuccess }: LoginFormProps) {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  const LoginSchema = Yup.object().shape({
    login: Yup.string()
      .required('Email ou numéro de téléphone requis'),
    password: Yup.string()
      .required('Mot de passe requis'),
  });

  const formik = useFormik({
    initialValues: {
      login: '',
      password: '',
    },
    validationSchema: LoginSchema,
    onSubmit: async (values, { setSubmitting }) => {
      setLoginError(null);
      
      try {
        console.log('🔐 Attempting login with:', { login: values.login, hasPassword: !!values.password });
        console.log('🔐 API base URL:', app.baseURL);
        
        const trimmedLogin = values.login.trim();
        const normalizedLogin = trimmedLogin.includes('@') 
          ? trimmedLogin.toLowerCase() 
          : trimmedLogin;
        
        const response: any = await AuthAPI.signin({
          login: normalizedLogin,
          password: values.password.trim(),
        });

        console.log('🔐 Login response:', response);
        
        // Handle different response formats
        let loginData;
        if (response && response.data) {
          // Full axios response (when returnFullResponse = true)
          loginData = response.data;
        } else {
          // Direct response data (when returnFullResponse = false)
          loginData = response;
        }

        if (loginData && loginData.user && loginData.session) {
          const { user, session } = loginData;
          
          // Check if user is banned
          if (user.isBanned) {
            setLoginError('Votre compte a été banni. Vous ne pouvez pas vous connecter.');
            return;
          }

          // Store authentication data
          const authData = {
            user,
            tokens: {
              accessToken: session.accessToken,
              refreshToken: session.refreshToken,
            },
          };

          console.log('🔐 Storing auth data:', authData);
          authStore.getState().set(authData);

          // Fetch fresh user data in background to ensure we have the full profile
          // We don't await this to speed up the UI feedback
          authStore.getState().fetchFreshUserData().catch(e => {
            console.error('⚠️ Failed to fetch fresh user data on login:', e);
          });

          // Redirect to home/dashboard
          console.log('🔐 Login successful, redirecting to home');
          router.replace('/profile');
          
          if (onSuccess) {
            onSuccess();
          }
        } else {
          console.error('❌ Invalid login response structure:', loginData);
          throw new Error('Invalid response from server - missing user or session data');
        }
      } catch (error: any) {
        console.error('❌ Login error:', error);
        
        let errorMessage = 'Une erreur est survenue lors de la connexion.';
        
        if (error.response?.status === 401) {
          if (error.response?.data?.message) {
            const serverMessage = error.response.data.message;
            if (serverMessage.includes('Invalid credentials - login')) {
              errorMessage = 'Email ou numéro de téléphone incorrect.';
            } else if (serverMessage.includes('Invalid credentials - password')) {
              errorMessage = 'Mot de passe incorrect.';
            } else if (serverMessage.includes('Phone number not verified')) {
              errorMessage = 'Votre numéro de téléphone n\'est pas vérifié. Veuillez vérifier votre numéro avec le code OTP qui vous a été envoyé.';
              // Redirect to OTP verification
              const isPhone = !values.login.includes('@');
              const redirectUrl = isPhone 
                ? `/otp-verification?phone=${encodeURIComponent(values.login)}`
                : '/otp-verification';
              router.push(redirectUrl);
              return;
            } else {
              errorMessage = serverMessage || 'Identifiants incorrects. Veuillez vérifier votre email/téléphone et mot de passe.';
            }
          } else {
            errorMessage = 'Identifiants incorrects. Veuillez vérifier votre email/téléphone et mot de passe.';
          }
        } else if (error.response?.data?.message) {
          errorMessage = error.response.data.message;
        } else if (error.message) {
          errorMessage = error.message;
        }
        
        setLoginError(errorMessage);
      } finally {
        setSubmitting(false);
      }
    },
  });

  const { errors, touched, isSubmitting, getFieldProps } = formik;

  const handleKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      formik.handleSubmit();
    }
  };

  return (
    <FormikProvider value={formik}>
      <Form autoComplete="off" noValidate onKeyPress={handleKeyPress}>
        <Stack spacing={{ xs: 0.75, sm: 1.1, md: 1.6 }}>
          {loginError && (
            <Alert 
              severity="error" 
              sx={{ 
                mb: 2,
                borderRadius: 2,
                background: `linear-gradient(135deg, ${alpha('#f44336', 0.1)} 0%, ${alpha('#f44336', 0.05)} 100%)`,
                backdropFilter: 'blur(10px)',
                border: `1px solid ${alpha('#f44336', 0.3)}`,
              }}
            >
              {loginError}
            </Alert>
          )}

          <StyledTextField
            fullWidth
            autoComplete="username"
            type="text"
            label="Email ou numéro de téléphone"
            placeholder="exemple@email.com ou 0555 12 34 56"
            {...getFieldProps('login')}
            error={Boolean(touched.login && errors.login)}
            helperText={touched.login && errors.login}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Iconify icon="eva:person-fill" width={20} height={20} />
                </InputAdornment>
              ),
            }}
          />

          <StyledTextField
            fullWidth
            autoComplete="current-password"
            type={showPassword ? 'text' : 'password'}
            label="Mot de passe"
            placeholder="Entrez votre mot de passe"
            {...getFieldProps('password')}
            error={Boolean(touched.password && errors.password)}
            helperText={touched.password && errors.password}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Iconify icon="eva:lock-fill" width={20} height={20} />
                </InputAdornment>
              ),
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton onClick={() => setShowPassword(!showPassword)} edge="end">
                    <Iconify icon={showPassword ? 'eva:eye-fill' : 'eva:eye-off-fill'} />
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />
        </Stack>

        <Stack 
          direction="row" 
          alignItems="center" 
          justifyContent="space-between" 
          sx={{ 
            my: { xs: 1.2, sm: 1.6 },
          }}
        >
          <Link 
            component="button" 
            variant="body2" 
            underline="hover"
            type="button"
            onClick={(e) => {
              e.preventDefault();
              router.push('/reset-password');
            }}
            sx={{ 
              textAlign: 'left',
              fontSize: { xs: '0.85rem', sm: '0.875rem' },
              color: 'primary.main',
              fontWeight: 500,
              transition: 'all 0.2s ease',
              '&:hover': {
                opacity: 0.8,
              },
            }}
          >
            Mot de passe oublié?
          </Link>
        </Stack>

        <LoadingButton
          fullWidth
          size="large"
          type="submit"
          variant="contained"
          loading={isSubmitting}
          sx={{ 
            borderRadius: { xs: 1.5, sm: 2 },
            py: { xs: 1.25, sm: 1.5, md: 1.7 },
            fontSize: { xs: '1rem', sm: '1.05rem', md: '1.1rem' },
            fontWeight: 700,
            background: (theme) => `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
            boxShadow: (theme) => `0 8px 24px ${alpha(theme.palette.primary.main, 0.3)}`,
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            '&:hover': {
              background: (theme) => `linear-gradient(135deg, ${theme.palette.primary.dark} 0%, ${alpha(theme.palette.primary.dark, 0.9)} 100%)`,
              boxShadow: (theme) => `0 12px 32px ${alpha(theme.palette.primary.main, 0.4)}`,
              transform: 'translateY(-2px)',
            },
            '&:active': {
              transform: 'translateY(0px)',
            },
          }}
        >
          Se connecter
        </LoadingButton>
      </Form>
    </FormikProvider>
  );
}
