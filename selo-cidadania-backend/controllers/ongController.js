/**
 * ongController.js
 * * Este ficheiro contém toda a lógica de negócio para manipular os dados das ONGs.
 * Cada função é exportada para ser usada no ficheiro de rotas (ongRoutes.js).
 */

// Importa os modelos necessários. Ajuste o caminho se for diferente no seu projeto.
const Ong = require('../models/ongModel'); 
const User = require('../models/userModel'); // Necessário para as funções de usuário

// Importa o módulo 'File System' do Node.js para manipular arquivos.
const fs = require('fs');
const path = require('path');

/**
 * Normaliza o caminho do arquivo para ser usado como URL.
 * Ex: remove a pasta 'public' para que o caminho seja relativo à raiz do servidor web.
 * Se o Multer salva em 'public/uploads/file.png', a URL deve ser '/uploads/file.png'.
 * @param {string} filePath - O caminho do arquivo retornado pelo Multer.
 * @returns {string} - O caminho normalizado.
 */
const normalizePath = (filePath) => {
  if (!filePath) return null;
  // Substitui barras invertidas por barras normais (para compatibilidade com Windows)
  // e remove a parte 'public' do caminho.
  return filePath.replace(/\\/g, '/').replace('public', '');
};


// --- Funções CRUD para ONGs ---

/**
 * @desc    Cria uma nova ONG
 * @route   POST /api/ongs
 * @access  Private (requer autenticação, a ser implementada)
 */
exports.createOng = async (req, res) => {
  try {
    // Pega os dados de texto do corpo da requisição
    const ongData = { ...req.body };

    // Verifica se arquivos foram enviados e adiciona seus caminhos aos dados
    if (req.files) {
      if (req.files.logo_file) {
        ongData.logo_url = normalizePath(req.files.logo_file[0].path);
      }
      if (req.files.ata_file) {
        ongData.ata_url = normalizePath(req.files.ata_file[0].path);
      }
      if (req.files.statute_file) {
        ongData.statute_url = normalizePath(req.files.statute_file[0].path);
      }
    }

    const newOng = await Ong.create(ongData);
    res.status(201).json(newOng);

  } catch (error) {
    console.error('Erro ao criar OSC:', error);
    res.status(500).json({ message: 'Erro interno do servidor ao criar a OSC.' });
  }
};

/**
 * @desc    Busca todas as ONGs, com suporte a pesquisa
 * @route   GET /api/ongs
 * @access  Public
 */
exports.getAllOngs = async (req, res) => {
  try {
    const { search } = req.query;
    let filter = {};

    // Se houver um termo de pesquisa, cria um filtro para buscar em vários campos
    if (search) {
      const regex = new RegExp(search, 'i'); // 'i' para case-insensitive
      filter = {
        $or: [
          { fantasy_name: regex },
          { corporate_name: regex },
          { responsible_name: regex },
          { contact_email: regex }
        ]
      };
    }

    const ongs = await Ong.find(filter);
    res.status(200).json(ongs);

  } catch (error) {
    console.error('Erro ao buscar OSCs:', error);
    res.status(500).json({ message: 'Erro interno do servidor ao buscar as OSCs.' });
  }
};

/**
 * @desc    Busca uma única ONG pelo ID
 * @route   GET /api/ongs/:id
 * @access  Public
 */
exports.getOngById = async (req, res) => {
  try {
    const ong = await Ong.findById(req.params.id);
    if (!ong) {
      return res.status(404).json({ message: 'OSC não encontrada.' });
    }
    res.status(200).json(ong);
  } catch (error) {
    console.error('Erro ao buscar OSC por ID:', error);
    res.status(500).json({ message: 'Erro interno do servidor.' });
  }
};

/**
 * @desc    Atualiza uma ONG pelo ID
 * @route   PUT /api/ongs/:id
 * @access  Private
 */
