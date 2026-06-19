module.exports = {
    authenticate: (req, res, next) => {
        const token = req.headers['authorization'];
        if (!token) {
            return res.status(401).json({ message: 'No token provided' });
        }

        // Verify token logic here (e.g., using JWT)
        // If valid, attach user info to request object
        // req.user = decoded; // assuming decoded contains user info

        next();
    },

    authorize: (roles = []) => {
        // roles param can be a single role string (e.g. Role.User) or an array of roles
        if (typeof roles === 'string') {
            roles = [roles];
        }

        return (req, res, next) => {
            if (!req.user || (roles.length && !roles.includes(req.user.role))) {
                return res.status(403).json({ message: 'Forbidden' });
            }
            next();
        };
    }
};