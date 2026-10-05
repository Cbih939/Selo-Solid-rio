// Arquivo: selo-cidadania-backend/controllers/familyProfileController.js
// Cadastro e Perfil Sociofamiliar da Família + Instrumento Interno de Triagem Socioeconômica
// (Programa Selo Cidadania)

const fs = require('fs');
const path = require('path');
const db = require('../config/db');
const { registerSystemLog } = require('./logController');
const { isStaff, findAccessibleUser } = require('../utils/userAccess');
const { PRIVATE_DIR } = require('../middlewares/privateUpload');

// ---------------------------------------------------------------------------
// Estrutura do banco (criada automaticamente na primeira utilização)
// ---------------------------------------------------------------------------
let tablesReady = null;

const ensureTables = () => {
  if (!tablesReady) {
    tablesReady = (async () => {
      await db.query(`
        CREATE TABLE IF NOT EXISTS family_profiles (
          user_id INT NOT NULL PRIMARY KEY,
          data LONGTEXT NOT NULL,
          declaration_accepted TINYINT(1) NOT NULL DEFAULT 0,
          photo_consent TINYINT(1) NOT NULL DEFAULT 0,
          reforma_interest TINYINT(1) NOT NULL DEFAULT 0,
          submitted_at DATETIME NULL,
          updated_by INT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        ) DEFAULT CHARSET=utf8mb4
      `);
      await db.query(`
        CREATE TABLE IF NOT EXISTS family_profile_files (
          id INT AUTO_INCREMENT PRIMARY KEY,
          user_id INT NOT NULL,
          category VARCHAR(30) NOT NULL,
          subtype VARCHAR(80) NULL,
          file_name VARCHAR(255) NOT NULL,
          original_name VARCHAR(255) NULL,
          mime_type VARCHAR(100) NULL,
          uploaded_by INT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          INDEX idx_fpf_user (user_id)
        ) DEFAULT CHARSET=utf8mb4
      `);
      await db.query(`
        CREATE TABLE IF NOT EXISTS socioeconomic_triages (
          id INT AUTO_INCREMENT PRIMARY KEY,
          user_id INT NOT NULL,
          data LONGTEXT NOT NULL,
          total_score INT NOT NULL DEFAULT 0,
          classification VARCHAR(60) NULL,
          analyst_name VARCHAR(255) NULL,
          created_by INT NULL,
          updated_by INT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          INDEX idx_st_user (user_id)
        ) DEFAULT CHARSET=utf8mb4
      `);

      // Novas colunas da composição familiar na tabela de dependentes
      const [cols] = await db.query(
        `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'dependents'`
      );
      const existing = cols.map(c => c.COLUMN_NAME);
      if (!existing.includes('works')) await db.query('ALTER TABLE dependents ADD COLUMN works VARCHAR(10) NULL');
      if (!existing.includes('studies')) await db.query('ALTER TABLE dependents ADD COLUMN studies VARCHAR(10) NULL');
      if (!existing.includes('monthly_income')) await db.query('ALTER TABLE dependents ADD COLUMN monthly_income DECIMAL(10,2) NULL');
    })().catch(err => {
      tablesReady = null; // permite nova tentativa na próxima requisição
      throw err;
    });
  }
  return tablesReady;
};

const parseJson = (value, fallback) => {
  if (!value) return fallback;
  try { return JSON.parse(value); } catch (e) { return fallback; }
};

const actorName = (req) => req.user?.name || 'Equipe';

// Garante tabelas + permissão de acesso ao beneficiário. Retorna o alvo ou null (resposta já enviada).
const guard = async (req, res, { staffOnly = false } = {}) => {
  await ensureTables();
  if (staffOnly && !isStaff(req.user)) {
    res.status(403).json({ error: 'Acesso restrito à equipe autorizada.' });
    return null;
  }
  const target = await findAccessibleUser(req.user, req.params.userId);
  if (!target) {
    res.status(404).json({ error: 'Beneficiário não encontrado ou sem permissão de acesso.' });
    return null;
  }
  return target;
};

