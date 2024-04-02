module.exports = (req, res, next) => {
  if (req.params.key) {
    next();
  } else {
    return res.status(400).json({
      message: 'Bad request.',
    });
  }
};
