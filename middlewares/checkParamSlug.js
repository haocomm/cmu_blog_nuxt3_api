module.exports = (req, res, next) => {
  if (req.params.slug) {
    next();
  } else {
    return res.status(400).json({
      message: 'Bad request.',
    });
  }
};
