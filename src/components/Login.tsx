import React, { useState } from 'react';
import { motion } from 'motion/react';
import { ArrowLeft, ShieldCheck, Check } from 'lucide-react';
import { useFirebase } from '../contexts/FirebaseContext';

interface LoginProps {
  onLogin: () => void;
}

export default function Login({ onLogin }: LoginProps) {
  const { login } = useFirebase();
  const [phoneNumber, setPhoneNumber] = useState('');
  const [showOtp, setShowOtp] = useState(false);
  const [loginMethod, setLoginMethod] = useState<'otp' | 'password'>('otp');
  const [password, setPassword] = useState('');
  const [showRecovery, setShowRecovery] = useState(false);
  const [recoveryPhone, setRecoveryPhone] = useState('');
  const [recoveryStep, setRecoveryStep] = useState<'phone' | 'success'>('phone');

  if (showRecovery) {
    return (
      <div className="h-full w-full bg-white px-8 pt-10 pb-10 flex flex-col">
        <div className="flex-1">
          <button onClick={() => { setShowRecovery(false); setRecoveryStep('phone'); }} className="mb-8 p-2 bg-gray-50 rounded-full">
            <ArrowLeft className="w-5 h-5 text-gray-900" />
          </button>
          <div className="mb-10 text-center">
            <div className="w-20 h-20 bg-yellow-50 rounded-[2rem] flex items-center justify-center mx-auto mb-6 shadow-inner">
              <ShieldCheck className="w-10 h-10 text-yellow-500" />
            </div>
            <h2 className="text-3xl font-black text-gray-900 mb-2 italic tracking-tighter">Account Recovery</h2>
            <p className="text-gray-400 font-bold uppercase text-[10px] tracking-widest">Reset your secure access</p>
          </div>

          {recoveryStep === 'phone' ? (
            <div className="space-y-6">
              <div>
                <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mb-2 pl-1">Registered Mobile</label>
                <div className="flex items-center border-b-2 border-gray-100 focus-within:border-yellow-500 transition-colors py-3">
                  <span className="text-gray-900 font-black mr-3 text-lg">+91</span>
                  <input
                    type="tel"
                    placeholder="Enter 10 digit number"
                    className="flex-1 outline-none text-xl font-bold italic tracking-tight"
                    value={recoveryPhone}
                    onChange={(e) => setRecoveryPhone(e.target.value.replace(/\D/g, ''))}
                  />
                </div>
              </div>

              <button
                onClick={() => recoveryPhone.length === 10 && setRecoveryStep('success')}
                disabled={recoveryPhone.length !== 10}
                className={`w-full py-5 rounded-[2rem] font-black uppercase tracking-widest text-[10px] transition-all ${
                  recoveryPhone.length === 10 
                  ? 'bg-yellow-400 text-gray-900 shadow-xl shadow-yellow-100 active:scale-95' 
                  : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                }`}
              >
                Send Reset Link
              </button>
            </div>
          ) : (
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center bg-emerald-50 p-8 rounded-[3rem] border border-emerald-100"
            >
              <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-sm">
                <Check className="w-8 h-8 text-emerald-500" />
              </div>
              <h3 className="text-xl font-black text-emerald-900 mb-1 italic">Link Sent!</h3>
              <p className="text-xs font-bold text-emerald-600/70 mb-8 leading-relaxed uppercase tracking-wider">
                We've sent a secure recovery link to your mobile number +91 {recoveryPhone.slice(-4)}.
              </p>
              <button 
                onClick={() => { setShowRecovery(false); setRecoveryStep('phone'); }}
                className="w-full py-4 bg-emerald-500 text-white rounded-2xl font-black uppercase tracking-widest text-[9px] shadow-lg shadow-emerald-100"
              >
                Back to Login
              </button>
            </motion.div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="h-full w-full bg-white px-8 pt-10 pb-10 flex flex-col">
      <div className="flex-1">
        <div className="flex items-center justify-between mb-8">
          <img src="/src/assets/images/lokal_bharath_logo_1777014931353.png" className="w-20 h-20 object-contain" alt="Logo" />
          <div className="flex gap-1 p-1 bg-gray-100 rounded-xl">
             <button 
              onClick={() => setLoginMethod('otp')}
              className={`px-3 py-1.5 rounded-lg text-[8px] font-black uppercase tracking-widest transition-all ${loginMethod === 'otp' ? 'bg-white text-yellow-600 shadow-sm' : 'text-gray-400'}`}
             >OTP</button>
             <button 
              onClick={() => setLoginMethod('password')}
              className={`px-3 py-1.5 rounded-lg text-[8px] font-black uppercase tracking-widest transition-all ${loginMethod === 'password' ? 'bg-white text-yellow-600 shadow-sm' : 'text-gray-400'}`}
             >Password</button>
          </div>
        </div>
        <h2 className="text-3xl font-black text-gray-900 mb-2 italic tracking-tighter">Welcome!</h2>
        <p className="text-gray-500 mb-10 font-bold uppercase text-[9px] tracking-[0.2em] opacity-60">Sign in to experience the best local services.</p>

        {loginMethod === 'otp' ? (
          !showOtp ? (
            <div className="space-y-6">
              <div>
                <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mb-2 pl-1">Mobile Number</label>
                <div className="flex items-center border-b-2 border-gray-100 focus-within:border-yellow-500 transition-colors py-3">
                  <span className="text-gray-900 font-black mr-3 text-lg">+91</span>
                  <input
                    type="tel"
                    placeholder="Enter 10 digit number"
                    className="flex-1 outline-none text-xl font-bold italic tracking-tight"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, ''))}
                  />
                </div>
              </div>

              <button
                onClick={() => phoneNumber.length === 10 && setShowOtp(true)}
                disabled={phoneNumber.length !== 10}
                className={`w-full py-5 rounded-[2rem] font-black uppercase tracking-widest text-[10px] transition-all ${
                  phoneNumber.length === 10 
                  ? 'bg-yellow-400 text-gray-900 shadow-xl shadow-yellow-100 active:scale-95' 
                  : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                }`}
              >
                Get Secure OTP
              </button>
            </div>
          ) : (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <div>
                <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mb-2 text-center">Verify 4-Digit Secret Code</label>
                <div className="flex gap-4 justify-between mt-4">
                  {[1, 2, 3, 4].map((i) => (
                    <input
                      key={i}
                      type="text"
                      maxLength={1}
                      className="w-14 h-14 bg-gray-50 border-2 border-transparent focus:border-yellow-500 outline-none rounded-2xl text-center text-2xl font-black transition-all shadow-inner"
                    />
                  ))}
                </div>
              </div>

              <button
                onClick={onLogin}
                className="w-full py-5 bg-yellow-400 text-gray-900 rounded-[2rem] font-black uppercase tracking-widest text-[10px] shadow-xl shadow-yellow-100 active:scale-95 transition-all"
              >
                Verify & Login
              </button>
              <p className="text-center text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                Didn't receive? <button className="text-yellow-600 font-black">Resend Now</button>
              </p>
            </motion.div>
          )
        ) : (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
             <div>
                <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mb-2 pl-1">Credentials</label>
                <div className="space-y-4">
                  <div className="flex items-center border-b-2 border-gray-100 focus-within:border-yellow-500 transition-colors py-3">
                    <input
                      type="tel"
                      placeholder="Mobile Number"
                      className="flex-1 outline-none text-lg font-bold italic tracking-tight"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, ''))}
                    />
                  </div>
                  <div className="flex items-center border-b-2 border-gray-100 focus-within:border-yellow-500 transition-colors py-3">
                    <input
                      type="password"
                      placeholder="Enter Password"
                      className="flex-1 outline-none text-lg font-bold italic tracking-tight"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end pr-2">
                <button 
                  onClick={() => setShowRecovery(true)}
                  className="text-[9px] font-black text-rose-500 uppercase tracking-widest hover:text-rose-600 transition-colors"
                >
                  Forgot Password? Recover Now
                </button>
              </div>

              <button
                onClick={() => phoneNumber.length === 10 && password.length > 0 && onLogin()}
                disabled={phoneNumber.length !== 10 || password.length === 0}
                className="w-full py-5 bg-yellow-400 text-gray-900 rounded-[2rem] font-black uppercase tracking-widest text-[10px] shadow-xl shadow-yellow-100 active:scale-95 transition-all disabled:opacity-50"
              >
                Sign In Securely
              </button>
          </motion.div>
        )}

        <div className="mt-10 mb-6 flex items-center gap-4">
          <div className="flex-1 h-px bg-gray-100"></div>
          <span className="text-xs font-bold text-gray-300 uppercase letter-spacing-wide">Or connect with</span>
          <div className="flex-1 h-px bg-gray-100"></div>
        </div>

        <button 
          onClick={async () => {
            await login();
            onLogin();
          }}
          className="w-full py-4 border-2 border-gray-100 rounded-2xl flex items-center justify-center gap-3 font-bold text-gray-700 hover:bg-gray-50 active:scale-95 transition-all"
        >
          <img src="https://www.google.com/favicon.ico" className="w-5 h-5" alt="Google" />
          Continue with Google
        </button>
      </div>

      <p className="text-center text-xs text-gray-400">
        By continuing, you agree to our <span className="underline">Terms</span> & <span className="underline">Privacy Policy</span>
      </p>
    </div>
  );
}
