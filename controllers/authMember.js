const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const bcryptjs = require('bcryptjs');
const dayjs = require('dayjs');
const axios = require('axios');
const sharp = require('sharp');
const db = require('../models');
const { MailVerify, MailResetPassword } = require('../config/mailer');

const Op = db.Sequelize.Op;
const Member = db.Member;
const MemberAccessToken = db.MemberAccessToken;

const findByVerifyToken = async (verifyToken, res, include = []) => {
  const where = {
    verify_token: verifyToken,
    verify_at: null,
  };
  const data = await Member.findOne({
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
  const data = await Member.findOne({
    where,
    include,
  });
  return data;
};
const findByEmail = async (email, res, include = []) => {
  const where = {
    email,
  };
  const data = await Member.findOne({
    where,
    include,
  });
  return data;
};

const createMember = async (data, res) => {
  try {
    return await db.sequelize.transaction((t) => {
      return Member.create(data, {
        transaction: t,
      });
    });
  } catch (e) {
    return res.status(500).json({
      message: 'Cannot store data to database.' + e,
    });
  }
};
const updateMember = async (id, data, res) => {
  try {
    return await db.sequelize.transaction((t) => {
      return Member.update(
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
const newAccessToken = async (memberId, req, res) => {
  try {
    return await db.sequelize.transaction((t) => {
      return MemberAccessToken.create(
        {
          member_id: memberId,
          ip: req.headers['x-forwarded-for'] || req.connection.remoteAddress,
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

const sendMail = async (to, subject, html) => {
  try {
    const mail = await mailer.sendMail({
      from: `${process.env.APP_NAME} <${process.env.APP_EMAIL}>`,
      to,
      subject,
      html,
    });
    console.log(mail.messageId);
  } catch (err) {
    console.log(err);
  }
};

module.exports = {
  signup: async (req, res) => {
    const data = req.body;
    data.password_created_at = dayjs().format('YYYY-MM-DD HH:mm:ss');
    const newData = await createMember(data, res);
    await MailVerify(newData.email, `${newData.firstname} ${newData.lastname}`, newData.verify_token, `${process.env.BASE_URL}/verify-email/`);
    return res.status(201).json(newData);
  },
  resendVerify: async (req, res, next) => {
    const body = req.body;
    try {
      const data = await findByEmail(body.email, res);
      if (!data)
        return res.status(404).json({
          message: 'Not Found',
        });
      await MailVerify(data.email, `${data.firstname} ${data.lastname}`, data.verify_token, `${process.env.BASE_URL}/verify-email/`, true);
      return res.status(204).send();
    } catch (e) {
      e.message = 'Error: ' + e;
      next(e);
    }
  },
  verify: async (req, res, next) => {
    const body = req.body;
    try {
      const data = await findByVerifyToken(body.token, res);
      if (!data)
        return res.status(404).json({
          message: 'Not Found',
        });
      const updateData = {
        verify_at: dayjs().format('YYYY-MM-DD HH:mm:ss'),
      };
      await updateMember(data.id, updateData, res);
      return res.status(204).send();
    } catch (e) {
      e.message = 'Error: ' + e;
      next(e);
    }
  },
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
      await updateMember(data.id, updateData, res);
      await MailResetPassword(data.email, passwordResetToken, `${process.env.BASE_URL}/reset-password/`);
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
      await updateMember(data.id, updateData, res);
      return res.status(204).send();
    } catch (e) {
      e.message = 'Error: ' + e;
      next(e);
    }
  },
  login: async (req, res, next) => {
    if (req.user.verify_at) {
      try {
        if (!req.user.active) {
          return res.status(405).json({
            message: 'Email is inactive',
          });
        }
        const newRefreshToken = crypto.randomBytes(32).toString('hex');
        const updateData = {
          refresh_token: newRefreshToken,
          refresh_token_expire_at: dayjs().add(10, 'hours').format('YYYY-MM-DD HH:mm:ss'),
        };
        await updateMember(req.user.id, updateData, res);

        const accessToken = await newAccessToken(req.user.id, req, res);
        return res.status(200).json({
          access_token: accessToken.access_token,
          refresh_token: newRefreshToken,
        });
      } catch (e) {
        e.message = 'Error: ' + e;
        next(e);
      }
    } else {
      return res.status(403).json({
        message: 'Forbidden, this email has not been verified.',
      });
    }
  },
  oauth: (req, res) => {
    const key = req.params.key;
    const data = new URLSearchParams();
    data.append('response_type', 'code');
    data.append('client_id', process.env[`${key.toUpperCase()}_CLIENT_ID`]);
    data.append('redirect_uri', `${process.env.BASE_URL}/auth?authclient=${key}`);
    data.append('scope', process.env[`${key.toUpperCase()}_SCOPE`]);
    data.append('state', process.env.OAUTH_STATE);
    return res.redirect(`${process.env[`${key.toUpperCase()}_OAUTH_URL`]}?${data.toString()}`);
  },
  callback: async (req, res) => {
    const key = req.params.key;
    const code = req.query.code;
    const state = req.query.state;
    if (code && state) {
      if (state === process.env.OAUTH_STATE) {
        const data = new URLSearchParams();
        data.append('code', code);
        data.append('redirect_uri', `${process.env.BASE_URL}/auth?authclient=${key}`);
        data.append('client_id', process.env[`${key.toUpperCase()}_CLIENT_ID`]);
        data.append('client_secret', process.env[`${key.toUpperCase()}_CLIENT_SECRET`]);
        data.append('grant_type', 'authorization_code');

        try {
          const oauthAccessToken = await axios.post(process.env[`${key.toUpperCase()}_GET_ACCESS_TOKEN_URL`], data, {
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
            },
          });

          const userInfo = await axios.get(process.env[`${key.toUpperCase()}_GET_USER_INFO_URL`], {
            headers: {
              'content-type': 'application/json',
              Authorization: `Bearer ${oauthAccessToken.data.access_token}`,
            },
          });

          const newRefreshToken = crypto.randomBytes(32).toString('hex');
          const updateData = {
            refresh_token: newRefreshToken,
            refresh_token_expire_at: dayjs().add(10, 'hours').format('YYYY-MM-DD HH:mm:ss'),
          };

          let member = await Member.findOne({
            where: {
              email: userInfo.data.email,
            },
          });
          if (!member) {
            const splitName = userInfo.data.name.split(' ');
            const createNewMember = {
              email: userInfo.data.email,
              password: crypto.randomBytes(32).toString('hex'),
              verify_at: dayjs().format('YYYY-MM-DD HH:mm:ss'),
            };
            createNewMember[`${key}_id`] = userInfo.data.id;
            if (key === 'facebook') {
              createNewMember.avatar = userInfo.data.picture.data.url;
            } else if (key === 'google') {
              createNewMember.avatar = userInfo.data.picture;
            }
            member = await createMember(createNewMember, res);
          } else {
            if (!member.verify_at) {
              updateData.verify_at = dayjs().format('YYYY-MM-DD HH:mm:ss');
            }
            if (!member[`${key}_id`]) {
              updateData[`${key}_id`] = userInfo.data.id;
            }
            if (!member.avatar) {
              if (key === 'facebook') {
                updateData.avatar = userInfo.data.picture.data.url;
              } else if (key === 'google') {
                updateData.avatar = userInfo.data.picture;
              }
            }
          }

          await updateMember(member.id, updateData, res);

          const accessToken = await newAccessToken(member.id, req, res);
          return res.status(200).json({
            access_token: accessToken.access_token,
            refresh_token: newRefreshToken,
          });
        } catch (e) {
          return res.status(401).json({
            message: 'Unauthorized' + e,
          });
        }
      }
    }
    return res.status(400).json({
      message: 'Bad request',
    });
  },
  token: async (req, res, next) => {
    const refreshToken = req.body.refresh_token;
    if (refreshToken) {
      try {
        const refresh = await Member.findOne({
          where: {
            refresh_token: refreshToken,
            refresh_token_expire_at: {
              [Op.gte]: dayjs().format('YYYY-MM-DD HH:mm:ss'),
            },
          },
        });
        if (refresh) {
          const accessToken = await newAccessToken(refresh.id, req, res);
          return res.status(200).json({
            access_token: accessToken.access_token,
          });
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
      user: req.user,
    });
  },
  updateProfile: async (req, res, next) => {
    const data = req.body;
    try {
      await updateMember(req.user.id, data, res);
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
        await updateMember(data.id, updateData, res);
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
  updateAvatar: async (req, res, next) => {
    if (req.file) {
      const { filename } = req.file;
      const newFilename = filename.replace(/\.[^/.]+$/, '');
      const newPath = path.join(req.file.destination, `${newFilename}.webp`);
      await sharp(req.file.path).resize(200).webp().toFile(newPath);
      fs.unlinkSync(req.file.path);
      try {
        if (req.user.avatar) {
          const path = `static${req.user.avatar}`;
          if (fs.existsSync(path)) {
            fs.unlink(path, (err) => {
              if (err) {
                console.error(err);
              }
            });
          }
        }
        const updateData = { avatar: newPath.replace('static', '') };
        await updateMember(req.user.id, updateData, res);
        return res.status(204).send();
      } catch (e) {
        if (req.file) {
          if (fs.existsSync(req.file.path)) {
            fs.unlink(req.file.path, (err) => {
              if (err) {
                console.error(err);
              }
            });
          }
          if (fs.existsSync(newPath)) {
            fs.unlink(newPath, (err) => {
              if (err) {
                console.error(err);
              }
            });
          }
        }
        e.message = 'Error: ' + e;
        next(e);
      }
    }
    return res.status(400).json({
      message: 'Bad request',
    });
  },
  logout: async (req, res, next) => {
    try {
      const updateData = {
        refresh_token: null,
        refresh_token_expire_at: null,
      };
      await updateMember(req.user.id, updateData, res);
    } catch (e) {
      e.message = 'Error: ' + e;
      next(e);
    }
    return res.status(204).send();
  },
};
