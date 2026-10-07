import { z } from 'zod';

export const emailSchema = z
  .string({ required_error: 'Please enter your email address.' })
  .trim()
  .min(1, 'Please enter your email address.')
  .email('Please enter a valid email address.')
  .toLowerCase();

export const passwordSchema = z
  .string({ required_error: 'Password is required.' })
  .min(8, 'Password must be at least 8 characters long.')
  .regex(/[a-zA-Z]/, 'Password must contain at least one letter.')
  .regex(/[0-9]/, 'Password must contain at least one number.')
  .regex(/[^a-zA-Z0-9]/, 'Password must contain at least one special character (!@#$%^&*).');

export const nameSchema = z
  .string({ required_error: 'Full name is required.' })
  .trim()
  .min(2, 'Name must be at least 2 characters long.')
  .max(50, 'Name cannot exceed 50 characters.');

export const otpSchema = z
  .string({ required_error: 'Please enter the 6-digit code.' })
  .trim()
  .regex(/^\d{6}$/, 'The verification code must be exactly 6 digits.');

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Please enter your password.'),
});

export const signupSchema = z
  .object({
    name: nameSchema,
    email: emailSchema,
    password: passwordSchema,
    confirmPassword: z.string().min(1, 'Please confirm your password.'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match.',
    path: ['confirmPassword'],
  });

export const resetPasswordSchema = z
  .object({
    password: passwordSchema,
    confirmPassword: z.string().min(1, 'Please confirm your password.'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match.',
    path: ['confirmPassword'],
  });
