// work on both async and sync function
module.exports = (func) => {
  return (req, res, next) => {
    try {
      const maybePromise = func(req, res, next);
      if (maybePromise && typeof maybePromise.catch === 'function') {
        maybePromise.catch(next);
      }
    } catch (e) {
      next(e);
    }
  };
};
