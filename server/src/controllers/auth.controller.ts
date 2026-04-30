import { Request, Response } from 'express';
import asyncHandler from 'express-async-handler';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import User from '../models/User.model';

const signToken = (id: string) =>
  jwt.sign({ id }, process.env.JWT_SECRET!, { expiresIn: process.env.JWT_EXPIRES_IN || '30d' });

export const register = asyncHandler(async (req: Request, res: Response) => {
  const { firstName, lastName, email, password } = req.body;
  const exists = await User.findOne({ email });
  if (exists) {
    res.status(400).json({ message: 'Email already in use' });
    return;
  }
  const user = await User.create({ firstName, lastName, email, password });
  const token = signToken(user._id.toString());
  res.status(201).json({
    token,
    user: { _id: user._id, firstName, lastName, email, role: user.role },
  });
});

export const login = asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email }).select('+password');
  if (!user || !(await user.comparePassword(password))) {
    res.status(401).json({ message: 'Invalid email or password' });
    return;
  }
  const token = signToken(user._id.toString());
  res.json({
    token,
    user: { _id: user._id, firstName: user.firstName, lastName: user.lastName, email: user.email, role: user.role },
  });
});

export const getMe = asyncHandler(async (req: Request & { user?: { _id: string } }, res: Response) => {
  const user = await User.findById(req.user?._id).populate('wishlist');
  res.json(user);
});

export const forgotPassword = asyncHandler(async (req: Request, res: Response) => {
  const user = await User.findOne({ email: req.body.email });
  if (!user) {
    res.status(404).json({ message: 'No account with that email' });
    return;
  }
  const token = crypto.randomBytes(32).toString('hex');
  user.passwordResetToken = crypto.createHash('sha256').update(token).digest('hex');
  user.passwordResetExpires = new Date(Date.now() + 60 * 60 * 1000);
  await user.save();
  res.json({ message: 'Reset email sent', resetToken: token });
});

export const resetPassword = asyncHandler(async (req: Request, res: Response) => {
  const hashedToken = crypto.createHash('sha256').update(req.params.token).digest('hex');
  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() },
  });
  if (!user) {
    res.status(400).json({ message: 'Invalid or expired token' });
    return;
  }
  user.password = req.body.password;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save();
  const token = signToken(user._id.toString());
  res.json({ token, message: 'Password reset successful' });
});
