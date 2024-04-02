const bcryptjs = require('bcryptjs');
const db = require('../models');
const Member = db.Member;
const MemberAccessToken = db.MemberAccessToken;
const Op = db.Sequelize.Op;

const findByPK = async (id, res, include = []) => {
  const data = await Member.findByPk(id, { include });
  if (data) {
    return data;
  }
  return res.status(404).json({
    message: 'Not Found',
  });
};
const findByEmail = async (email, res, include = []) => {
  const where = {
    email,
  };
  const data = await Member.findOne({
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

      let andWhere = [];
      if (q) {
        andWhere = [
          ...andWhere,
          {
            [Op.or]: [{ email: { [Op.like]: `%${q}%` } }, { firstname: { [Op.like]: `%${q}%` } }, { lastname: { [Op.like]: `%${q}%` } }],
          },
        ];
      }

      const where = {
        [Op.and]: andWhere,
      };

      const { limit, offset } = db.getPagination(page, size);
      try {
        const lists = await Member.findAndCountAll({
          distinct: true,
          include: [
            {
              model: MemberAccessToken,
              limit: 1,
              order: [['createdAt', 'desc']],
              attributes: ['ip', 'createdAt'],
            },
          ],
          where,
          limit,
          offset,
        });
        return res.json(db.getPagingData(lists, page, limit));
      } catch (e) {
        e.message = 'Cannot get data from database. Error: ' + e;
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
      try {
        const newData = await db.sequelize.transaction((t) => {
          return Member.create(data, {
            transaction: t,
          });
        });
        return res.status(201).json(newData);
      } catch (e) {
        e.message = 'Cannot get data from database. Error: ' + e;
        next(e);
      }
    }
    return res.status(403).json({
      message: 'Forbidden.',
    });
  },
  show: async (req, res, next) => {
    if (['admin'].includes(req.user.role)) {
      const id = req.params.id;
      try {
        const data = await findByPK(id, res);
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
    const data = req.body;
    try {
      const result = await findByEmail(data.email, res);
      return res.json({ email: !!result });
    } catch (e) {
      e.message = 'Cannot get data from database. Error: ' + e;
      next(e);
    }
  },
  update: async (req, res, next) => {
    if (['admin'].includes(req.user.role)) {
      const id = req.params.id;
      const data = req.body;
      if (data.password) {
        const salt = bcryptjs.genSaltSync(10);
        data.salt = salt;
        data.password = bcryptjs.hashSync(data.password, salt);
      }
      try {
        await db.sequelize.transaction((t) => {
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
  destroy: async (req, res, next) => {
    if (['admin'].includes(req.user.role)) {
      const id = req.params.id;
      try {
        await Member.destroy({
          where: {
            id,
          },
        });
        return res.status(204).send();
      } catch (e) {
        e.message = 'Cannot get data from database. Error: ' + e;
        next(e);
      }
    }
    return res.status(403).json({
      message: 'Forbidden.',
    });
  },
};
