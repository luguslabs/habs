exports.get404 = (req, res, next) => {
    const error = {
      errors: [
        {
          status: '404',
          title: 'Not found',
          detail: 'Requested resource was not found.'
        }
      ]
    };
    res.status(404).json(error);
};