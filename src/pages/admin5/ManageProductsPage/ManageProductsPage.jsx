// Arquivo: src/pages/admin5/ManageProductsPage/ManageProductsPage.jsx

import React, { useState, useEffect } from 'react';
import ContentWrapper from '../../../components/ui/ContentWrapper/ContentWrapper';
import InputField from '../../../components/ui/InputField/InputField';
import Button from '../../../components/ui/Button/Button';
import Modal from '../../../components/ui/Modal/Modal';
import api from '../../../api/api';
import styles from './ManageProductsPage.module.css';

// URL base para carregar as imagens do backend
const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
const IMAGE_BASE_URL = isLocalhost ? 'http://localhost:3002/api' : 'https://selocidadania.org.br/api';

const ManageProductsPage = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Estados do Formulário e Modais
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [productToDelete, setProductToDelete] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    seal_cost: '',
    stock: ''
  });
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const response = await api.get('/shopping');
      setProducts(response.data);
    } catch (error) {
      console.error("Erro ao carregar produtos:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreateModal = () => {
    setEditingProduct(null);
    setFormData({ name: '', description: '', seal_cost: '', stock: '' });
    setImageFile(null);
    setImagePreview(null);
    setIsFormModalOpen(true);
  };

  const handleOpenEditModal = (product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      description: product.description || '',
      seal_cost: product.seal_cost,
      stock: product.stock
    });
    setImageFile(null);
    setImagePreview(product.image_url ? `${IMAGE_BASE_URL}${product.image_url}` : null);
    setIsFormModalOpen(true);
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      // Cria uma URL temporária para mostrar o preview na tela antes de salvar
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    const data = new FormData();
    data.append('name', formData.name);
    data.append('description', formData.description);
    data.append('seal_cost', formData.seal_cost);
    data.append('stock', formData.stock || 0);
    if (imageFile) data.append('image', imageFile);

    try {
      if (editingProduct) {
        await api.put(`/shopping/${editingProduct.id}`, data);
        alert('Produto atualizado com sucesso!');
      } else {
        await api.post('/shopping', data);
        alert('Produto criado com sucesso!');
      }
      setIsFormModalOpen(false);
      fetchProducts();
    } catch (error) {
      console.error(error);
      alert('Erro ao salvar o produto.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const confirmDelete = async () => {
    if (!productToDelete) return;
    setIsSubmitting(true);
    try {
      await api.delete(`/shopping/${productToDelete.id}`);
      setIsDeleteModalOpen(false);
      fetchProducts();
    } catch (error) {
      alert("Erro ao excluir o produto.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (p.description && p.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <ContentWrapper title="Gestão do Shopping Cidadania">
      
      <div className={styles.headerBlock}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '15px' }}>
          <div>
            <h2 className={styles.mainTitle}>Catálogo de Produtos (Resgates)</h2>
            <p className={styles.introText}>
              Adicione e faça a gestão dos produtos ou prémios que os beneficiários poderão resgatar com os seus selos através da aplicação móvel ou presencialmente.
            </p>
          </div>
          <Button onClick={handleOpenCreateModal} style={{ backgroundColor: '#16a34a', borderColor: '#16a34a', whiteSpace: 'nowrap' }}>
            ➕ Adicionar Novo Produto
          </Button>
        </div>
      </div>

      <div className={styles.catalogSection}>
        <div className={styles.catalogHeader}>
          <div className={styles.searchBox}>
            <span className={styles.searchIcon}>🔍</span>
            <input 
              type="text" 
              placeholder="Pesquisar produto pelo nome..." 
              value={searchTerm} 
              onChange={(e) => setSearchTerm(e.target.value)} 
              className={styles.searchInput} 
            />
          </div>
          <span className={styles.totalItems}>Total: {filteredProducts.length} produto(s)</span>
        </div>

        {loading ? (
          <div className={styles.emptyState}>
            <div className={styles.spinner}></div>
            <p>A carregar montra de produtos...</p>
          </div>
        ) : filteredProducts.length > 0 ? (
          <div className={styles.productGrid}>
            {filteredProducts.map(product => (
              <div key={product.id} className={styles.productCard}>
                <div className={styles.productImageContainer}>
                  {product.image_url ? (
                    <img src={`${IMAGE_BASE_URL}${product.image_url}`} alt={product.name} className={styles.productImage} />
                  ) : (
                    <div className={styles.noImagePlaceholder}>Sem Imagem</div>
                  )}
                  <span className={styles.stockBadge} style={{ backgroundColor: product.stock > 0 ? '#16a34a' : '#ef4444' }}>
                    {product.stock > 0 ? `Em Stock: ${product.stock}` : 'Esgotado'}
                  </span>
                </div>
                
                <div className={styles.productInfo}>
                  <h4 className={styles.productName}>{product.name}</h4>
                  <span className={styles.sealCost}>🪙 {product.seal_cost} Selos</span>
                  <p className={styles.productDesc}>{product.description || 'Nenhuma descrição fornecida.'}</p>
                </div>
                
                <div className={styles.cardActions}>
                  <button onClick={() => handleOpenEditModal(product)} className={styles.editBtn}>✏️ Editar</button>
                  <button onClick={() => { setProductToDelete(product); setIsDeleteModalOpen(true); }} className={styles.deleteBtn}>🗑️ Excluir</button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className={styles.emptyState}>
            <p>Nenhum produto encontrado. Clique no botão acima para adicionar o primeiro produto ao Shopping Cidadania!</p>
          </div>
        )}
      </div>

      {/* MODAL CRIAR/EDITAR PRODUTO */}
      <Modal isOpen={isFormModalOpen} onClose={() => !isSubmitting && setIsFormModalOpen(false)} title={editingProduct ? "Editar Produto" : "Criar Novo Produto"}>
        <form onSubmit={handleSubmit} className={styles.modalForm}>
          
          <div className={styles.formGrid}>
            <div className={styles.inputGroup} style={{ gridColumn: 'span 2' }}>
              <InputField label="Nome do Produto *" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} required />
            </div>
            <div className={styles.inputGroup}>
              <InputField label="Custo (Em Selos) *" type="number" min="1" value={formData.seal_cost} onChange={(e) => setFormData({...formData, seal_cost: e.target.value})} required />
            </div>
            <div className={styles.inputGroup}>
              <InputField label="Quantidade em Stock *" type="number" min="0" value={formData.stock} onChange={(e) => setFormData({...formData, stock: e.target.value})} required />
            </div>
          </div>

          <div className={styles.inputGroup}>
            <label className={styles.customLabel}>Descrição / Detalhes do Produto</label>
            <textarea 
              className={styles.customTextarea} 
              rows="3" 
              value={formData.description} 
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              placeholder="Descreva o produto, tamanho, condições de resgate..."
            ></textarea>
          </div>

          <div className={styles.imageUploadSection}>
            <div className={styles.inputGroup}>
              <InputField label="Imagem do Produto (Opcional mas recomendado)" type="file" accept="image/*" onChange={handleImageChange} />
            </div>
            {imagePreview && (
              <div className={styles.previewContainer}>
                <p style={{ margin: '0 0 5px 0', fontSize: '0.85rem', color: '#64748b' }}>Pré-visualização:</p>
                <img src={imagePreview} alt="Preview" className={styles.previewImage} />
              </div>
            )}
          </div>

          <div className={styles.modalActions}>
            <Button type="button" variant="secondary" onClick={() => setIsFormModalOpen(false)} disabled={isSubmitting}>Cancelar</Button>
            <Button type="submit" style={{ backgroundColor: '#16a34a', borderColor: '#16a34a' }} disabled={isSubmitting}>
              {isSubmitting ? 'A Guardar...' : editingProduct ? 'Salvar Alterações' : 'Cadastrar Produto'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* MODAL CONFIRMAR EXCLUSÃO */}
      <Modal isOpen={isDeleteModalOpen} onClose={() => !isSubmitting && setIsDeleteModalOpen(false)} title="Confirmar Exclusão">
        {productToDelete && (
          <div className={styles.deleteModalContent}>
            <p>Tem a certeza de que pretende remover o produto <strong>{productToDelete.name}</strong> da loja?</p>
            <p style={{ color: '#ef4444', fontSize: '0.9rem', marginTop: '10px' }}>Esta ação não pode ser desfeita e removerá o item do catálogo dos beneficiários.</p>
            <div className={styles.modalActions}>
              <Button variant="secondary" onClick={() => setIsDeleteModalOpen(false)} disabled={isSubmitting}>Cancelar</Button>
              <Button variant="danger" onClick={confirmDelete} disabled={isSubmitting}>{isSubmitting ? 'A Excluir...' : 'Sim, Remover Produto'}</Button>
            </div>
          </div>
        )}
      </Modal>

    </ContentWrapper>
  );
};

export default ManageProductsPage;