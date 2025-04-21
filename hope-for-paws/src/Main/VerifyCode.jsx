import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AUTH_BASE_URL } from '../config';

const VerifyCode = () => {
    const [email, setEmail] = useState('');
    const [code, setCode] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [message, setMessage] = useState('');
    const navigate = useNavigate();

    const handleSubmit = async (event) => {
        event.preventDefault();
        setMessage('');

        try {
            const response = await fetch(`${AUTH_BASE_URL}/verify-code`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, code, newPassword }),
            });

            const data = await response.json();

            if (response.ok) {
                setMessage('Password reset successfully. Redirecting to login...');
                setTimeout(() => navigate('/signin'), 3000);
            } else {
                setMessage(data.error || 'Failed to reset password.');
            }
        } catch (error) {
            setMessage('An error occurred while resetting your password.');
        }
    };

    return (
        <div className="flex min-h-full items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
            <div className="bg-white rounded-lg p-8 shadow max-w-md w-full">
                <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-gray-900">Verify Code & Reset Password</h2>
                {message && <p className="text-red-500 text-center">{message}</p>}
                <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                    <div>
                        <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email</label>
                        <input
                            type="email"
                            id="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            className="mt-1 block w-full border border-gray-300 rounded-md p-2"
                            placeholder="you@gmail.com"
                        />
                    </div>
                    <div>
                        <label htmlFor="code" className="block text-sm font-medium text-gray-700">Verification Code</label>
                        <input
                            type="text"
                            id="code"
                            value={code}
                            onChange={(e) => setCode(e.target.value)}
                            required
                            className="mt-1 block w-full border border-gray-300 rounded-md p-2"
                            placeholder="Enter code from email"
                        />
                    </div>
                    <div>
                        <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700">New Password</label>
                        <input
                            type="password"
                            id="newPassword"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            required
                            className="mt-1 block w-full border border-gray-300 rounded-md p-2"
                            placeholder="Enter new password"
                        />
                    </div>
                    <div>
                        <button type="submit" className="w-full bg-[#6b493d] text-white py-2 rounded-md">
                            Reset Password
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default VerifyCode;
