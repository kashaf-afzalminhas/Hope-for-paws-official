const preventSellerAccess = (req, res, next) => {
  if (req.user && (req.user.role === 'seller' || req.user.isSeller)) {
    return res.status(403).json({ message: 'Forbidden: Sellers are not permitted to access buyer marketplace features' });
  }
  next();
};

module.exports = { preventSellerAccess };
