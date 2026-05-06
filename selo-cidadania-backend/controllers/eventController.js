const db = require('../config/db');

// Importando a função de auditoria
const { registerSystemLog } = require('./logController');

// Listar todos os eventos
exports.getAllEvents = async (req, res) => {
    try {
        const [events] = await db.query('SELECT * FROM event_schedules ORDER BY event_date ASC');
        res.status(200).json(events);
    } catch (error) {
        console.error("Erro ao buscar eventos:", error);
        
        // LOG DE ERRO
        const actorName = req.user?.name || 'Sistema / Anônimo';
        await registerSystemLog(req.user?.id, req.user?.ong_id, actorName, "Erro no Sistema", `Falha técnica ao tentar listar todos os eventos: ${error.message}`, "error");
        
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
        
        // LOG DE ERRO
        const actorName = req.user?.name || 'Sistema / Anônimo';
        await registerSystemLog(req.user?.id, req.user?.ong_id, actorName, "Erro no Sistema", `Falha técnica ao tentar buscar o evento ID ${req.params.id}: ${error.message}`, "error");
        
        res.status(500).json({ error: 'Erro ao buscar o evento.' });
    }
};

// Criar um novo evento
exports.createEvent = async (req, res) => {
    const { title, description, event_date, location } = req.body;
    const actorId = req.user?.id || null;
    const actorName = req.user?.name || 'Sistema';
    const actorOng = req.user?.ong_id || null;

    if (!title || !event_date || !location) {
        await registerSystemLog(actorId, actorOng, actorName, "Aviso de Validação", "Tentativa de criar um evento com campos obrigatórios em falta.", "warning");
        return res.status(400).json({ error: 'Título, data e local são obrigatórios.' });
    }

    try {
        const [result] = await db.query(
            'INSERT INTO event_schedules (title, description, event_date, location) VALUES (?, ?, ?, ?)',
            [title, description, event_date, location]
        );
        
        // LOG DE SUCESSO
        await registerSystemLog(actorId, actorOng, actorName, "Novo Evento Criado", `O evento '${title}' foi agendado com sucesso para a data ${event_date}.`, "success");
        
        res.status(201).json({ message: 'Evento criado com sucesso!', id: result.insertId });
    } catch (error) {
        console.error("Erro ao criar evento:", error);
        
        // LOG DE ERRO CRÍTICO
        await registerSystemLog(actorId, actorOng, actorName, "Erro ao Criar Evento", `Falha no banco de dados ao criar o evento '${title}': ${error.message}`, "error");
        
        res.status(500).json({ error: 'Erro ao criar evento.' });
    }
};

// Atualizar um evento
exports.updateEvent = async (req, res) => {
    const { title, description, event_date, location } = req.body;
    const eventId = req.params.id;
    const actorId = req.user?.id || null;
    const actorName = req.user?.name || 'Sistema';
    const actorOng = req.user?.ong_id || null;

    try {
        const [result] = await db.query(
            'UPDATE event_schedules SET title = ?, description = ?, event_date = ?, location = ? WHERE id = ?',
            [title, description, event_date, location, eventId]
        );
        
        if (result.affectedRows === 0) {
            await registerSystemLog(actorId, actorOng, actorName, "Edição Inválida", `Tentativa de atualizar o evento ID ${eventId} que não existe.`, "warning");
            return res.status(404).json({ error: 'Evento não encontrado.' });
        }

        // LOG DE SUCESSO
        await registerSystemLog(actorId, actorOng, actorName, "Evento Atualizado", `Os detalhes do evento ID ${eventId} ('${title}') foram modificados.`, "success");

        res.status(200).json({ message: 'Evento atualizado com sucesso!' });
    } catch (error) {
        console.error("Erro ao atualizar evento:", error);
        
        // LOG DE ERRO CRÍTICO
        await registerSystemLog(actorId, actorOng, actorName, "Erro ao Atualizar Evento", `Falha técnica ao modificar o evento ID ${eventId}: ${error.message}`, "error");
        
        res.status(500).json({ error: 'Erro ao atualizar evento.' });
    }
};

// Excluir um evento
exports.deleteEvent = async (req, res) => {
    const eventId = req.params.id;
    const actorId = req.user?.id || null;
    const actorName = req.user?.name || 'Sistema';
    const actorOng = req.user?.ong_id || null;

    try {
        const [result] = await db.query('DELETE FROM event_schedules WHERE id = ?', [eventId]);
        
        if (result.affectedRows === 0) {
            await registerSystemLog(actorId, actorOng, actorName, "Exclusão Inválida", `Tentativa de excluir o evento ID ${eventId} que já não existe.`, "warning");
            return res.status(404).json({ error: 'Evento não encontrado.' });
        }

        // LOG DE SUCESSO
        await registerSystemLog(actorId, actorOng, actorName, "Evento Excluído", `O evento ID ${eventId} foi removido permanentemente do calendário.`, "success");

        res.status(200).json({ message: 'Evento excluído com sucesso!' });
    } catch (error) {
        console.error("Erro ao excluir evento:", error);
        
        // LOG DE ERRO CRÍTICO
        await registerSystemLog(actorId, actorOng, actorName, "Erro ao Excluir Evento", `Falha no banco de dados ao tentar excluir o evento ID ${eventId}: ${error.message}`, "error");
        
        res.status(500).json({ error: 'Erro ao excluir evento.' });
    }
};