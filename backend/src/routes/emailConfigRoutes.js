import express from 'express';
import EmailConfig from '../models/EmailConfig.js';
import auth from '../middlewares/auth.js';

const router = express.Router();

// Get all email configurations
router.get('/', auth.authenticate, async (req, res) => {
  try {
    const configs = await EmailConfig.find({ isActive: true });
    res.json({ success: true, data: configs });
  } catch (error) {
    console.error('Error fetching email configs:', error);
    res.status(500).json({ message: 'Error fetching email configurations' });
  }
});

// Get email config by role and department
router.get('/:role', auth.authenticate, async (req, res) => {
  try {
    const { role } = req.params;
    const { department } = req.query;
    
    const query = { role, isActive: true };
    if (department) {
      query.department = department;
    }
    
    const configs = await EmailConfig.find(query);
    res.json({ success: true, data: configs });
  } catch (error) {
    console.error('Error fetching email config:', error);
    res.status(500).json({ message: 'Error fetching email configuration' });
  }
});

// Create new email configuration
router.post('/', auth.authenticate, async (req, res) => {
  try {
    const { role, department, emails } = req.body;

    if (!role || !emails || emails.length === 0) {
      return res.status(400).json({ message: 'Role and at least one email are required' });
    }

    if (role === 'HOD' && !department) {
      return res.status(400).json({ message: 'Department is required for HOD role' });
    }

    const existing = await EmailConfig.findOne({ role, department });
    if (existing) {
      return res.status(400).json({ message: 'Configuration already exists for this role/department' });
    }

    const config = new EmailConfig({ role, department, emails });
    await config.save();

    res.status(201).json({ success: true, data: config });
  } catch (error) {
    console.error('Error creating email config:', error);
    res.status(500).json({ message: 'Error creating email configuration' });
  }
});

// Update email configuration
router.put('/:id', auth.authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const { emails, isActive } = req.body;

    const updateData = {};
    if (emails) updateData.emails = emails;
    if (typeof isActive !== 'undefined') updateData.isActive = isActive;

    const config = await EmailConfig.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!config) {
      return res.status(404).json({ message: 'Configuration not found' });
    }

    res.json({ success: true, data: config });
  } catch (error) {
    console.error('Error updating email config:', error);
    res.status(500).json({ message: 'Error updating email configuration' });
  }
});

// Delete email configuration
router.delete('/:id', auth.authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    
    const config = await EmailConfig.findByIdAndDelete(id);

    if (!config) {
      return res.status(404).json({ message: 'Configuration not found' });
    }

    res.json({ success: true, message: 'Configuration deleted successfully' });
  } catch (error) {
    console.error('Error deleting email config:', error);
    res.status(500).json({ message: 'Error deleting email configuration' });
  }
});

export default router;
