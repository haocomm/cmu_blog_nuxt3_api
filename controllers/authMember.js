const crypto = require("crypto");
const fs = require("fs");
const path = require("path");
const bcryptjs = require("bcryptjs");
const dayjs = require("dayjs");
const axios = require("axios");
const sharp = require("sharp");
const db = require("../models");
const { MailVerify, MailResetPassword } = require("../config/mailer");

const Op = db.Sequelize.Op;
const Member = db.Member;
const AuthClient = db.AuthClient;
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
const findByResetPasswordToken = async (
  passwordResetToken,
  res,
  include = []
) => {
  const where = {
    password_reset_token: passwordResetToken,
    password_reset_expire_at: {
      [Op.gte]: dayjs().format("YYYY-MM-DD HH:mm:ss"),
    },
  };
  const data = await Member.findOne({
    where,
    include,
  });
  return data;
};
const findByEmail = async (email, res, include = []) => {
  const data = await Member.findOne({
    where: {
      email,
    },
    include,
  });
  return data;
};
const findByAuthClient = async (memberId, authClient) => {
  const data = await AuthClient.findOne({
    where: {
      member_id: memberId,
      auth_client: authClient,
    },
  });
  return data;
};

const createMember = async (data, next, include = []) => {
  try {
    return await db.sequelize.transaction((t) => {
      return Member.create(data, {
        include,
        transaction: t,
      });
    });
  } catch (e) {
    e.message = "Error: " + e;
    next(e);
  }
};
const createAuthClient = async (data, next) => {
  try {
    return await db.sequelize.transaction((t) => {
      return AuthClient.create(data, {
        transaction: t,
      });
    });
  } catch (e) {
    e.message = "Error: " + e;
    next(e);
  }
};
const updateMember = async (id, data, next) => {
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
    e.message = "Error: " + e;
    next(e);
  }
};
const newAccessToken = async (memberId, req, next) => {
  try {
    return await db.sequelize.transaction((t) => {
      return MemberAccessToken.create(
        {
          member_id: memberId,
          ip: req.headers["x-forwarded-for"] || req.connection.remoteAddress,
        },
        {
          transaction: t,
        }
      );
    });
  } catch (e) {
    e.message = "Error: " + e;
    next(e);
  }
};

