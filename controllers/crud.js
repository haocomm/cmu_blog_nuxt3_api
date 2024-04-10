const db = require("../models");
const fs = require("fs");
const { Validator } = require("node-input-validator");
const Op = db.Sequelize.Op;
const Crud = db.Crud;

const findByPK = async (id, res, include = []) => {
  const data = await Crud.findByPk(id, { include });
  if (data) {
    return data;
  }
  return res.status(404).json({
    message: "Not Found",
  });
};

module.exports = {
  inputValidate: async (req, res, next) => {
    const v = new Validator(req.body, Crud.inputSchema);
    const matched = await v.check();
    if (matched) {
      next();
    } else {
      return res.status(400).json({
        message: "Bad request." + v.errors,
      });
    }
  },
  index: async (req, res, next) => {
    const { page, size, q } = req.query;

    let where = {};

    if (q) {
      where = {
        name: {
          [Op.like]: `%${q}%`,
        },
      };
    }
    try {
      // if (Number.parseInt(size) === -1) {
      //   const lists = await Crud.findAll({ where });
      //   return res.json(lists);
      // }
      const { limit, offset } = db.getPagination(
        page,
        Number.parseInt(size) === -1 ? 10000 : size
      );
      const lists = await Crud.findAndCountAll({
        where,
        limit,
        offset,
      });
      return res.json(db.getPagingData(lists, page, limit));
    } catch (e) {
      e.message = "Cannot get data from database.";
      next(e);
    }
  },
  store: async (req, res, next) => {
    const data = req.body;
    try {
      const newData = await db.sequelize.transaction((t) => {
        return Crud.create(data, {
          transaction: t,
        });
      });
      return res.status(201).json(newData);
    } catch (e) {
      e.message = "Cannot store data from database.";
      next(e);
    }
  },
  show: async (req, res, next) => {
    const id = req.params.id;
    try {
      const data = await findByPK(id, res);
      return res.json(data);
    } catch (e) {
      e.message = "Cannot get data from database.";
      next(e);
    }
  },
  update: async (req, res, next) => {
    const id = req.params.id;
    const data = req.body;
    const oldData = await findByPK(id, res);
    try {
      await db.sequelize.transaction(async (t) => {
        return Crud.update(
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
      e.message = "Cannot update data from database.";
      next(e);
    }
  },
  destroy: async (req, res, next) => {
    const id = req.params.id;
    const oldData = await findByPK(id, res);
    try {
      await oldData.destroy();
      return res.status(204).send();
    } catch (e) {
      e.message = "Cannot remove data from database.";
      next(e);
    }
  },
};