exports.updateOng = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = { ...req.body };

    // Antes de atualizar, busca o registo antigo para pegar os caminhos dos arquivos antigos
    const ongExistente = await Ong.findById(id);
    if (!ongExistente) {
      return res.status(404).json({ message: 'OSC não encontrada para atualização.' });
    }

    // Se novos arquivos foram enviados, atualiza os caminhos e apaga os antigos
    if (req.files) {
      if (req.files.logo_file) {
        // Apaga o logo antigo, se existir
        if (ongExistente.logo_url) {
          fs.unlink(path.join('public', ongExistente.logo_url), (err) => {
            if (err) console.error("Erro ao apagar logo antigo:", err);
          });
        }
        updateData.logo_url = normalizePath(req.files.logo_file[0].path);
      }
      if (req.files.ata_file) {
        if (ongExistente.ata_url) {
          fs.unlink(path.join('public', ongExistente.ata_url), (err) => {
             if (err) console.error("Erro ao apagar ATA antiga:", err);
          });
        }
        updateData.ata_url = normalizePath(req.files.ata_file[0].path);
      }
      if (req.files.statute_file) {
        if (ongExistente.statute_url) {
          fs.unlink(path.join('public', ongExistente.statute_url), (err) => {
            if (err) console.error("Erro ao apagar estatuto antigo:", err);
          });
        }
        updateData.statute_url = normalizePath(req.files.statute_file[0].path);
      }
    }

    const ongAtualizada = await Ong.findByIdAndUpdate(id, updateData, { new: true, runValidators: true });
    res.status(200).json(ongAtualizada);

  } catch (error) {
    console.error('Erro ao atualizar OSC:', error);
    res.status(500).json({ message: 'Erro interno do servidor ao atualizar a OSC.' });
  }
};

/**
 * @desc    Exclui uma ONG pelo ID
 * @route   DELETE /api/ongs/:id
 * @access  Private
 */
exports.deleteOng = async (req, res) => {
  try {
    const ong = await Ong.findById(req.params.id);

    if (!ong) {
      return res.status(404).json({ message: 'OSC não encontrada para exclusão.' });
    }

    // Apaga os arquivos associados à ONG do sistema de arquivos
    if (ong.logo_url) fs.unlink(path.join('public', ong.logo_url), () => {});
    if (ong.ata_url) fs.unlink(path.join('public', ong.ata_url), () => {});
    if (ong.statute_url) fs.unlink(path.join('public', ong.statute_url), () => {});

    // Remove a ONG do banco de dados
    await Ong.findByIdAndDelete(req.params.id);

    res.status(200).json({ message: 'OSC excluída com sucesso.' });
  } catch (error) {
    console.error('Erro ao excluir OSC:', error);
    res.status(500).json({ message: 'Erro interno do servidor ao excluir a OSC.' });
  }
};


// --- Funções específicas de Usuários da ONG ---

/**
 * @desc    Lista todos os usuários de uma ONG específica
 * @route   GET /api/ongs/:ongId/users
 * @access  Private
 */
exports.getOngUsers = async (req, res) => {
    try {
        const { ongId } = req.params;
        // Assumindo que o modelo de Usuário tem uma referência para a ONG
        const users = await User.find({ ong: ongId });
        
        if (!users) {
            return res.status(404).json({ message: 'Nenhum usuário encontrado para esta OSC.' });
        }

        res.status(200).json(users);
    } catch (error) {
        console.error('Erro ao buscar usuários da OSC:', error);
        res.status(500).json({ message: 'Erro interno do servidor.' });
    }
};

/**
 * @desc    Debita o saldo de um usuário (exemplo de lógica de negócio)
 * @route   POST /api/ongs/debit-balance
 * @access  Private
 */
exports.debitUserBalance = async (req, res) => {
    try {
        const { userId, amount } = req.body;

        if (!userId || !amount || amount <= 0) {
            return res.status(400).json({ message: 'ID do usuário e um valor positivo são obrigatórios.' });
        }

        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({ message: 'Usuário não encontrado.' });
        }

        if (user.balance < amount) {
            return res.status(400).json({ message: 'Saldo insuficiente.' });
        }

        user.balance -= amount;
        await user.save();

        res.status(200).json({ message: 'Débito realizado com sucesso.', user });

    } catch (error) {
        console.error('Erro ao debitar saldo do usuário:', error);
        res.status(500).json({ message: 'Erro interno do servidor.' });
    }
};