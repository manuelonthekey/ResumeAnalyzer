import express from 'express';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';

const router = express.Router();
const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'supersecret123';

const authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: 'No token provided' });
  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token' });
  }
};

router.use(authenticate);

// Get profile
router.get('/', async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        email: true,
        name: true,
        profile_picture: true,
        preferred_roles: true,
        linkedin_url: true,
        github_url: true,
        portfolio_url: true
      }
    });
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update profile
router.put('/', async (req, res) => {
  const { name, profile_picture, preferred_roles, linkedin_url, github_url, portfolio_url } = req.body;
  try {
    const updatedUser = await prisma.user.update({
      where: { id: req.user.id },
      data: {
        name,
        profile_picture,
        preferred_roles,
        linkedin_url,
        github_url,
        portfolio_url
      },
      select: {
        id: true,
        email: true,
        name: true,
        profile_picture: true,
        preferred_roles: true,
        linkedin_url: true,
        github_url: true,
        portfolio_url: true
      }
    });
    res.json({ message: 'Profile updated successfully', user: updatedUser });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
