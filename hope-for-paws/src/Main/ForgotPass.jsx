import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AUTH_BASE_URL } from '../config';
const ForgotPassword = () => {
    const [email, setEmail] = useState('');
    const [message, setMessage] = useState('');
    const navigate = useNavigate();

    const handleSubmit = async (event) => {
        event.preventDefault();
        setMessage(''); // Reset message

        if (!email.endsWith('@gmail.com')) {
            setMessage('Please use a valid Gmail address.');
            return;
        }

        try {
            const response = await fetch(`${AUTH_BASE_URL}/forgot-password`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email }),
            });

            const data = await response.json();

            if (response.ok) {
                setMessage('Verification code sent! Check your email.');
                navigate('/verify-code'); // Redirect to verification page
            } else {
                setMessage(data.error || 'Failed to send verification code.');
            }
        } catch (error) {
            setMessage('An error occurred while sending the verification code.');
        }
    };

    return (
        <div className="flex min-h-full items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
            <div className="bg-white rounded-lg p-8 shadow max-w-md w-full">
                <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-gray-900">Forgot Password</h2>
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
                        <button type="submit" className="w-full bg-[#6b493d] text-white py-2 rounded-md">
                            Send Verification Code
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ForgotPassword;