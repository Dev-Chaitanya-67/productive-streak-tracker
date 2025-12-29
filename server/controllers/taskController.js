import Task from '../models/Task.js';

// @desc    Get tasks
// @route   GET /api/tasks
export const getTasks = async (req, res) => {
  try {
    const tasks = await Task.find({ user: req.user.id }).sort({ date: 1, time: 1 });
    res.status(200).json(tasks);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create task
// @route   POST /api/tasks
export const createTask = async (req, res) => {
  if (!req.body.text) {
    return res.status(400).json({ message: 'Text is required' });
  }

  try {
    const task = await Task.create({
      user: req.user.id,
      text: req.body.text,
      date: req.body.date,
      time: req.body.time,
      category: req.body.category || 'work',
      customList: req.body.customList || null,
      difficulty: req.body.difficulty,
      link: req.body.link
    });

    res.status(200).json(task);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update task (Toggle/Edit)
// @route   PUT /api/tasks/:id
export const updateTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ message: 'Task not found' });
    
    if (task.user.toString() !== req.user.id) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    const updatedTask = await Task.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );

    res.status(200).json(updatedTask);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete task (Single Ticket)
// @route   DELETE /api/tasks/:id
export const deleteTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ message: 'Task not found' });

    if (task.user.toString() !== req.user.id) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    await task.deleteOne();
    res.status(200).json({ id: req.params.id });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Remove a custom list (Bulk remove tags)
// @route   DELETE /api/tasks/list/:listName
export const deleteCustomList = async (req, res) => {
  try {
    const { listName } = req.params;

    if (!req.user) return res.status(401).json({ message: 'Not authorized' });

    await Task.updateMany(
      { user: req.user.id, customList: listName },
      { $set: { customList: null } }
    );

    res.status(200).json({ message: `List ${listName} removed` });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};