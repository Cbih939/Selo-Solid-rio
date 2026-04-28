const express = require('express');
const router = express.Router();
const eventController = require('../controllers/eventController');
const { admin, protect } = require('../middlewares/authMiddleware');

// Rotas para usuários verem os eventos
router.get('/', protect, eventController.getAllEvents);
router.get('/:id', protect, eventController.getEventById);

// Rotas para administração gerir os eventos
router.post('/', admin, eventController.createEvent);
router.put('/:id', admin, eventController.updateEvent);
router.delete('/:id', admin, eventController.deleteEvent);

module.exports = router;