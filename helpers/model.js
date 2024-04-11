module.exports = {
  findByPk: async (model, id, res, include = [], attributes = null) => {
    let options = { include }
    if (attributes) {
      options = {
        ...options,
        attributes
      }
    }
    const data = await model.findByPk(id, options)
    if (data) {
      return data
    }
    res.status(404).json({
      message: 'Not Found'
    })
  },
  findBySlug: async (model, slug, res, include = [], moreWhere = {}) => {
    const where = {
      slug,
      ...moreWhere
    }
    const data = await model.findOne({
      where,
      include
    })
    if (data) {
      return data
    }
    res.status(404).json({
      message: 'Not Found'
    })
  },
  findByUsername: async (model, username, res, include = [], moreWhere = {}) => {
    const where = {
      username,
      ...moreWhere
    }
    const data = await model.findOne({
      where,
      include
    })
    if (data) {
      return data
    }
    res.status(404).json({
      message: 'Not Found'
    })
  }
}