module.exports = {
  signup: async (req, res, next) => {
    const data = req.body;
    data.password_created_at = dayjs().format("YYYY-MM-DD HH:mm:ss");
    const newData = await createMember(data, next);
    await MailVerify(
      newData.email,
      `${newData.firstname} ${newData.lastname}`,
      newData.verify_token,
      `${process.env.BASE_URL}/verify-email/`
    );
    return res.status(201).json(newData);
  },
  resendVerify: async (req, res, next) => {
    const body = req.body;
    try {
      const data = await findByEmail(body.email, res);
      if (!data)
        return res.status(404).json({
          message: "Not Found",
        });
      await MailVerify(
        data.email,
        `${data.firstname} ${data.lastname}`,
        data.verify_token,
        `${process.env.BASE_URL}/verify-email/`,
        true
      );
      return res.status(204).send();
    } catch (e) {
      e.message = "Error: " + e;
      next(e);
    }
  },
  verify: async (req, res, next) => {
    const body = req.body;
    try {
      const data = await findByVerifyToken(body.token, res);
      if (!data)
        return res.status(404).json({
          message: "Not Found",
        });
      const updateData = {
        verify_at: dayjs().format("YYYY-MM-DD HH:mm:ss"),
      };
      await updateMember(data.id, updateData, next);
      return res.status(204).send();
    } catch (e) {
      e.message = "Error: " + e;
      next(e);
    }
  },
  forgotPassword: async (req, res, next) => {
    const body = req.body;
    try {
      const data = await findByEmail(body.email, res);
      if (!data)
        return res.status(404).json({
          message: "Not Found",
        });
      const passwordResetToken = crypto.randomBytes(16).toString("hex");
      const updateData = {
        password_reset_token: passwordResetToken,
        password_reset_expire_at: dayjs()
          .add(15, "minutes")
          .format("YYYY-MM-DD HH:mm:ss"),
      };
      await updateMember(data.id, updateData, next);
      await MailResetPassword(
        data.email,
        passwordResetToken,
        `${process.env.BASE_URL}/reset-password/`
      );
      return res.status(204).send();
    } catch (e) {
      e.message = "Error: " + e;
      next(e);
    }
  },
  checkPasswordToken: async (req, res, next) => {
    const body = req.body;
    try {
      const data = await findByResetPasswordToken(body.token, res);
      if (!data)
        return res.status(404).json({
          message: "Not Found",
        });
      return res.status(204).send();
    } catch (e) {
      e.message = "Error: " + e;
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
          message: "Not Found",
        });
      const salt = bcryptjs.genSaltSync(10);
      const updateData = {
        salt,
        password: bcryptjs.hashSync(body.password, salt),
        password_reset_expire_at: dayjs().format("YYYY-MM-DD HH:mm:ss"),
      };
      if (!data.password_created_at) {
        updateData.password_created_at = dayjs().format("YYYY-MM-DD HH:mm:ss");
      }
      if (!data.verify_at) {
        updateData.verify_at = dayjs().format("YYYY-MM-DD HH:mm:ss");
      }
      await updateMember(data.id, updateData, next);
      return res.status(204).send();
    } catch (e) {
      e.message = "Error: " + e;
      next(e);
    }
  },
  login: async (req, res, next) => {
    if (req.user.verify_at) {
      try {
        if (!req.user.active) {
          return res.status(405).json({
            message: "Email is inactive",
          });
        }
        const newRefreshToken = crypto.randomBytes(32).toString("hex");
        const updateData = {
          refresh_token: newRefreshToken,
          refresh_token_expire_at: dayjs()
            .add(10, "hours")
            .format("YYYY-MM-DD HH:mm:ss"),
        };
        await updateMember(req.user.id, updateData, next);

        const accessToken = await newAccessToken(req.user.id, req, next);
        return res.status(200).json({
          accessToken: accessToken.access_token,
          refreshToken: newRefreshToken,
        });
      } catch (e) {
        e.message = "Error: " + e;
        next(e);
      }
    } else {
      return res.status(403).json({
        message: "Forbidden, this email has not been verified.",
      });
    }
  },
  oauth: (req, res) => {
    const key = req.params.key;
    const data = new URLSearchParams();
    data.append("response_type", "code");
    data.append("client_id", process.env[`${key.toUpperCase()}_CLIENT_ID`]);
    data.append("redirect_uri", `${process.env.BASE_URL}/auth/`);
    data.append("scope", process.env[`${key.toUpperCase()}_SCOPE`]);
    data.append("state", key);
    return res.redirect(
      `${process.env[`${key.toUpperCase()}_OAUTH_URL`]}?${data.toString()}`
    );
  },
  callback: async (req, res, next) => {
    const key = req.query.state;
    const code = req.query.code;
    if (code && key) {
      const data = new URLSearchParams();
      data.append("code", code);
      data.append("redirect_uri", `${process.env.BASE_URL}/auth/`);
      data.append("client_id", process.env[`${key.toUpperCase()}_CLIENT_ID`]);
      data.append(
        "client_secret",
        process.env[`${key.toUpperCase()}_CLIENT_SECRET`]
      );
      data.append("grant_type", "authorization_code");

      try {
        const oauthAccessToken = await axios.post(
          process.env[`${key.toUpperCase()}_GET_ACCESS_TOKEN_URL`],
          data,
          {
            headers: {
              "Content-Type": "application/x-www-form-urlencoded",
            },
          }
        );

        const userInfo = await axios.get(
          process.env[`${key.toUpperCase()}_GET_USER_INFO_URL`],
          {
            headers: {
              "content-type": "application/json",
              Authorization: `Bearer ${oauthAccessToken.data.access_token}`,
            },
          }
        );

        const newRefreshToken = crypto.randomBytes(32).toString("hex");
        const updateData = {
          refresh_token: newRefreshToken,
          refresh_token_expire_at: dayjs()
            .add(10, "hours")
            .format("YYYY-MM-DD HH:mm:ss"),
        };

        let member = await Member.findOne({
          where: {
            email:
              userInfo.data[process.env[`${key.toUpperCase()}_EMAIL_PROPERTY`]],
          },
        });
        if (!member) {
          const createNewMember = {
            email:
              userInfo.data[process.env[`${key.toUpperCase()}_EMAIL_PROPERTY`]],
            password: crypto.randomBytes(32).toString("hex"),
            verify_at: dayjs().format("YYYY-MM-DD HH:mm:ss"),
            AuthClients: [
              {
                auth_client: key,
                auth_key:
                  userInfo.data[
                    process.env[`${key.toUpperCase()}_AUTH_ID_PROPERTY`]
                  ],
              },
            ],
          };

          if (key === "facebook") {
            createNewMember.avatar = userInfo.data.picture.data.url;
          } else if (key === "google") {
            createNewMember.avatar = userInfo.data.picture;
          }
          member = await createMember(createNewMember, next, [AuthClient]);
        } else {
          const findAuthClient = await findByAuthClient(member.id, key);
          if (!findAuthClient) {
            await createAuthClient({
              member_id: member.id,
              auth_client: key,
              auth_key:
                userInfo.data[
                  process.env[`${key.toUpperCase()}_AUTH_ID_PROPERTY`]
                ],
            });
          }
          if (!member.verify_at) {
            updateData.verify_at = dayjs().format("YYYY-MM-DD HH:mm:ss");
          }
          if (!member[`${key}_id`]) {
            updateData[`${key}_id`] =
              userInfo.data[
                process.env[`${key.toUpperCase()}_AUTH_ID_PROPERTY`]
              ];
          }
          if (!member.avatar) {
            if (key === "facebook") {
              updateData.avatar = userInfo.data.picture.data.url;
            } else if (key === "google") {
              updateData.avatar = userInfo.data.picture;
            }
          }
        }

        await updateMember(member.id, updateData, next);

        const accessToken = await newAccessToken(member.id, req, next);
        return res.status(200).json({
          accessToken: accessToken.access_token,
          refreshToken: newRefreshToken,
        });
      } catch (e) {
        return res.status(401).json({
          message: "Unauthorized" + e,
        });
      }
    }
    return res.status(400).json({
      message: "Bad request",
    });
  },
  token: async (req, res, next) => {
    const refreshToken = req.body.refreshToken;
    if (refreshToken) {
      try {
        const refresh = await Member.findOne({
          where: {
            refresh_token: refreshToken,
            refresh_token_expire_at: {
              [Op.gte]: dayjs().format("YYYY-MM-DD HH:mm:ss"),
            },
          },
        });
        if (refresh) {
          const accessToken = await newAccessToken(refresh.id, req, next);
          return res.status(200).json({
            accessToken: accessToken.access_token,
          });
        }
      } catch (e) {
        return res.status(401).json({
          message: "Unauthorized" + e,
        });
      }
    }
    return res.status(400).json({
      message: "Bad request",
    });
  },
  me: (req, res) => {
    return res.status(200).json(req.user);
  },
  updateProfile: async (req, res, next) => {
    const data = req.body;
    try {
      await updateMember(req.user.id, data, next);
    } catch (e) {
      e.message = "Error: " + e;
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
          message: "Not Found",
        });
      if (
        !data.password_created_at ||
        (!!data.password_created_at && data.validPassword(body.old_password))
      ) {
        const salt = bcryptjs.genSaltSync(10);
        const updateData = {
          salt,
          password: bcryptjs.hashSync(body.password, salt),
        };
        if (!data.password_created_at) {
          updateData.password_created_at = dayjs().format(
            "YYYY-MM-DD HH:mm:ss"
          );
        }
        await updateMember(data.id, updateData, next);
        return res.status(204).send();
      }
      return res.status(401).json({
        message: "Unauthorized",
      });
    } catch (e) {
      e.message = "Error: " + e;
      next(e);
    }
  },
  updateAvatar: async (req, res, next) => {
    if (req.file) {
      const { filename } = req.file;
      const newFilename = filename.replace(/\.[^/.]+$/, "");
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
        const updateData = { avatar: newPath.replace("static", "") };
        await updateMember(req.user.id, updateData, next);
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
        e.message = "Error: " + e;
        next(e);
      }
    }
    return res.status(400).json({
      message: "Bad request",
    });
  },
  logout: async (req, res, next) => {
    try {
      const updateData = {
        refresh_token: null,
        refresh_token_expire_at: null,
      };
      await updateMember(req.user.id, updateData, next);
    } catch (e) {
      e.message = "Error: " + e;
      next(e);
    }
    return res.status(204).send();
  },
};
