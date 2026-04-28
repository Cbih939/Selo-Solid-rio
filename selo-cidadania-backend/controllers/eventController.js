const db = require('../config/db');

// Listar todos os eventos
exports.getAllEvents = async (req, res) => {
    try {
        const [events] = await db.query('SELECT * FROM event_schedules ORDER BY event_date ASC');
        res.status(200).json(events);
    } catch (error) {
        console.error("Erro ao buscar eventos:", error);
        res.status(500).json({ error: 'Erro ao carregar eventos.' });
    }
};

// Obter um evento por ID
exports.getEventById = async (req, res) => {
    try {
        const [event] = await db.query('SELECT * FROM event_schedules WHERE id = ?', [req.params.id]);
        if (event.length === 0) return res.status(404).json({ error: 'Evento não encontrado.' });
        res.status(200).json(event[0]);
    } catch (error) {
        console.error("Erro ao buscar evento:", error);
        res.status(500).json({ error: 'Erro ao buscar o evento.' });
    }
};

// Criar um novo evento
exports.createEvent = async (req, res) => {
    const { title, description, event_date, location } = req.body;

    if (!title || !event_date || !location) {
        return res.status(400).json({ error: 'Título, data e local são obrigatórios.' });
    }

    try {
        const [result] = await db.query(
            'INSERT INTO event_schedules (title, description, event_date, location) VALUES (?, ?, ?, ?)',
            [title, description, event_date, location]
        );
        res.status(201).json({ message: 'Evento criado com sucesso!', id: result.insertId });
    } catch (error) {
        console.error("Erro ao criar evento:", error);
        res.status(500).json({ error: 'Erro ao criar evento.' });
    }
};

// Atualizar um evento
exports.updateEvent = async (req, res) => {
    const { title, description, event_date, location } = req.body;
    const eventId = req.params.id;

    try {
        const [result] = await db.query(
            'UPDATE event_schedules SET title = ?, description = ?, event_date = ?, location = ? WHERE id = ?',
            [title, description, event_date, location, eventId]
        );
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Evento não encontrado.' });
        }

        res.status(200).json({ message: 'Evento atualizado com sucesso!' });
    } catch (error) {
        console.error("Erro ao atualizar evento:", error);
        res.status(500).json({ error: 'Erro ao atualizar evento.' });
    }
};

// Excluir um evento
exports.deleteEvent = async (req, res) => {
    try {
        const [result] = await db.query('DELETE FROM event_schedules WHERE id = ?', [req.params.id]);
        if (result.affectedRows === 0) return res.status(404).json({ error: 'Evento não encontrado.' });
        res.status(200).json({ message: 'Evento excluído com sucesso!' });
    } catch (error) {
        console.error("Erro ao excluir evento:", error);
        res.status(500).json({ error: 'Erro ao excluir evento.' });
    }
};