import * as yup from 'yup';

export const userValidator = yup.object({
  firstName: yup.string().required('First Name is Required'),
  lastName: yup.string().required('Last Name is Required'),
  phoneNumber: yup
    .string()
    .required('Phone number is Required')
    .length(10)
    .matches(/^[0-9]{10}$/g, 'Phone number must have 10 digit'),
  email: yup
    .string()
    .required('Email is Required')
    .email('Email must be A valid Email'),
  hash: yup
    .string()
    .required('Password is Required')
    .min(6, 'Min 6 letters are required'),
  birthDate: yup.date().optional().nullable(),
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