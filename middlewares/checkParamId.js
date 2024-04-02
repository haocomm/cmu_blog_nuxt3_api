module.exports = (req, res, next) => {
  if (req.params.id) {
    next();
  } else {
    return res.status(400).json({
      message: 'Bad request.',
    });
  }
};
