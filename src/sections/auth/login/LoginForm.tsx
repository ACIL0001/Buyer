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
  Typography,
  Checkbox,
  Box
} from '@mui/material';
import { LoadingButton } from '@mui/lab';
import Iconify from '../../../components/Iconify';
import { AuthAPI } from '../../../app/api/auth';
import { authStore } from '../../../contexts/authStore';
import app from '../../../config';

// ---------------------------------------------------------------------- 

interface LoginFormProps {
  onSuccess?: () => void;
}

export default function LoginForm({ onSuccess }: LoginFormProps) {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [rememberMe, setRememberMe] = useState(false);

  const LoginSchema = Yup.object().shape({
    login: Yup.string().required('Email ou numéro de téléphone requis'),
    password: Yup.string().required('Mot de passe requis'),
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
        const trimmedLogin = values.login.trim();
        const normalizedLogin = trimmedLogin.includes('@') 
          ? trimmedLogin.toLowerCase() 
          : trimmedLogin;
        
        const response: any = await AuthAPI.signin({
          login: normalizedLogin,
          password: values.password.trim(),
        });

        let loginData = response && response.data ? response.data : response;

        if (loginData && loginData.user && loginData.session) {
          const { user, session } = loginData;
          
          if (user.isBanned) {
            setLoginError('Votre compte a été banni. Vous ne pouvez pas vous connecter.');
            return;
          }

          // Remember Me Logic
          if (rememberMe) {
            localStorage.setItem('mazad_remembered_login', values.login);
            localStorage.setItem('mazad_remembered_password', values.password);
          } else {
            localStorage.removeItem('mazad_remembered_login');
            localStorage.removeItem('mazad_remembered_password');
          }

          const authData = {
            user,
            tokens: {
              accessToken: session.accessToken,
              refreshToken: session.refreshToken,
            },
          };

          authStore.getState().set(authData);

          if (!user.isVerified && !user.isCertified && !user.isHasIdentity) {
            localStorage.setItem('showVerificationPopup', 'true');
          }

          const currentNoteLoginCount = parseInt(localStorage.getItem('profile_note_login_count') || '0');
          localStorage.setItem('profile_note_login_count', (currentNoteLoginCount + 1).toString());
          sessionStorage.removeItem('profile_note_shown');

          authStore.getState().fetchFreshUserData().catch(e => {
            console.error('⚠️ Failed to fetch fresh user data on login:', e);
          });

          if (!user.loginCount || user.loginCount <= 1) {
             router.replace('/profile');
          } else {
             router.replace('/');
          }
          
          if (onSuccess) {
            onSuccess();
          }
        } else {
          throw new Error('Invalid response from server');
        }
      } catch (error: any) {
        let errorMessage = 'Une erreur est survenue lors de la connexion.';
        
        if (error.response?.status === 401) {
          if (error.response?.data?.message) {
            const serverMessage = error.response.data.message;
            if (serverMessage.includes('Invalid credentials')) {
              errorMessage = 'Identifiants incorrects.';
            } else if (serverMessage.includes('Phone number not verified')) {
              errorMessage = 'Votre numéro de téléphone n\'est pas vérifié.';
              const isPhone = !values.login.includes('@');
              const redirectUrl = isPhone 
                ? `/otp-verification?phone=${encodeURIComponent(values.login)}`
                : '/otp-verification';
              router.push(redirectUrl);
              return;
            } else {
              errorMessage = serverMessage;
            }
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

  React.useEffect(() => {
    const savedLogin = localStorage.getItem('mazad_remembered_login');
    const savedPass = localStorage.getItem('mazad_remembered_password');
    if (savedLogin && savedPass) {
      formik.setValues({ login: savedLogin, password: savedPass });
      setRememberMe(true);
    }
  }, []);

  const { errors, touched, isSubmitting, getFieldProps } = formik;

  const handleKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      formik.handleSubmit();
    }
  };

  const exactWidth = '252.6px';
  const exactHeight = '33.87px';
  const exactBorderRadius = '3.53px';

  return (
    <FormikProvider value={formik}>
      <Form autoComplete="off" noValidate onKeyPress={handleKeyPress}>
        <Box sx={{ display: 'flex', flexDirection: 'column', width: exactWidth }}>
          
          {loginError && (
            <Alert severity="error" sx={{ width: exactWidth, mb: 2 }}>
              {loginError}
            </Alert>
          )}

          {/* Email Container */}
          <Box sx={{ display: 'flex', flexDirection: 'column', mb: '16.98px' }}>
            <Typography 
              sx={{ 
                width: 'auto',
                height: '14px',
                fontSize: '9.88px', 
                color: '#757575', 
                mb: '2.82px', 
                fontFamily: '"Poppins", sans-serif',
                fontWeight: 400,
                lineHeight: '140%',
                letterSpacing: '-0.02em',
                whiteSpace: 'nowrap'
              }}
            >
              Email ou numéro de téléphone
            </Typography>
            <TextField
              fullWidth
              autoComplete="username"
              type="text"
              placeholder="Email ou numéro de téléphone"
              {...getFieldProps('login')}
              error={Boolean(touched.login && errors.login)}
              InputProps={{
                sx: { 
                  width: exactWidth, 
                  height: exactHeight, 
                  borderRadius: exactBorderRadius,
                  border: '0.71px solid #757575',
                  backgroundColor: '#FFFFFF',
                  fieldset: { border: 'none' },
                  fontFamily: '"DM Sans", sans-serif',
                  fontSize: '12px'
                }
              }}
            />
          </Box>

          {/* Password Container */}
          <Box sx={{ display: 'flex', flexDirection: 'column', mb: '5.57px' }}>
            <Typography 
              sx={{ 
                width: '65px',
                height: '14px',
                fontSize: '9.88px', 
                color: '#757575', 
                mb: '2.82px', 
                fontFamily: '"Poppins", sans-serif',
                fontWeight: 400,
                lineHeight: '140%',
                letterSpacing: '-0.02em'
              }}
            >
              Mot de passe
            </Typography>
            <TextField
              fullWidth
              autoComplete="current-password"
              type={showPassword ? 'text' : 'password'}
              {...getFieldProps('password')}
              error={Boolean(touched.password && errors.password)}
              InputProps={{
                sx: { 
                  width: exactWidth, 
                  height: exactHeight, 
                  borderRadius: exactBorderRadius,
                  border: '0.71px solid #757575',
                  backgroundColor: '#FFFFFF',
                  fieldset: { border: 'none' },
                  fontFamily: '"DM Sans", sans-serif',
                  fontSize: '12px'
                },
              }}
            />
          </Box>

          {/* Links Section */}
          <Link 
            component="button" 
            variant="body2" 
            underline="none"
            type="button"
            onClick={(e) => {
              e.preventDefault();
              router.push('/auth/forgot-password');
            }}
            sx={{ 
              width: '104px',
              height: '14px',
              fontSize: '9.88px',
              fontFamily: '"Poppins", sans-serif',
              fontWeight: 400,
              color: '#007AFF',
              lineHeight: '140%',
              letterSpacing: '-0.02em',
              textAlign: 'right',
              mb: '13px',
              p: 0,
              justifyContent: 'flex-start',
              display: 'flex'
            }}
          >
            Mot de passe oublié ?
          </Link>

          {/* Checkbox Section */}
          <Box 
            sx={{ 
              display: 'flex', 
              alignItems: 'center',
              width: '100.58px',
              height: '14.11px',
              color: '#757575',
              mb: '32.96px' // Gap before login button
            }}
          >
            <Box 
              sx={{
                width: '14.11px',
                height: '14.11px',
                border: '0.71px solid #757575',
                borderRadius: '1.41px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                mr: 1,
                position: 'relative'
              }}
            >
              <Checkbox 
                size="small" 
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                sx={{ 
                  position: 'absolute',
                  width: '100%',
                  height: '100%',
                  p: 0,
                  opacity: 0, 
                  zIndex: 1
                }} 
              />
              {rememberMe && (
                <Iconify icon="eva:checkmark-fill" sx={{ width: 10, height: 10, color: '#757575' }} />
              )}
            </Box>
            <Typography 
              sx={{ 
                height: '14px',
                fontSize: '9.88px', 
                fontFamily: '"Poppins", sans-serif', 
                fontWeight: 400,
                color: '#757575', 
                lineHeight: '140%', 
                letterSpacing: '-0.02em' 
              }}
            >
              Rester connecté
            </Typography>
          </Box>

          <LoadingButton
            fullWidth
            type="submit"
            variant="contained"
            loading={isSubmitting}
            sx={{ 
              width: exactWidth,
              height: exactHeight,
              borderRadius: exactBorderRadius,
              background: '#002896',
              color: '#FFFFFF',
              textTransform: 'none',
              fontSize: '9.88px', // Mapped from Figma 'Create account' specs
              lineHeight: '15px',
              fontWeight: 600,
              letterSpacing: '-0.02em',
              fontFamily: '"Poppins", sans-serif',
              boxShadow: 'none',
              '&:hover': {
                background: '#001b69',
                boxShadow: 'none',
              }
            }}
          >
            Se connecter
          </LoadingButton>
        </Box>
      </Form>
    </FormikProvider>
  );
}
