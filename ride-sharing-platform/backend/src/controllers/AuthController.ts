import { Request, Response } from 'express';
import { authService } from '../services/index.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { createUserSchema } from '@rideshare/shared';
import type { ApiResponse, User } from '@rideshare/shared';
import { z } from 'zod';

const loginSchema = z.object({
  body: z.object({
    email: z.string().email(),
    password: z.string().min(1),
  }),
});

const registerSchema = z.object({
  body: createUserSchema.extend({
    password: z.string().min(8).max(100),
  }),
});

export const authController = {
  register: asyncHandler(async (req: Request, res: Response) => {
    const { body } = registerSchema.parse({ body: req.body });
    
    const { user, token } = await authService.register(body);

    const response: ApiResponse<{ user: User; token: string }> = {
      success: true,
      data: { user, token },
    };

    res.status(201).json(response);
  }),

  login: asyncHandler(async (req: Request, res: Response) => {
    const { body } = loginSchema.parse({ body: req.body });
    
    const { user, token } = await authService.login(body);

    const response: ApiResponse<{ user: User; token: string }> = {
      success: true,
      data: { user, token },
    };

    res.json(response);
  }),

  getProfile: asyncHandler(async (req: Request, res: Response) => {
    const userId = req.userId!;
    const user = await authService.getProfile(userId);

    const response: ApiResponse<User> = {
      success: true,
      data: user,
    };

    res.json(response);
  }),

  updateProfile: asyncHandler(async (req: Request, res: Response) => {
    const userId = req.userId!;
    const user = await authService.updateProfile(userId, req.body);

    const response: ApiResponse<User> = {
      success: true,
      data: user,
    };

    res.json(response);
  }),

  getEmergencyContacts: asyncHandler(async (req: Request, res: Response) => {
    const userId = req.userId!;
    const contacts = await authService.getEmergencyContacts(userId);

    res.json({ success: true, data: contacts });
  }),

  addEmergencyContact: asyncHandler(async (req: Request, res: Response) => {
    const userId = req.userId!;
    const contact = await authService.addEmergencyContact(userId, req.body);

    res.status(201).json({ success: true, data: contact });
  }),
};
