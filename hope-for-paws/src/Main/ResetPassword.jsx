import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AUTH_BASE_URL } from '../config';

const validatePassword = (value) => {
    if (!value) return 'Password is required';
    const errors = [];
    if (value.length < 8) errors.push('At least 8 characters');
    if (!/[A-Z]/.test(value)) errors.push('One uppercase letter');
    if (!/[a-z]/.test(value)) errors.push('One lowercase letter');
    if (!/[0-9]/.test(value)) errors.push('One number');
    if (!/[^A-Za-z0-9]/.test(value)) errors.push('One special character');
    return errors.length ? errors.join(', ') : '';
};

const ResetPassword = () => {
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [passwordTouched, setPasswordTouched] = useState(false);
    const [confirmTouched, setConfirmTouched] = useState(false);
    const [message, setMessage] = useState('');
    const navigate = useNavigate();
    const email = localStorage.getItem('resetEmail') || '';
    const code = localStorage.getItem('resetCode') || '';

    const passwordError = validatePassword(newPassword);
    const passwordsMatch = newPassword === confirmPassword;

    const passwordChecks = [
        { label: '8+ characters', valid: newPassword.length >= 8 },
        { label: 'Uppercase', valid: /[A-Z]/.test(newPassword) },
        { label: 'Lowercase', valid: /[a-z]/.test(newPassword) },
        { label: 'Number', valid: /[0-9]/.test(newPassword) },
        { label: 'Special', valid: /[^A-Za-z0-9]/.test(newPassword)},
    ];
    const unmetRequirements = passwordChecks.filter(check => !check.valid);

    const handleSubmit = async (event) => {
        event.preventDefault();
        setMessage('');
        setPasswordTouched(true);
        setConfirmTouched(true);
        if (!newPassword || !confirmPassword) {
            setMessage('Please fill in all fields.');
            return;
        }
        if (passwordError) {
            setMessage('Password does not meet requirements.');
            return;
        }
        if (!passwordsMatch) {
            setMessage('Passwords do not match.');
            return;
        }
        try {
            const response = await fetch(`${AUTH_BASE_URL}/reset-password`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, code, newPassword }),
            });
            const data = await response.json();
            if (response.ok) {
                setMessage('Password reset successfully. Redirecting to login...');
                localStorage.removeItem('resetEmail');
                localStorage.removeItem('resetCode');
                setTimeout(() => navigate('/signin'), 2000);
            } else {
                setMessage(data.error || 'Failed to reset password.');
            }
        } catch {
            setMessage('An error occurred while resetting your password.');
        }
    };

    return (
        <div className="flex min-h-full items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
            <div className="bg-white rounded-lg p-8 shadow max-w-md w-full">
                <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-gray-900">Reset Password</h2>
                {message && <p className="text-red-500 text-center">{message}</p>}
                <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                    <div>
                        <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700">New Password</label>
                        <div className="relative">
                            <input
                                type={showNewPassword ? 'text' : 'password'}
                                id="newPassword"
                                value={newPassword}
                                onChange={e => setNewPassword(e.target.value)}
                                onBlur={() => setPasswordTouched(true)}
                                required
                                className={`mt-1 block w-full border ${passwordTouched && passwordError ? 'border-red-500' : 'border-gray-300'} rounded-md p-2 pr-10`}
                                placeholder="Enter new password"
                            />
                            <button
                                type="button"
                                onClick={() => setShowNewPassword(v => !v)}
                                className="absolute inset-y-0 right-0 pr-3 flex items-center text-[#6b493d] hover:text-[#4E3B31] focus:outline-none"
                            >
                                {showNewPassword ? (
                                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                                    </svg>
                                ) : (
                                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268-2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                    </svg>
                                )}
                            </button>
                        </div>
                        {passwordTouched && passwordError && (
                            <p className="text-xs text-red-600 mt-1">Password must have: {passwordError}</p>
                        )}
                        {newPassword && unmetRequirements.length === 0 && (
                            <div className="mt-2 flex items-center text-green-600 text-xs">
                                <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                                Password meets all requirements
                            </div>
                        )}
                    </div>
                    <div>
                        <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">Confirm Password</label>
                        <div className="relative">
                            <input
                                type={showConfirmPassword ? 'text' : 'password'}
                                id="confirmPassword"
                                value={confirmPassword}
                                onChange={e => setConfirmPassword(e.target.value)}
                                onBlur={() => setConfirmTouched(true)}
                                required
                                className={`mt-1 block w-full border ${confirmTouched && (!passwordsMatch || !confirmPassword) ? 'border-red-500' : 'border-gray-300'} rounded-md p-2 pr-10`}
                                placeholder="Confirm new password"
                            />
                            <button
                                type="button"
                                onClick={() => setShowConfirmPassword(v => !v)}
                                className="absolute inset-y-0 right-0 pr-3 flex items-center text-[#6b493d] hover:text-[#4E3B31] focus:outline-none"
                            >
                                {showConfirmPassword ? (
                                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                                    </svg>
                                ) : (
                                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268-2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                    </svg>
                                )}
                            </button>
                        </div>
                        {confirmTouched && !passwordsMatch && confirmPassword && (
                            <p className="text-xs text-red-600 mt-1">Passwords do not match.</p>
                        )}
                    </div>
                    <div>
                        <button
                            type="submit"
                            className="w-full bg-[#6b493d] text-white py-2 rounded-md"
                            disabled={!!passwordError || !passwordsMatch || !newPassword || !confirmPassword}
                        >
                            Reset Password
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ResetPassword; 