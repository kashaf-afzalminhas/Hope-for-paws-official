import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AUTH_BASE_URL } from '../config';

const VerifyCode = () => {
    const [code, setCode] = useState('');
    const [message, setMessage] = useState('');
    const [resendMessage, setResendMessage] = useState('');
    const [resending, setResending] = useState(false);
    const navigate = useNavigate();
    const email = localStorage.getItem('resetEmail') || '';

    const handleSubmit = async (event) => {
        event.preventDefault();
        setMessage('');
        if (!code) {
            setMessage('Please enter the verification code.');
            return;
        }
        try {
            const response = await fetch(`${AUTH_BASE_URL}/verify-reset-code`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, code }),
            });
            const data = await response.json();
            if (response.ok) {
                localStorage.setItem('resetCode', code);
                navigate('/reset-password');
            } else {
                setMessage(data.error || 'Failed to verify code.');
            }
        } catch {
            setMessage('An error occurred while verifying the code.');
        }
    };

    const handleResend = async () => {
        setResendMessage('');
        setResending(true);
        try {
            const response = await fetch(`${AUTH_BASE_URL}/resend-reset-code`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email }),
            });
            const data = await response.json();
            if (response.ok) {
                setResendMessage('Verification code resent! Check your email.');
            } else {
                setResendMessage(data.error || 'Failed to resend code.');
            }
        } catch {
            setResendMessage('An error occurred while resending the code.');
        } finally {
            setResending(false);
        }
    };

    return (
        <div className="flex min-h-full items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
            <div className="bg-white rounded-lg p-8 shadow max-w-md w-full">
                <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-gray-900">Verify Code</h2>
                {message && <p className="text-red-500 text-center">{message}</p>}
                {resendMessage && <p className="text-green-600 text-center">{resendMessage}</p>}
                <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
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
                    <div className="flex justify-between items-center">
                        <button type="submit" className="bg-[#6b493d] text-white py-2 px-4 rounded-md">Verify Code</button>
                        <button type="button" onClick={handleResend} disabled={resending} className="text-[#6b493d] underline ml-2 disabled:opacity-50 disabled:cursor-not-allowed">{resending ? 'Sending...' : 'Resend Code'}</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default VerifyCode;
