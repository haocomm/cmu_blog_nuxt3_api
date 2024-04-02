const crypto = require('crypto');
const bcryptjs = require('bcryptjs');
const dayjs = require('dayjs');
const db = require('../models');
const { MailVerify, MailResetPassword } = require('../config/mailer');

const Op = db.Sequelize.Op;
const User = db.User;
const AccessToken = db.AccessToken;

const findByEmail = async (email, res, include = []) => {
  const where = {
    email,
  };
  const data = await User.findOne({
    where,
    include,
  });
  return data;
};
const findByResetPasswordToken = async (passwordResetToken, res, include = []) => {
  const where = {
    password_reset_token: passwordResetToken,
    password_reset_expire_at: {
      [Op.gte]: dayjs().format('YYYY-MM-DD HH:mm:ss'),
    },
  };
  const data = await User.findOne({
    where,
    include,
  });
  return data;
};
const updateUser = async (id, data, res) => {
  try {
    return await db.sequelize.transaction((t) => {
      return User.update(
        data,
        {
          where: {
            id,
          },
        },
        {
          transaction: t,
        }
      );
    });
  } catch (e) {
    return res.status(500).json({
      message: 'Cannot store data to database.' + e,
    });
  }
};

module.exports = {
  forgotPassword: async (req, res, next) => {
    const body = req.body;
    try {
      const data = await findByEmail(body.email, res);
      if (!data)
        return res.status(404).json({
          message: 'Not Found',
        });
      const passwordResetToken = crypto.randomBytes(16).toString('hex');
      const updateData = {
        password_reset_token: passwordResetToken,
        password_reset_expire_at: dayjs().add(15, 'minutes').format('YYYY-MM-DD HH:mm:ss'),
      };
      await updateUser(data.id, updateData, res);
      await MailResetPassword(data.email, passwordResetToken, `${process.env.BASE_URL}/backend/reset-password/`);
      return res.status(204).send();
    } catch (e) {
      e.message = 'Error: ' + e;
      next(e);
    }
  },
  checkPasswordToken: async (req, res, next) => {
    const body = req.body;
    try {
      const data = await findByResetPasswordToken(body.token, res);
      if (!data)
        return res.status(404).json({
          message: 'Not Found',
        });
      return res.status(204).send();
    } catch (e) {
      e.message = 'Error: ' + e;
      next(e);
    }
  },
  resetPassword: async (req, res, next) => {
    const token = req.params.token;
    const body = req.body;
    try {
      const data = await findByResetPasswordToken(token, res);
      if (!data)
        return res.status(404).json({
          message: 'Not Found',
        });
      const salt = bcryptjs.genSaltSync(10);
      const updateData = {
        salt,
        password: bcryptjs.hashSync(body.password, salt),
        password_reset_expire_at: dayjs().format('YYYY-MM-DD HH:mm:ss'),
      };
      if (!data.password_created_at) {
        updateData.password_created_at = dayjs().format('YYYY-MM-DD HH:mm:ss');
      }
      if (!data.verify_at) {
        updateData.verify_at = dayjs().format('YYYY-MM-DD HH:mm:ss');
      }
      await updateUser(data.id, updateData, res);
      return res.status(204).send();
    } catch (e) {
      e.message = 'Error: ' + e;
      next(e);
    }
  },
  login: async (req, res, next) => {
    try {
      const newRefreshToken = crypto.randomBytes(32).toString('hex');
      await db.sequelize.transaction((t) => {
        return User.update(
          {
            refresh_token: newRefreshToken,
            refresh_token_expire_at: dayjs().add(10, 'hours').format('YYYY-MM-DD HH:mm:ss'),
          },
          {
            where: {
              id: req.user.id,
            },
          },
          {
            transaction: t,
          }
        );
      });

      const data = {
        user_id: req.user.id,
        ip: req.headers['x-forwarded-for'] || req.connection.remoteAddress,
      };

      const newData = await db.sequelize.transaction((t) => {
        return AccessToken.create(data, {
          transaction: t,
        });
      });
      return res.status(200).json({
        access_token: newData.access_token,
        refresh_token: newRefreshToken,
      });
    } catch (e) {
      e.message = 'Error: ' + e;
      next(e);
    }
  },
  token: async (req, res, next) => {
    const refreshToken = req.body.refresh_token;
    if (refreshToken) {
      try {
        const refresh = await User.findOne({
          where: {
            refresh_token: refreshToken,
            refresh_token_expire_at: {
              [Op.gte]: dayjs().format('YYYY-MM-DD HH:mm:ss'),
            },
          },
        });
        if (refresh) {
          const data = {
            user_id: refresh.id,
            ip: req.headers['x-forwarded-for'] || req.connection.remoteAddress,
          };
          try {
            const newData = await db.sequelize.transaction((t) => {
              return AccessToken.create(data, {
                transaction: t,
              });
            });
            return res.status(200).json({
              access_token: newData.access_token,
            });
          } catch (e) {
            e.message = 'Error: ' + e;
            next(e);
          }
        }
      } catch (e) {
        return res.status(401).json({
          message: 'Unauthorized' + e,
        });
      }
    }
    return res.status(400).json({
      message: 'Bad request',
    });
  },
  me: (req, res) => {
    return res.status(200).json({
      user: {
        firstname: req.user.firstname,
        lastname: req.user.lastname,
        email: req.user.email,
        role: req.user.role,
      },
    });
  },
  updateProfile: async (req, res, next) => {
    const data = req.body;
    try {
      await updateUser(req.user.id, data, res);
    } catch (e) {
      e.message = 'Error: ' + e;
      next(e);
    }
    return res.status(204).send();
  },
  updatePassword: async (req, res, next) => {
    const body = req.body;
    try {
      const data = await findByEmail(req.user.email, res);
      if (!data)
        return res.status(404).json({
          message: 'Not Found',
        });
      if (!data.password_created_at || (!!data.password_created_at && data.validPassword(body.old_password))) {
        const salt = bcryptjs.genSaltSync(10);
        const updateData = {
          salt,
          password: bcryptjs.hashSync(body.password, salt),
        };
        if (!data.password_created_at) {
          updateData.password_created_at = dayjs().format('YYYY-MM-DD HH:mm:ss');
        }
        await updateUser(data.id, updateData, res);
        return res.status(204).send();
      }
      return res.status(401).json({
        message: 'Unauthorized',
      });
    } catch (e) {
      e.message = 'Error: ' + e;
      next(e);
    }
  },
  logout: async (req, res, next) => {
    try {
      await db.sequelize.transaction((t) => {
        return User.update(
          {
            refresh_token: null,
            refresh_token_expire_at: null,
          },
          {
            where: {
              id: req.user.id,
            },
          },
          {
            transaction: t,
          }
        );
      });
    } catch (e) {
      e.message = 'Error: ' + e;
      next(e);
    }
    return res.status(204).send();
  },
};