// ---------------------------------------------------------------------------
// PERFIL SOCIOFAMILIAR (preenchido pela família, editável pela OSC/Admin)
// ---------------------------------------------------------------------------
exports.getFamilyProfile = async (req, res) => {
  try {
    const target = await guard(req, res);
    if (!target) return;

    const [rows] = await db.query('SELECT * FROM family_profiles WHERE user_id = ?', [target.id]);
    const [files] = await db.query(
      'SELECT id, category, subtype, original_name, mime_type, created_at FROM family_profile_files WHERE user_id = ? ORDER BY created_at DESC',
      [target.id]
    );

    const profile = rows[0];
    res.status(200).json({
      user_id: target.id,
      data: profile ? parseJson(profile.data, {}) : {},
      declaration_accepted: !!profile?.declaration_accepted,
      photo_consent: !!profile?.photo_consent,
      submitted_at: profile?.submitted_at || null,
      updated_at: profile?.updated_at || null,
      files
    });
  } catch (error) {
    console.error('Erro ao buscar perfil sociofamiliar:', error);
    res.status(500).json({ error: 'Erro ao buscar o perfil sociofamiliar.' });
  }
};

exports.saveFamilyProfile = async (req, res) => {
  try {
    const target = await guard(req, res);
    if (!target) return;

    const data = req.body?.data;
    if (!data || typeof data !== 'object') {
      return res.status(400).json({ error: 'Dados do formulário inválidos.' });
    }

    const declarationAccepted = data.declaracao?.ciente ? 1 : 0;
    const photoConsent = data.declaracao?.autoriza_fotos ? 1 : 0;
    const reformaInterest = data.fotos?.interesse_reforma ? 1 : 0;

    await db.query(
      `INSERT INTO family_profiles (user_id, data, declaration_accepted, photo_consent, reforma_interest, submitted_at, updated_by)
       VALUES (?, ?, ?, ?, ?, IF(? = 1, NOW(), NULL), ?)
       ON DUPLICATE KEY UPDATE
         data = VALUES(data),
         declaration_accepted = VALUES(declaration_accepted),
         photo_consent = VALUES(photo_consent),
         reforma_interest = VALUES(reforma_interest),
         submitted_at = IF(VALUES(declaration_accepted) = 1, COALESCE(submitted_at, NOW()), submitted_at),
         updated_by = VALUES(updated_by)`,
      [target.id, JSON.stringify(data), declarationAccepted, photoConsent, reformaInterest, declarationAccepted, req.user.id]
    );

    await registerSystemLog(
      req.user.id, target.ong_id, actorName(req), 'Perfil Sociofamiliar Atualizado',
      `O cadastro sociofamiliar do beneficiário ID ${target.id} ('${target.name}') foi atualizado.`, 'success'
    );

    res.status(200).json({ message: 'Cadastro sociofamiliar salvo com sucesso.' });
  } catch (error) {
    console.error('Erro ao salvar perfil sociofamiliar:', error);
    res.status(500).json({ error: 'Erro ao salvar o cadastro sociofamiliar.' });
  }
};

// ---------------------------------------------------------------------------
// ARQUIVOS (fotos da moradia e documentos) - armazenados fora da pasta pública
// ---------------------------------------------------------------------------
const FILE_CATEGORIES = ['housing_photo', 'document'];

const removeLocalFile = (fileName) => {
  if (!fileName) return;
  fs.unlink(path.join(PRIVATE_DIR, path.basename(fileName)), () => {});
};

