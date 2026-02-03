import * as yup from 'yup';

export const userValidator = yup.object({
  userName: yup.string().required('User Name is Required'),
  email: yup
    .string()
    .required('Email is Required')
    .email('Email must be A valid Email'),
  hash: yup
    .string()
    .required('Password is Required')
    .min(6, 'Min 6 letters are required'),
});

export const forgotPasswordValidator = yup.object({
  email: yup.string().email('Invalid email').required('Email is required'),
});

export const resetPasswordValidator = yup.object({
  token: yup.string().required('Token is required'),
  password: yup
    .string()
    .min(6, 'Password must be at least 6 characters')
    .required('New password is required'),
});
