class AuthService {
    constructor(userModel) {
        this.userModel = userModel;
    }

    async validateCredentials(email, password) {
        const user = await this.userModel.findOne({ email });
        if (!user) {
            throw new Error('User not found');
        }
        const isValidPassword = await user.comparePassword(password);
        if (!isValidPassword) {
            throw new Error('Invalid password');
        }
        return user;
    }

    generateToken(user) {
        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
        return token;
    }

    async login(email, password) {
        const user = await this.validateCredentials(email, password);
        const token = this.generateToken(user);
        return { user, token };
    }
}

export default AuthService;