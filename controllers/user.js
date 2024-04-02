const bcryptjs = require('bcryptjs');
const db = require('../models');
const User = db.User;
const AccessToken = db.AccessToken;
const Op = db.Sequelize.Op;

const findByEmail = async (email, res, include = []) => {
  const where = {
    email,
  };
  const data = await User.findOne({
    where,
    include,
  });
  if (data) {
    return data;
  }
  return res.status(404).json({
    message: 'Not Found',
  });
};

module.exports = {
  index: async (req, res, next) => {
    if (['admin'].includes(req.user.role)) {
      const { page, size, q } = req.query;

      const where = q ? { [Op.or]: [
        { email: { [Op.like]: `%${q}%` } },
        { firstname: { [Op.like]: `%${q}%` } },
        { lastname: { [Op.like]: `%${q}%` } },
        { role: { [Op.like]: `%${q}%` } }
      ] } : null;

      const { limit, offset } = db.getPagination(page, size);
      try {
        const lists = await User.findAndCountAll({
          include: [
            {
              model: AccessToken,
              limit: 1,
              order: [['createdAt', 'desc']],
              attributes: ['ip', 'createdAt'],
            },
          ],
          where,
          limit,
          offset,
          attributes: ['id', 'firstname', 'lastname', 'email', 'role'],
        });
        return res.json(db.getPagingData(lists, page, limit));
      } catch (e) {
        e.message = 'Error: ' + e;
        next(e);
      }
    }
    return res.status(403).json({
      message: 'Forbidden.',
    });
  },
  store: async (req, res, next) => {
    if (['admin'].includes(req.user.role)) {
      const data = req.body;
      if (data) {
        try {
          const newData = await db.sequelize.transaction((t) => {
            return User.create(data, {
              transaction: t,
            });
          });
          return res.status(201).json(newData);
        } catch (e) {
          e.message = 'Error: ' + e;
          next(e);
        }
      }
      return res.status(400).json({
        message: 'Bad request.',
      });
    }
    return res.status(403).json({
      message: 'Forbidden.',
    });
  },
  show: async (req, res, next) => {
    if (['admin'].includes(req.user.role)) {
      const email = req.params.email;
      try {
        const data = await findByEmail(email, res);
        return res.json(data);
      } catch (e) {
        e.message = 'Cannot get data from database. Error: ' + e;
        next(e);
      }
    }
    return res.status(403).json({
      message: 'Forbidden.',
    });
  },
  check: async (req, res, next) => {
    const data = req.body
    try {
      const result = await findByEmail(data.email, res)
      return res.json({ email: !!result })
    } catch (e) {
      e.message = 'Cannot get data from database. Error: ' + e
      next(e)
    }
  },
  update: async (req, res, next) => {
    if (['admin'].includes(req.user.role)) {
      const id = req.params.id;
      const data = req.body;
      try {
        if (data.password) {
          const salt = bcryptjs.genSaltSync(10);
          data.salt = salt;
          data.password = bcryptjs.hashSync(data.password, salt);
        }
        await db.sequelize.transaction((t) => {
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
        return res.json(data);
      } catch (e) {
        e.message = 'Error: ' + e;
        next(e);
      }
    }
    return res.status(403).json({
      message: 'Forbidden.',
    });
  },
  destroy: async (req, res, next) => {
    if (['admin'].includes(req.user.role)) {
      const id = req.params.id;
      try {
        await User.destroy({
          where: {
            id,
          },
        });
        return res.status(204).send();
      } catch (e) {
        e.message = 'Error: ' + e;
        next(e);
      }
    }
    return res.status(403).json({
      message: 'Forbidden.',
    });
  },
};
