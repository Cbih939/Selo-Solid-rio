// Arquivo: src/components/admin/MaintenanceControl.jsx

import React, { useState, useEffect } from 'react';
import api from '../../api/api';
import Button from '../ui/Button/Button';
import InputField from '../ui/InputField/InputField';

const MaintenanceControl = () => {
  const [isActive, setIsActive] = useState(false);
  const [startTime, setStartTime] = useState(''); // ++ NOVO: Horário para iniciar o aviso de 10 min ++
  const [returnTime, setReturnTime] = useState('');
  const [loading, setLoading] = useState(false);

  // Função para formatar a data vinda do banco para o padrão do input (yyyy-MM-ddThh:mm)
  const formatDateTime = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toISOString().slice(0, 16);
  };

  // Busca o status atual ao carregar o componente
  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const response = await api.get('/system-status');
        if (response.data) {
          setIsActive(!!response.data.maintenance_mode);
          setStartTime(formatDateTime(response.data.maintenance_start_at));
          setReturnTime(formatDateTime(response.data.estimated_return_at));
        }
      } catch (error) {
        console.error("Erro ao carregar status de manutenção", error);
      }
    };
    fetchStatus();
  }, []);

  const handleToggleMaintenance = async () => {
    setLoading(true);
    const nextStatus = !isActive;

    try {
      await api.put('/admins/system-setup', {
        maintenance_mode: nextStatus,
        maintenance_start_at: startTime || null, // Envia o horário de início do alerta
        estimated_return_at: returnTime || null
      });

      setIsActive(nextStatus);
      alert(`Modo manutenção ${nextStatus ? 'ATIVADO' : 'DESATIVADO'} com sucesso!`);
    } catch (error) {
      console.error("Erro na requisição:", error);
      alert("Erro ao alterar o modo de manutenção. Verifique a rota no backend.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ 
      padding: '20px', 
      border: '1px solid #ddd', 
      borderRadius: '8px', 
      backgroundColor: isActive ? '#fff3e0' : '#f5f5f5',
      marginBottom: '20px',
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
    }}>
      <h3 style={{ marginTop: 0 }}>⚙️ Controle de Manutenção</h3>
      <p style={{ fontSize: '0.9rem', color: '#666' }}>
        Configure o horário para o aviso aparecer aos usuários (10 min antes) e o bloqueio total do sistema.
      </p>
      
      <div style={{ display: 'flex', gap: '15px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
        
        {/* Campo para definir quando o aviso de 10 minutos deve começar a aparecer */}
        <InputField
          label="Início do Aviso (10 min antes)"
          type="datetime-local"
          value={startTime}
          onChange={(e) => setStartTime(e.target.value)}
        />

        <InputField
          label="Previsão de Retorno"
          type="datetime-local"
          value={returnTime}
          onChange={(e) => setReturnTime(e.target.value)}
        />
        
        <div style={{ marginBottom: '15px' }}>
          <Button 
            onClick={handleToggleMaintenance} 
            variant={isActive ? 'secondary' : 'primary'}
            disabled={loading}
          >
            {loading ? 'Processando...' : isActive ? 'DESATIVAR AGORA' : 'ATIVAR / AGENDAR'}
          </Button>
        </div>
      </div>

      {isActive ? (
        <p style={{ color: '#e65100', marginTop: '15px', fontWeight: 'bold', fontSize: '0.95rem' }}>
          ⚠️ STATUS ATUAL: SISTEMA BLOQUEADO para usuários comuns.
        </p>
      ) : startTime && (
        <p style={{ color: '#007bff', marginTop: '15px', fontSize: '0.85rem' }}>
          ℹ️ O aviso será exibido automaticamente 10 minutos antes do horário de início definido.
        </p>
      )}
    </div>
  );
};

export default MaintenanceControl;