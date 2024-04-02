module.exports = (req, res, next) => {
  return req.file ? next() : res.status(400).json({
    message: 'Bad request.',
  });
};
