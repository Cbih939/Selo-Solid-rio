const asyncHandler = require('express-async-handler');
const User = require('../models/userModel');
const Dependent = require('../models/dependentModel');
const Seal = require('../models/sealModel');
const { generateToken } = require('../utils/generateToken');
const { sendEmail } = require('../utils/sendEmail');
const { calculateAge } = require('../utils/calculateAge');

// @desc    Register a new user
// @route   POST /api/users
// @access  ONG Coordinator
const createUser = asyncHandler(async (req, res) => {
  const { name, email, cpf, password, phone, birthDate, address, role, ong } = req.body;

  const userExists = await User.findOne({ cpf });

  if (userExists) {
    res.status(400);
    throw new Error('Usuário já cadastrado com este CPF');
  }

  const user = await User.create({
    name,
    email,
    cpf,
    password,
    phone,
    birthDate,
    address,
    role,
    ong,
  });

  if (user) {
    // Enviar e-mail de boas-vindas e instrução de primeiro acesso
    const subject = 'Bem-vindo(a) ao Selo Cidadania!';
    const text = `Olá ${user.name},\n\nSeu cadastro no Selo Cidadania foi realizado com sucesso. Seu login é o seu CPF e sua senha inicial é a que foi informada no cadastro.\n\nPara acessar o sistema, clique no link: [LINK_DO_SISTEMA]\n\nAtenciosamente,\nEquipe Selo Cidadania.`;
    await sendEmail(user.email, subject, text);

    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      cpf: user.cpf,
      role: user.role,
      ong: user.ong,
      token: generateToken(user._id),
    });
  } else {
    res.status(400);
    throw new Error('Dados do usuário inválidos');
  }
});

// @desc    Get user details
// @route   GET /api/users/:id/details
// @access  ONG Coordinator
const getUserDetails = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id).select('-password').populate('ong', 'name');

  if (user) {
    const dependents = await Dependent.find({ user: user._id });
    const seals = await Seal.find({ user: user._id });

    res.json({
      user,
      dependents,
      seals,
    });
  } else {
    res.status(404);
    throw new Error('Usuário não encontrado');
  }
});

// @desc    Update user profile
// @route   PUT /api/users/:id
// @access  ONG Coordinator
const updateUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);

  if (user) {
    user.name = req.body.name || user.name;
    user.email = req.body.email || user.email;
    user.phone = req.body.phone || user.phone;
    user.birthDate = req.body.birthDate || user.birthDate;
    user.address = req.body.address || user.address;
    user.role = req.body.role || user.role;
    user.ong = req.body.ong || user.ong;

    const updatedUser = await user.save();

    res.json({
      _id: updatedUser._id,
      name: updatedUser.name,
      email: updatedUser.email,
      phone: updatedUser.phone,
      birthDate: updatedUser.birthDate,
      address: updatedUser.address,
      role: updatedUser.role,
      ong: updatedUser.ong,
    });
  } else {
    res.status(404);
    throw new Error('Usuário não encontrado');
  }
});

// @desc    Reset user password
// @route   PUT /api/users/:id/reset-password
// @access  ONG Coordinator
const resetPassword = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  const { newPassword } = req.body;

  if (user) {
    user.password = newPassword;
    await user.save();

    // Enviar e-mail de confirmação de troca de senha
    const subject = 'Sua senha foi redefinida';
    const text = `Olá ${user.name},\n\nSua senha no Selo Cidadania foi redefinida com sucesso.\n\nAtenciosamente,\nEquipe Selo Cidadania.`;
    await sendEmail(user.email, subject, text);

    res.json({ message: 'Senha redefinida com sucesso' });
  } else {
    res.status(404);
    throw new Error('Usuário não encontrado');
  }
});

// @desc    Delete user
// @route   DELETE /api/users/:id
// @access  ONG Coordinator
const deleteUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);

  if (user) {
    await user.deleteOne();
    res.json({ message: 'Usuário removido' });
  } else {
    res.status(404);
    throw new Error('Usuário não encontrado');
  }
});

// @desc    Debit seals from user
// @route   POST /api/users/:userId/debit-seals
// @access  ONG Coordinator
const debitSeals = asyncHandler(async (req, res) => {
  const { amount, reason } = req.body;
  const user = await User.findById(req.params.userId);

  if (user) {
    if (user.balance < amount) {
      res.status(400);
      throw new Error('Saldo insuficiente');
    }

    const seal = await Seal.create({
      user: user._id,
      type: 'debit',
      amount: amount,
      reason: reason,
      coordinator: req.user._id, // Assumindo que o coordenador logado está em req.user
    });

    user.balance -= amount;
    await user.save();

    res.status(201).json({ message: 'Selo debitado com sucesso', seal });
  } else {
    res.status(404);
    throw new Error('Usuário não encontrado');
  }
});

