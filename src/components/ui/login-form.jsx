import { useState, useRef } from "react";
import { Mail, Lock, Eye, EyeOff } from "lucide-react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { useAuthStore } from "../../store/useAuthStore";

export default function LoginForm({ 
  email, 
  setEmail, 
  password, 
  setPassword, 
  handleSubmit, 
  isLoading, 
  isLogin, 
  setIsLogin,
  isLocked
}) {
    const [showPassword, setShowPassword] = useState(false);
    
    // 3D Perspective Tilt Logic
    const x = useMotionValue(0);
    const y = useMotionValue(0);

    const mouseXSpring = useSpring(x);
    const mouseYSpring = useSpring(y);

    const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ["10deg", "-10deg"]);
    const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ["-10deg", "10deg"]);

    const handleMouseMove = (e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const width = rect.width;
        const height = rect.height;
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        const xPct = mouseX / width - 0.5;
        const yPct = mouseY / height - 0.5;

        x.set(xPct);
        y.set(yPct);
    };

    const handleMouseLeave = () => {
        x.set(0);
        y.set(0);
    };

    return (
        <div style={{ 
            display: 'flex', 
            flexDirection: 'row',
            minHeight: '100vh', 
            width: '100%', 
            backgroundColor: '#0b0b1a', 
            fontFamily: 'Inter, sans-serif',
            perspective: '1000px',
            overflowX: 'hidden'
        }}>
            {/* Left Side: Hero Image */}
            <motion.div 
                initial={{ x: -100, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                style={{ 
                    display: 'none',
                    width: '60%', 
                    position: 'relative',
                    flexDirection: 'column'
                }}
                className="md:flex"
            >
                <img 
                    style={{ position: 'absolute', inset: 0, height: '100%', width: '100%', objectFit: 'cover' }}
                    src="login-hero.png" 
                    alt="Financial background" 
                />
                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to right, transparent, #0b0b1a)' }}></div>
            </motion.div>
        
            {/* Right Side: Authentication Form */}
            <div 
                onMouseMove={handleMouseMove}
                onMouseLeave={handleMouseLeave}
                style={{ 
                    flex: 1, 
                    display: 'flex', 
                    flexDirection: 'column', 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    padding: 'clamp(20px, 5vw, 40px)',
                    backgroundColor: '#0b0b1a',
                    zIndex: 10,
                    width: '100%'
                }}
            >
                <motion.div 
                    style={{ 
                        width: '100%', 
                        maxWidth: '400px',
                        rotateX,
                        rotateY,
                        transformStyle: "preserve-3d"
                    }}
                    initial={{ scale: 0.95, opacity: 0, rotateX: 10 }}
                    animate={{ scale: 1, opacity: 1, rotateX: 0 }}
                    transition={{ 
                        duration: 0.6, 
                        ease: "easeOut"
                    }}
                >
                    <div style={{ textAlign: 'center', marginBottom: '32px', transform: "translateZ(30px)" }}>
                        <h2 style={{ fontSize: 'clamp(28px, 6vw, 36px)', color: 'white', fontWeight: 'bold', letterSpacing: '-0.025em', marginBottom: '8px' }}>
                            {isLogin ? "Sign in" : "Create Account"}
                        </h2>
                        <p style={{ fontSize: '14px', color: '#94a3b8', fontWeight: '500' }}>
                            {isLogin ? "Welcome back! Please sign in to continue" : "Start your financial journey with FinTrack"}
                        </p>
                    </div>
        
                    {/* Social Auth */}
                    <motion.button 
                        whileHover={{ scale: 1.02, translateZ: "20px" }}
                        whileTap={{ scale: 0.98 }}
                        type="button" 
                        onClick={() => useAuthStore.getState().loginWithGoogle()}
                        style={{
                            width: '100%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '12px',
                            height: '48px',
                            borderRadius: '9999px',
                            backgroundColor: 'rgba(255,255,255,0.05)',
                            border: '1px solid rgba(255,255,255,0.1)',
                            color: 'white',
                            fontSize: '14px',
                            fontWeight: '600',
                            cursor: 'pointer',
                            marginBottom: '24px',
                            transform: "translateZ(30px)"
                        }}
                    >
                        <img 
                            src="google-logo.svg" 
                            alt="Google" 
                            style={{ width: '20px', height: '20px' }}
                        />
                        {isLogin ? "Sign in with Google" : "Sign up with Google"}
                    </motion.button>
        
                    {/* Divider */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px', transform: "translateZ(10px)" }}>
                        <div style={{ height: '1px', flex: 1, backgroundColor: 'rgba(255,255,255,0.1)' }}></div>
                        <span style={{ fontSize: '10px', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '0.1em', color: '#64748b' }}>or with email</span>
                        <div style={{ height: '1px', flex: 1, backgroundColor: 'rgba(255,255,255,0.1)' }}></div>
                    </div>
        
                    {/* Form Fields */}
                    <form style={{ display: 'flex', flexDirection: 'column', gap: '16px', transform: "translateZ(40px)" }} onSubmit={handleSubmit}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            <div style={{ position: 'relative' }}>
                                <Mail size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
                                <input 
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="Email address"
                                    style={{
                                        width: '100%',
                                        height: '48px',
                                        backgroundColor: 'rgba(255,255,255,0.05)',
                                        border: '1px solid rgba(255,255,255,0.1)',
                                        borderRadius: '9999px',
                                        paddingLeft: '48px',
                                        paddingRight: '24px',
                                        fontSize: '14px',
                                        color: 'white',
                                        outline: 'none'
                                    }}
                                    required
                                />
                            </div>
                            <div style={{ position: 'relative' }}>
                                <Lock size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
                                <input 
                                    type={showPassword ? "text" : "password"}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="Password"
                                    style={{
                                        width: '100%',
                                        height: '48px',
                                        backgroundColor: 'rgba(255,255,255,0.05)',
                                        border: '1px solid rgba(255,255,255,0.1)',
                                        borderRadius: '9999px',
                                        paddingLeft: '48px',
                                        paddingRight: '48px',
                                        fontSize: '14px',
                                        color: 'white',
                                        outline: 'none'
                                    }}
                                    required
                                />
                                <button 
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    style={{ position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#64748b', cursor: 'pointer' }}
                                >
                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                        </div>
        
                        {isLogin && (
                            <div style={{ display: 'flex', justifyContent: 'flex-end', paddingRight: '8px' }}>
                                <button type="button" style={{ background: 'none', border: 'none', fontSize: '12px', fontWeight: 'bold', color: '#818cf8', cursor: 'pointer' }}>
                                    Forgot password?
                                </button>
                            </div>
                        )}
        
                        <motion.button 
                            whileHover={{ scale: 1.02, translateZ: "30px", boxShadow: '0 15px 30px -5px rgba(79, 70, 229, 0.4)' }}
                            whileTap={{ scale: 0.98 }}
                            type="submit" 
                            disabled={isLoading || isLocked}
                            style={{
                                width: '100%',
                                height: '48px',
                                backgroundColor: '#4f46e5',
                                borderRadius: '9999px',
                                color: 'white',
                                fontSize: '14px',
                                fontWeight: '900',
                                cursor: 'pointer',
                                border: 'none',
                                marginTop: '8px',
                                boxShadow: '0 10px 15px -3px rgba(79, 70, 229, 0.3)',
                                transition: 'background-color 0.2s'
                            }}
                        >
                            {isLoading ? "..." : (isLogin ? "Sign in" : "Get Started")}
                        </motion.button>
                    </form>
        
                    {/* Switch Mode */}
                    <div style={{ textAlign: 'center', marginTop: '24px', transform: "translateZ(20px)" }}>
                        <p style={{ fontSize: '14px', color: '#64748b', fontWeight: '500' }}>
                            {isLogin ? "Don't have an account?" : "Already have an account?"}
                            <button 
                                type="button"
                                onClick={() => setIsLogin(!isLogin)}
                                style={{ background: 'none', border: 'none', marginLeft: '8px', color: '#818cf8', fontWeight: 'bold', cursor: 'pointer' }}
                            >
                                {isLogin ? "Sign up" : "Sign in"}
                            </button>
                        </p>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
