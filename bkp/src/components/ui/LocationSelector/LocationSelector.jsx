import React, { useState, useEffect } from 'react';
import SelectField from '../SelectField/SelectField';
import styles from './LocationSelector.module.css';

// Este componente recebe uma função 'onLocationChange' para comunicar as alterações ao formulário pai.
const LocationSelector = ({ onLocationChange, initialLocation }) => {
  const [states, setStates] = useState([]);
  const [cities, setCities] = useState([]);
  const [selectedState, setSelectedState] = useState(initialLocation.state || '');
  const [selectedCity, setSelectedCity] = useState(initialLocation.city || '');

  // Efeito para buscar a lista de estados (UFs) na API do IBGE
  useEffect(() => {
    const fetchStates = async () => {
      try {
        const response = await fetch('https://servicodados.ibge.gov.br/api/v1/localidades/estados?orderBy=nome');
        const data = await response.json();
        setStates(data);
      } catch (error) {
        console.error("Erro ao buscar estados:", error);
      }
    };
    fetchStates();
  }, []);

  // Efeito para buscar as cidades sempre que um estado for selecionado
  useEffect(() => {
    if (selectedState) {
      const fetchCities = async () => {
        try {
          const response = await fetch(`https://servicodados.ibge.gov.br/api/v1/localidades/estados/${selectedState}/municipios`);
          const data = await response.json();
          setCities(data);
        } catch (error) {
          console.error("Erro ao buscar cidades:", error);
        }
      };
      fetchCities();
    } else {
      setCities([]); // Limpa as cidades se nenhum estado estiver selecionado
    }
  }, [selectedState]);

  const handleStateChange = (e) => {
    const stateUF = e.target.value;
    setSelectedState(stateUF);
    setSelectedCity(''); // Limpa a cidade ao trocar de estado
    onLocationChange({ state: stateUF, city: '' });
  };

  const handleCityChange = (e) => {
    const cityName = e.target.value;
    setSelectedCity(cityName);
    onLocationChange({ state: selectedState, city: cityName });
  };

  return (
    <div className={styles.grid}>
      <SelectField label="Estado" name="state" value={selectedState} onChange={handleStateChange}>
        <option value="">Selecione um estado</option>
        {states.map(state => (
          <option key={state.id} value={state.sigla}>
            {state.nome}
          </option>
        ))}
      </SelectField>

      <SelectField label="Cidade" name="city" value={selectedCity} onChange={handleCityChange}>
        <option value="">{selectedState ? 'Selecione uma cidade' : 'Escolha um estado primeiro'}</option>
        {cities.map(city => (
          <option key={city.id} value={city.nome}>
            {city.nome}
          </option>
        ))}
      </SelectField>
    </div>
  );
};

export default LocationSelector;