// @desc    Get logged in user's dependents
// @route   GET /api/users/me/dependents
// @access  Protect
const getMyDependents = asyncHandler(async (req, res) => {
  const dependents = await Dependent.find({ user: req.user._id });
  res.json(dependents);
});

// @desc    Add a new dependent
// @route   POST /api/users/me/dependents
// @access  Protect
const addMyDependent = asyncHandler(async (req, res) => {
  const { name, cpf, birthDate, kinship } = req.body;

  const dependentExists = await Dependent.findOne({ cpf, user: req.user._id });

  if (dependentExists) {
    res.status(400);
    throw new Error('Dependente já cadastrado com este CPF');
  }

  const dependent = await Dependent.create({
    user: req.user._id,
    name,
    cpf,
    birthDate,
    kinship,
    age: calculateAge(birthDate),
  });

  res.status(201).json(dependent);
});

// @desc    Update a dependent
// @route   PUT /api/users/me/dependents/:dependentId
// @access  Protect
const updateMyDependent = asyncHandler(async (req, res) => {
  const dependent = await Dependent.findOne({ _id: req.params.dependentId, user: req.user._id });

  if (dependent) {
    dependent.name = req.body.name || dependent.name;
    dependent.cpf = req.body.cpf || dependent.cpf;
    dependent.birthDate = req.body.birthDate || dependent.birthDate;
    dependent.kinship = req.body.kinship || dependent.kinship;
    dependent.age = calculateAge(dependent.birthDate);

    const updatedDependent = await dependent.save();
    res.json(updatedDependent);
  } else {
    res.status(404);
    throw new Error('Dependente não encontrado');
  }
});

// @desc    Delete a dependent
// @route   DELETE /api/users/me/dependents/:dependentId
// @access  Protect
const deleteMyDependent = asyncHandler(async (req, res) => {
  const dependent = await Dependent.findOne({ _id: req.params.dependentId, user: req.user._id });

  if (dependent) {
    await dependent.deleteOne();
    res.json({ message: 'Dependente removido' });
  } else {
    res.status(404);
    throw new Error('Dependente não encontrado');
  }
});

// @desc    Get user profile
// @route   GET /api/users/me/profile
// @access  Protect
const getProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).select('-password').populate('ong', 'name');

  if (user) {
    res.json(user);
  } else {
    res.status(404);
    throw new Error('Usuário não encontrado');
  }
});

// @desc    Update user profile
// @route   PUT /api/users/me/profile
// @access  Protect
const updateProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);

  if (user) {
    user.name = req.body.name || user.name;
    user.email = req.body.email || user.email;
    user.phone = req.body.phone || user.phone;
    user.birthDate = req.body.birthDate || user.birthDate;
    user.address = req.body.address || user.address;

    if (req.body.password) {
      user.password = req.body.password;
    }

    const updatedUser = await user.save();

    res.json({
      _id: updatedUser._id,
      name: updatedUser.name,
      email: updatedUser.email,
      phone: updatedUser.phone,
      birthDate: updatedUser.birthDate,
      address: updatedUser.address,
    });
  } else {
    res.status(404);
    throw new Error('Usuário não encontrado');
  }
});

// @desc    Get user seal balance
// @route   GET /api/users/me/balance
// @access  Protect
const getMyBalance = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);

  if (user) {
    res.json({ balance: user.balance });
  } else {
    res.status(404);
    throw new Error('Usuário não encontrado');
  }
});

// @desc    Redeem first login bonus seal
// @route   POST /api/users/me/redeem-first-login
// @access  Protect
const redeemFirstLoginBonus = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);

  if (user) {
    if (user.hasRedeemedFirstLoginBonus) {
      res.status(400);
      throw new Error('Bônus de primeiro login já resgatado');
    }

    const bonusAmount = 1; // Exemplo: 1 selo de bônus
    const seal = await Seal.create({
      user: user._id,
      type: 'credit',
      amount: bonusAmount,
      reason: 'Bônus de primeiro login',
    });

    user.balance += bonusAmount;
    user.hasRedeemedFirstLoginBonus = true;
    await user.save();

    res.status(201).json({ message: 'Bônus de primeiro login resgatado com sucesso', seal });
  } else {
    res.status(404);
    throw new Error('Usuário não encontrado');
  }
});

// @desc    Get all users
// @route   GET /api/users
// @access  Admin
const getAllUsers = asyncHandler(async (req, res) => {
  const users = await User.find({}).select('-password').populate('ong', 'name');
  res.json(users);
});

module.exports = {
  createUser,
  getUserDetails,
  updateUser,
  resetPassword,
  deleteUser,
  debitSeals,
  getMyDependents,
  addMyDependent,
  updateMyDependent,
  deleteMyDependent,
  getProfile,
  updateProfile,
  getMyBalance,
  redeemFirstLoginBonus,
  getAllUsers,
};