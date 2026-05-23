/**
 * Profile API functions for TelemetryFlow Platform
 * Handles current user profile operations
 */

import { iamClient } from "./iam";
import { config } from "@/config";
import type { UserProfile, UpdateUserRequest } from "@/types";

export interface UpdateProfileRequest {
  firstName?: string;
  lastName?: string;
  timezone?: string;
  locale?: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

export interface UpdateRecoveryEmailRequest {
  recoveryEmail: string;
}

export interface AvatarUploadResponse {
  avatarUrl: string;
}

export const profileApi = {
  /**
   * Get current user profile
   */
  getProfile: async (): Promise<UserProfile> => {
    if (config.useMock) {
      await new Promise((resolve) => setTimeout(resolve, 300));
      const storedUser = localStorage.getItem("tfo-user");
      if (storedUser) {
        return JSON.parse(storedUser);
      }
      throw new Error("Not authenticated");
    }
    return iamClient.get<UserProfile>("/auth/me");
  },

  /**
   * Update current user profile
   */
  updateProfile: async (data: UpdateProfileRequest): Promise<UserProfile> => {
    if (config.useMock) {
      await new Promise((resolve) => setTimeout(resolve, 500));
      const storedUser = localStorage.getItem("tfo-user");
      if (storedUser) {
        const user = JSON.parse(storedUser);
        const updatedUser = { ...user, ...data };
        localStorage.setItem("tfo-user", JSON.stringify(updatedUser));
        return updatedUser;
      }
      throw new Error("Not authenticated");
    }
    return iamClient.put<UserProfile>("/auth/profile", data);
  },

  /**
   * Change password
   */
  changePassword: async (
    data: ChangePasswordRequest,
  ): Promise<{ message: string }> => {
    if (config.useMock) {
      await new Promise((resolve) => setTimeout(resolve, 500));
      // Simulate password validation
      if (data.newPassword.length < 8) {
        throw {
          response: {
            data: { message: "Password must be at least 8 characters" },
          },
        };
      }
      return { message: "Password changed successfully" };
    }
    return iamClient.post<{ message: string }>("/auth/change-password", data);
  },

  /**
   * Update recovery email
   */
  updateRecoveryEmail: async (
    data: UpdateRecoveryEmailRequest,
  ): Promise<{ message: string }> => {
    if (config.useMock) {
      await new Promise((resolve) => setTimeout(resolve, 500));
      return { message: "Recovery email updated successfully" };
    }
    return iamClient.put<{ message: string }>("/auth/recovery-email", data);
  },

  /**
   * Upload avatar image
   */
  uploadAvatar: async (file: File): Promise<AvatarUploadResponse> => {
    if (config.useMock) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      // Create a mock URL from the file
      const url = URL.createObjectURL(file);
      // Update stored user
      const storedUser = localStorage.getItem("tfo-user");
      if (storedUser) {
        const user = JSON.parse(storedUser);
        user.avatar = url;
        localStorage.setItem("tfo-user", JSON.stringify(user));
      }
      return { avatarUrl: url };
    }

    const formData = new FormData();
    formData.append("avatar", file);
    return iamClient.post<AvatarUploadResponse>("/auth/avatar", formData);
  },

  /**
   * Delete avatar
   */
  deleteAvatar: async (): Promise<{ message: string }> => {
    if (config.useMock) {
      await new Promise((resolve) => setTimeout(resolve, 300));
      const storedUser = localStorage.getItem("tfo-user");
      if (storedUser) {
        const user = JSON.parse(storedUser);
        user.avatar = null;
        localStorage.setItem("tfo-user", JSON.stringify(user));
      }
      return { message: "Avatar deleted successfully" };
    }
    return iamClient.delete<{ message: string }>("/auth/avatar");
  },
};

export default profileApi;
