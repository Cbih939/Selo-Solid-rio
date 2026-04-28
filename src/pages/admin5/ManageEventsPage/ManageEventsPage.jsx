import React, { useState, useEffect } from 'react';
import ContentWrapper from '../../../components/ui/ContentWrapper/ContentWrapper';
import InputField from '../../../components/ui/InputField/InputField';
import Button from '../../../components/ui/Button/Button';
import Modal from '../../../components/ui/Modal/Modal';
import api from '../../../api/api';
import styles from './ManageEventsPage.module.css';

const ManageEventsPage = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [eventToDelete, setEventToDelete] = useState(null);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    event_date: '',
    event_time: '',
    location: ''
  });

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const response = await api.get('/events');
      setEvents(response.data);
    } catch (error) {
      console.error("Erro ao carregar eventos:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreateModal = () => {
    setEditingEvent(null);
    setFormData({ title: '', description: '', event_date: '', event_time: '', location: '' });
    setIsFormModalOpen(true);
  };

  const handleOpenEditModal = (event) => {
    setEditingEvent(event);
    // Converter a data do banco (ISO) para os inputs de data e hora
    const d = new Date(event.event_date);
    const dateStr = d.toISOString().split('T')[0];
    const timeStr = d.toTimeString().split('T')[1].substring(0, 5);

    setFormData({
      title: event.title,
      description: event.description || '',
      event_date: dateStr,
      event_time: timeStr,
      location: event.location
    });
    setIsFormModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Juntar data e hora para enviar ao backend
    const dateTimeCombined = `${formData.event_date}T${formData.event_time}:00`;
    
    const payload = {
      title: formData.title,
      description: formData.description,
      event_date: dateTimeCombined,
      location: formData.location
    };

    try {
      if (editingEvent) {
        await api.put(`/events/${editingEvent.id}`, payload);
        alert('Evento atualizado com sucesso!');
      } else {
        await api.post('/events', payload);
        alert('Evento agendado com sucesso!');
      }
      setIsFormModalOpen(false);
      fetchEvents();
    } catch (error) {
      console.error(error);
      alert('Erro ao guardar o evento.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const confirmDelete = async () => {
    if (!eventToDelete) return;
    setIsSubmitting(true);
    try {
      await api.delete(`/events/${eventToDelete.id}`);
      setIsDeleteModalOpen(false);
      fetchEvents();
    } catch (error) {
      alert("Erro ao cancelar o evento.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredEvents = events.filter(e => 
    e.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
    e.location.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <ContentWrapper title="Gestão de Eventos e Agendamentos">
      
      <div className={styles.headerBlock}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '15px' }}>
          <div>
            <h2 className={styles.mainTitle}>Calendário de Ações</h2>
            <p className={styles.introText}>
              Agende os eventos do Shopping Cidadania, ações de recolha de provas sociais presenciais e outras iniciativas da plataforma.
            </p>
          </div>
          <Button onClick={handleOpenCreateModal} style={{ backgroundColor: '#0284c7', borderColor: '#0284c7', whiteSpace: 'nowrap' }}>
            📅 Agendar Novo Evento
          </Button>
        </div>
      </div>

      <div className={styles.catalogSection}>
        <div className={styles.catalogHeader}>
          <div className={styles.searchBox}>
            <span className={styles.searchIcon}>🔍</span>
            <input 
              type="text" 
              placeholder="Pesquisar por título ou local..." 
              value={searchTerm} 
              onChange={(e) => setSearchTerm(e.target.value)} 
              className={styles.searchInput} 
            />
          </div>
        </div>

        {loading ? (
          <div className={styles.emptyState}>
            <div className={styles.spinner}></div>
            <p>A carregar agenda...</p>
          </div>
        ) : filteredEvents.length > 0 ? (
          <div className={styles.eventGrid}>
            {filteredEvents.map(event => {
              const eventDateObj = new Date(event.event_date);
              const isPast = eventDateObj < new Date();

              return (
                <div key={event.id} className={`${styles.eventCard} ${isPast ? styles.eventCardPast : ''}`}>
                  <div className={styles.dateBlock}>
                    <span className={styles.dateMonth}>{eventDateObj.toLocaleString('pt-BR', { month: 'short' }).toUpperCase()}</span>
                    <span className={styles.dateDay}>{eventDateObj.getDate()}</span>
                  </div>
                  
                  <div className={styles.eventInfo}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <h4 className={styles.eventTitle}>{event.title}</h4>
                      {isPast ? <span className={styles.badgePast}>Concluído</span> : <span className={styles.badgeActive}>A decorrer</span>}
                    </div>
                    <p className={styles.eventMeta}>📍 {event.location}</p>
                    <p className={styles.eventMeta}>⏰ {eventDateObj.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })} horas</p>
                    <p className={styles.eventDesc}>{event.description || 'Sem detalhes adicionais.'}</p>
                  </div>
                  
                  <div className={styles.cardActions}>
                    <button onClick={() => handleOpenEditModal(event)} className={styles.editBtn}>✏️ Editar</button>
                    <button onClick={() => { setEventToDelete(event); setIsDeleteModalOpen(true); }} className={styles.deleteBtn}>🗑️ Cancelar</button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className={styles.emptyState}>
            <p>Nenhum evento agendado encontrado.</p>
          </div>
        )}
      </div>

      {/* MODAL CRIAR/EDITAR EVENTO */}
      <Modal isOpen={isFormModalOpen} onClose={() => !isSubmitting && setIsFormModalOpen(false)} title={editingEvent ? "Editar Evento" : "Agendar Novo Evento"}>
        <form onSubmit={handleSubmit} className={styles.modalForm}>
          
          <div className={styles.inputGroup}>
            <InputField label="Título do Evento *" value={formData.title} onChange={(e) => setFormData({...formData, title: e.target.value})} placeholder="Ex: Feira Shopping Cidadania - Edição Natal" required />
          </div>

          <div className={styles.formGrid}>
            <div className={styles.inputGroup}>
              <InputField label="Data *" type="date" value={formData.event_date} onChange={(e) => setFormData({...formData, event_date: e.target.value})} required />
            </div>
            <div className={styles.inputGroup}>
              <InputField label="Hora de Início *" type="time" value={formData.event_time} onChange={(e) => setFormData({...formData, event_time: e.target.value})} required />
            </div>
          </div>

          <div className={styles.inputGroup}>
            <InputField label="Local do Evento *" value={formData.location} onChange={(e) => setFormData({...formData, location: e.target.value})} placeholder="Ex: Praça Central / Ginásio da OSC" required />
          </div>

          <div className={styles.inputGroup}>
            <label className={styles.customLabel}>Descrição e Detalhes</label>
            <textarea 
              className={styles.customTextarea} 
              rows="4" 
              value={formData.description} 
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              placeholder="Descreva as atividades, regras de participação..."
            ></textarea>
          </div>

          <div className={styles.modalActions}>
            <Button type="button" variant="secondary" onClick={() => setIsFormModalOpen(false)} disabled={isSubmitting}>Cancelar</Button>
            <Button type="submit" style={{ backgroundColor: '#0284c7', borderColor: '#0284c7' }} disabled={isSubmitting}>
              {isSubmitting ? 'A Guardar...' : editingEvent ? 'Salvar Alterações' : 'Confirmar Agendamento'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* MODAL CONFIRMAR CANCELAMENTO */}
      <Modal isOpen={isDeleteModalOpen} onClose={() => !isSubmitting && setIsDeleteModalOpen(false)} title="Cancelar Evento">
        {eventToDelete && (
          <div className={styles.deleteModalContent}>
            <p>Tem a certeza de que pretende cancelar e apagar o evento <strong>{eventToDelete.title}</strong>?</p>
            <div className={styles.modalActions}>
              <Button variant="secondary" onClick={() => setIsDeleteModalOpen(false)} disabled={isSubmitting}>Voltar</Button>
              <Button variant="danger" onClick={confirmDelete} disabled={isSubmitting}>{isSubmitting ? 'A Cancelar...' : 'Sim, Cancelar Evento'}</Button>
            </div>
          </div>
        )}
      </Modal>

    </ContentWrapper>
  );
};

export default ManageEventsPage;