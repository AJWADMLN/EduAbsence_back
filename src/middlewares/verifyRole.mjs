export default function verifyRole(role) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(403).json({ message: "Access denied" });
    }

    const hasRole = Array.isArray(role) ? role.includes(req.user.role) : req.user.role === role;

    if (!hasRole) {
      return res.status(403).json({ message: "Access denied" });
    }
    next();
  };
}
