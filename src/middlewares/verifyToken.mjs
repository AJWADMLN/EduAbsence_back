import jwt from "jsonwebtoken";

export default function verifyToken(req, res, next) {
  const token = req.headers.authorization?.split(" ")[1]; // token kayji mn header Authorization

  if (!token) {
    return res.status(401).json({ message: "No token provided" });
  }

  try {
    const decoded = jwt.verify(token, "secret"); // secret khasso ykon f .env
    req.user = decoded; // decoded kayb9a fih {id, role}
    next();
  } catch (error) {
    return res.status(403).json({ message: "Invalid token" });
  }
}
