const _ = require('lodash');

module.exports = (req, res, next) => {
  const data = req.body;
  if (!_.isEmpty(data)) {
    next();
  } else {
    return res.status(400).json({
      message: 'Bad request.',
    });
  }
};
