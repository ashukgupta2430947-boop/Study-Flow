export const validateEmail = (email) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(String(email).toLowerCase());
};

export const validatePassword = (password) => {
    return password.length >= 6; // Password must be at least 6 characters long
};

export const validateLoginForm = (email, password) => {
    const errors = {};
    if (!validateEmail(email)) {
        errors.email = 'Invalid email address';
    }
    if (!validatePassword(password)) {
        errors.password = 'Password must be at least 6 characters long';
    }
    return errors;
};