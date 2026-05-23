import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import {
  LoginDto,
  RegisterDto,
  ChangePasswordDto,
  ForgotPasswordDto,
  ResetPasswordDto,
  VerifyMfaSetupDto,
  SendVerificationEmailDto,
} from '../dto';

describe('DTO Validation', () => {
  describe('LoginDto', () => {
    it('should validate valid login data', async () => {
      const dto = plainToInstance(LoginDto, {
        email: 'test@example.com',
        password: 'Password123!',
      });

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should return all validation errors for invalid data', async () => {
      const dto = plainToInstance(LoginDto, {
        email: 'invalid-email',
        password: 'short',
      });

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);

      // Check that we get errors for both fields
      const emailError = errors.find((e) => e.property === 'email');
      const passwordError = errors.find((e) => e.property === 'password');

      expect(emailError).toBeDefined();
      expect(passwordError).toBeDefined();
      expect(emailError?.constraints).toBeDefined();
      expect(passwordError?.constraints).toBeDefined();
    });

    it('should validate email format', async () => {
      const dto = plainToInstance(LoginDto, {
        email: 'not-an-email',
        password: 'Password123!',
      });

      const errors = await validate(dto);
      const emailError = errors.find((e) => e.property === 'email');

      expect(emailError).toBeDefined();
      expect(emailError?.constraints?.isEmail).toContain('Invalid email format');
    });

    it('should validate password length', async () => {
      const dto = plainToInstance(LoginDto, {
        email: 'test@example.com',
        password: 'short',
      });

      const errors = await validate(dto);
      const passwordError = errors.find((e) => e.property === 'password');

      expect(passwordError).toBeDefined();
      expect(passwordError?.constraints?.minLength).toContain('at least 8 characters');
    });
  });

  describe('RegisterDto', () => {
    it('should validate valid registration data', async () => {
      const dto = plainToInstance(RegisterDto, {
        username: 'testuser',
        email: 'test@example.com',
        password: 'Password123!',
        firstName: 'John',
        lastName: 'Doe',
        regionId: '550e8400-e29b-41d4-a716-446655440000',
      });

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should return all validation errors for invalid registration', async () => {
      const dto = plainToInstance(RegisterDto, {
        username: 'ab', // Too short
        email: 'invalid-email',
        password: 'weak', // Too short and doesn't meet complexity
        firstName: '',
        lastName: '',
        regionId: 'not-a-uuid',
      });

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);

      // Verify we get errors for multiple fields
      const fieldErrors = errors.map((e) => e.property);
      expect(fieldErrors).toContain('username');
      expect(fieldErrors).toContain('email');
      expect(fieldErrors).toContain('password');
      expect(fieldErrors).toContain('regionId');
    });

    it('should validate password complexity', async () => {
      const dto = plainToInstance(RegisterDto, {
        username: 'testuser',
        email: 'test@example.com',
        password: 'simplepassword', // No uppercase, number, or special char
        firstName: 'John',
        lastName: 'Doe',
        regionId: '550e8400-e29b-41d4-a716-446655440000',
      });

      const errors = await validate(dto);
      const passwordError = errors.find((e) => e.property === 'password');

      expect(passwordError).toBeDefined();
      expect(passwordError?.constraints?.matches).toContain('uppercase');
    });
  });

  describe('ChangePasswordDto', () => {
    it('should validate valid password change data', async () => {
      const dto = plainToInstance(ChangePasswordDto, {
        currentPassword: 'OldPassword123!',
        newPassword: 'NewPassword123!',
      });

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should validate new password complexity', async () => {
      const dto = plainToInstance(ChangePasswordDto, {
        currentPassword: 'OldPassword123!',
        newPassword: 'weak',
      });

      const errors = await validate(dto);
      const passwordError = errors.find((e) => e.property === 'newPassword');

      expect(passwordError).toBeDefined();
    });
  });

  describe('ForgotPasswordDto', () => {
    it('should validate valid email', async () => {
      const dto = plainToInstance(ForgotPasswordDto, {
        email: 'test@example.com',
      });

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should validate email format', async () => {
      const dto = plainToInstance(ForgotPasswordDto, {
        email: 'not-an-email',
      });

      const errors = await validate(dto);
      const emailError = errors.find((e) => e.property === 'email');

      expect(emailError).toBeDefined();
      expect(emailError?.constraints?.isEmail).toContain('Invalid email format');
    });
  });

  describe('ResetPasswordDto', () => {
    it('should validate valid reset data', async () => {
      const dto = plainToInstance(ResetPasswordDto, {
        token: 'valid-token-string',
        newPassword: 'NewPassword123!',
        confirmPassword: 'NewPassword123!',
      });

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should return all validation errors', async () => {
      const dto = plainToInstance(ResetPasswordDto, {
        token: '',
        newPassword: 'weak',
        confirmPassword: '',
      });

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);

      const fieldErrors = errors.map((e) => e.property);
      expect(fieldErrors).toContain('token');
      expect(fieldErrors).toContain('newPassword');
      expect(fieldErrors).toContain('confirmPassword');
    });
  });

  describe('VerifyMfaSetupDto', () => {
    it('should validate valid 6-digit code', async () => {
      const dto = plainToInstance(VerifyMfaSetupDto, {
        code: '123456',
      });

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should reject invalid code length', async () => {
      const dto = plainToInstance(VerifyMfaSetupDto, {
        code: '12345', // Too short
      });

      const errors = await validate(dto);
      const codeError = errors.find((e) => e.property === 'code');

      expect(codeError).toBeDefined();
      // The constraint key is 'length' but we need to check the actual constraint object
      const constraints = codeError?.constraints;
      expect(constraints).toBeDefined();
      const errorMessage = constraints ? Object.values(constraints).join(' ') : '';
      expect(errorMessage).toContain('exactly 6 digits');
    });
  });

  describe('SendVerificationEmailDto', () => {
    it('should validate valid email', async () => {
      const dto = plainToInstance(SendVerificationEmailDto, {
        email: 'test@example.com',
      });

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should validate email format with custom message', async () => {
      const dto = plainToInstance(SendVerificationEmailDto, {
        email: 'invalid',
      });

      const errors = await validate(dto);
      const emailError = errors.find((e) => e.property === 'email');

      expect(emailError).toBeDefined();
      expect(emailError?.constraints?.isEmail).toContain('Invalid email format');
    });
  });
});