exports.uploadFile = async (req, res) => {
  try {
    const target = await guard(req, res);
    if (!target) { removeLocalFile(req.file?.filename); return; }
    if (!req.file) return res.status(400).json({ error: 'Nenhum arquivo enviado.' });

    const { category, subtype } = req.body;
    if (!FILE_CATEGORIES.includes(category)) {
      removeLocalFile(req.file.filename);
      return res.status(400).json({ error: 'Categoria de arquivo inválida.' });
    }

    const [result] = await db.query(
      `INSERT INTO family_profile_files (user_id, category, subtype, file_name, original_name, mime_type, uploaded_by)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [target.id, category, (subtype || '').slice(0, 80) || null, req.file.filename, req.file.originalname, req.file.mimetype, req.user.id]
    );

    res.status(201).json({
      id: result.insertId, category, subtype: subtype || null,
      original_name: req.file.originalname, mime_type: req.file.mimetype, created_at: new Date()
    });
  } catch (error) {
    removeLocalFile(req.file?.filename);
    console.error('Erro ao enviar arquivo do perfil sociofamiliar:', error);
    res.status(500).json({ error: 'Erro ao enviar o arquivo.' });
  }
};

exports.downloadFile = async (req, res) => {
  try {
    const target = await guard(req, res);
    if (!target) return;

    const [rows] = await db.query('SELECT * FROM family_profile_files WHERE id = ? AND user_id = ?', [req.params.fileId, target.id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Arquivo não encontrado.' });

    const file = rows[0];
    const filePath = path.join(PRIVATE_DIR, path.basename(file.file_name));
    if (!fs.existsSync(filePath)) return res.status(404).json({ error: 'Arquivo não encontrado no servidor.' });

    res.setHeader('Content-Type', file.mime_type || 'application/octet-stream');
    res.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(file.original_name || file.file_name)}"`);
    res.setHeader('Cache-Control', 'private, no-store');
    fs.createReadStream(filePath).pipe(res);
  } catch (error) {
    console.error('Erro ao baixar arquivo do perfil sociofamiliar:', error);
    res.status(500).json({ error: 'Erro ao abrir o arquivo.' });
  }
};

exports.deleteFile = async (req, res) => {
  try {
    const target = await guard(req, res);
    if (!target) return;

    const [rows] = await db.query('SELECT * FROM family_profile_files WHERE id = ? AND user_id = ?', [req.params.fileId, target.id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Arquivo não encontrado.' });

    await db.query('DELETE FROM family_profile_files WHERE id = ?', [rows[0].id]);
    removeLocalFile(rows[0].file_name);
    res.status(200).json({ message: 'Arquivo removido.' });
  } catch (error) {
    console.error('Erro ao remover arquivo do perfil sociofamiliar:', error);
    res.status(500).json({ error: 'Erro ao remover o arquivo.' });
  }
};

// ---------------------------------------------------------------------------
// TRIAGEM E CLASSIFICAÇÃO SOCIOECONÔMICA (uso exclusivo da equipe)
// ---------------------------------------------------------------------------
const AXIS_MAX = {
  renda: 30, trabalho: 10, composicao: 10, cadunico: 5,
  saude: 10, moradia: 25, comprometimento: 5, rede: 5
};

const classify = (total) => {
  if (total >= 75) return 'Vulnerabilidade muito alta';
  if (total >= 55) return 'Alta vulnerabilidade';
  if (total >= 35) return 'Vulnerabilidade moderada';
  if (total >= 20) return 'Vulnerabilidade leve';
  return 'Sem prioridade pela matriz';
};

// A pontuação é recalculada no servidor a partir dos eixos, respeitando o máximo de cada um.
const computeTotal = (scores = {}) => Object.entries(AXIS_MAX).reduce((sum, [axis, max]) => {
  const value = Math.max(0, Math.min(max, parseInt(scores[axis], 10) || 0));
  return sum + value;
}, 0);

const formatTriage = (row) => ({
  id: row.id,
  user_id: row.user_id,
  data: parseJson(row.data, {}),
  total_score: row.total_score,
  classification: row.classification,
  analyst_name: row.analyst_name,
  created_at: row.created_at,
  updated_at: row.updated_at
});

exports.listTriages = async (req, res) => {
  try {
    const target = await guard(req, res, { staffOnly: true });
    if (!target) return;
    const [rows] = await db.query('SELECT * FROM socioeconomic_triages WHERE user_id = ? ORDER BY created_at DESC, id DESC', [target.id]);
    res.status(200).json(rows.map(formatTriage));
  } catch (error) {
    console.error('Erro ao listar triagens:', error);
    res.status(500).json({ error: 'Erro ao buscar as triagens.' });
  }
};

const saveTriage = async (req, res, triageId) => {
  const target = await guard(req, res, { staffOnly: true });
  if (!target) return;

  const data = req.body?.data;
  if (!data || typeof data !== 'object') return res.status(400).json({ error: 'Dados da triagem inválidos.' });

  const total = computeTotal(data.pontuacao);
  const classification = classify(total);
  data.resultado = { ...(data.resultado || {}), pontuacao_final: total, classificacao_calculada: classification };
  const analyst = data.identificacao?.responsavel || actorName(req);

  let id = triageId;
  if (triageId) {
    const [result] = await db.query(
      `UPDATE socioeconomic_triages SET data = ?, total_score = ?, classification = ?, analyst_name = ?, updated_by = ?
       WHERE id = ? AND user_id = ?`,
      [JSON.stringify(data), total, classification, analyst, req.user.id, triageId, target.id]
    );
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Triagem não encontrada.' });
  } else {
    const [result] = await db.query(
      `INSERT INTO socioeconomic_triages (user_id, data, total_score, classification, analyst_name, created_by, updated_by)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [target.id, JSON.stringify(data), total, classification, analyst, req.user.id, req.user.id]
    );
    id = result.insertId;
  }

  await registerSystemLog(
    req.user.id, target.ong_id, actorName(req), triageId ? 'Triagem Socioeconômica Atualizada' : 'Triagem Socioeconômica Registrada',
    `Triagem do beneficiário ID ${target.id} ('${target.name}'): ${total}/100 - ${classification}.`, 'success'
  );

  const [rows] = await db.query('SELECT * FROM socioeconomic_triages WHERE id = ?', [id]);
  res.status(triageId ? 200 : 201).json(formatTriage(rows[0]));
};

exports.createTriage = async (req, res) => {
  try { await saveTriage(req, res, null); } catch (error) {
    console.error('Erro ao registrar triagem:', error);
    res.status(500).json({ error: 'Erro ao registrar a triagem.' });
  }
};

exports.updateTriage = async (req, res) => {
  try { await saveTriage(req, res, req.params.triageId); } catch (error) {
    console.error('Erro ao atualizar triagem:', error);
    res.status(500).json({ error: 'Erro ao atualizar a triagem.' });
  }
};

// Resumo por beneficiário (cadastro preenchido + última triagem) para as listagens da equipe.
// OSC vê apenas a sua instituição; admins podem filtrar por ?ong_id=
exports.getSummary = async (req, res) => {
  try {
    await ensureTables();
    if (!isStaff(req.user)) return res.status(403).json({ error: 'Acesso restrito à equipe autorizada.' });

    const ongId = req.user.role === 'ong' ? req.user.ong_id : (req.query.ong_id || null);
    if (req.user.role === 'ong' && !ongId) return res.status(200).json([]);

    const params = [];
    let where = 'u.role_id = 4';
    if (ongId) { where += ' AND u.ong_id = ?'; params.push(ongId); }

    const [rows] = await db.query(
      `SELECT u.id AS user_id,
              fp.declaration_accepted, fp.updated_at AS profile_updated_at, fp.reforma_interest,
              t.total_score, t.classification, t.created_at AS triage_date
       FROM users u
       LEFT JOIN family_profiles fp ON fp.user_id = u.id
       LEFT JOIN socioeconomic_triages t ON t.id = (
         SELECT t2.id FROM socioeconomic_triages t2 WHERE t2.user_id = u.id ORDER BY t2.created_at DESC, t2.id DESC LIMIT 1
       )
       WHERE ${where}`,
      params
    );
    res.status(200).json(rows);
  } catch (error) {
    console.error('Erro ao buscar resumo sociofamiliar:', error);
    res.status(500).json({ error: 'Erro ao buscar o resumo das triagens.' });
  }
};

exports.ensureTables = ensureTables;
