import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { requestOtpApi, verifyOtpApi } from '../api/auth.api';
import { useAuth } from '../context/AuthContext';

export const LoginScreen: React.FC = () => {
  const { login } = useAuth();

  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);

  const handleSendOtp = async () => {
    if (!phone.trim()) {
      setErrorMessage('Please enter a valid phone number');
      return;
    }

    setLoading(true);
    setErrorMessage(null);
    setInfoMessage(null);

    try {
      const res = await requestOtpApi(phone.trim());
      setIsOtpSent(true);
      setInfoMessage(`Code sent! In development, check your backend server terminal to see the 6-digit OTP code.`);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to send OTP code');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!otp.trim() || otp.trim().length !== 6) {
      setErrorMessage('Please enter the complete 6-digit OTP code');
      return;
    }

    setLoading(true);
    setErrorMessage(null);

    try {
      const res = await verifyOtpApi(phone.trim(), otp.trim());
      // Save session in SecureStore & update AuthContext
      await login(res.token, res.user);
    } catch (err: any) {
      setErrorMessage(err.message || 'Verification failed. Please check the code.');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setIsOtpSent(false);
    setOtp('');
    setErrorMessage(null);
    setInfoMessage(null);
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        {/* Header / Branding */}
        <View style={styles.brandContainer}>
          <View style={styles.logoBadge}>
            <Text style={styles.logoBadgeText}>ML</Text>
          </View>
          <Text style={styles.appTitle}>MiniLedger</Text>
          <Text style={styles.appSubtitle}>Track money lent to friends with zero friction.</Text>
        </View>

        {/* Auth Card */}
        <View style={styles.card}>
          <Text style={styles.stepTitle}>
            {isOtpSent ? 'Verify Phone Number' : 'Sign In with Phone'}
          </Text>
          <Text style={styles.stepDescription}>
            {isOtpSent
              ? `Enter the 6-digit code sent to ${phone}`
              : 'Enter your phone number to receive a one-time verification code.'}
          </Text>

          {/* Feedback Messages */}
          {errorMessage && (
            <View style={styles.errorBanner}>
              <Text style={styles.errorText}>⚠️ {errorMessage}</Text>
            </View>
          )}

          {infoMessage && (
            <View style={styles.infoBanner}>
              <Text style={styles.infoText}>💡 {infoMessage}</Text>
            </View>
          )}

          {/* Phone Input (Step 1) */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Phone Number</Text>
            <TextInput
              style={[styles.input, isOtpSent && styles.inputDisabled]}
              placeholder="+1 555 123 4567"
              placeholderTextColor="#94A3B8"
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
              autoCapitalize="none"
              editable={!isOtpSent && !loading}
            />
          </View>

          {/* OTP Input (Step 2 - Revealed after OTP is sent) */}
          {isOtpSent && (
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>6-Digit Verification Code</Text>
              <TextInput
                style={[styles.input, styles.otpInput]}
                placeholder="123456"
                placeholderTextColor="#94A3B8"
                value={otp}
                onChangeText={setOtp}
                keyboardType="number-pad"
                maxLength={6}
                editable={!loading}
                autoFocus
              />
            </View>
          )}

          {/* Action Buttons */}
          {!isOtpSent ? (
            <TouchableOpacity
              style={[styles.primaryButton, loading && styles.buttonDisabled]}
              onPress={handleSendOtp}
              disabled={loading}
              activeOpacity={0.8}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.primaryButtonText}>Send OTP Code →</Text>
              )}
            </TouchableOpacity>
          ) : (
            <View>
              <TouchableOpacity
                style={[styles.primaryButton, loading && styles.buttonDisabled]}
                onPress={handleVerifyOtp}
                disabled={loading}
                activeOpacity={0.8}
              >
                {loading ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.primaryButtonText}>Verify & Continue →</Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.secondaryButton}
                onPress={handleReset}
                disabled={loading}
                activeOpacity={0.7}
              >
                <Text style={styles.secondaryButtonText}>← Change Phone Number</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Development Tip Box */}
        <View style={styles.tipBox}>
          <Text style={styles.tipTitle}>💡 Developer Take-Home Tip</Text>
          <Text style={styles.tipText}>
            This application uses passwordless phone authentication. Because SMS providers cost money in local development, OTPs are printed directly to the backend terminal server log when requested.
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A', // Slate-900 dark backdrop
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
  },
  brandContainer: {
    alignItems: 'center',
    marginBottom: 28,
  },
  logoBadge: {
    width: 64,
    height: 64,
    borderRadius: 16,
    backgroundColor: '#38BDF8', // Sky-400
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#38BDF8',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 8,
  },
  logoBadgeText: {
    color: '#0F172A',
    fontSize: 26,
    fontWeight: '900',
    letterSpacing: -1,
  },
  appTitle: {
    color: '#F8FAFC',
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  appSubtitle: {
    color: '#94A3B8',
    fontSize: 14,
    marginTop: 6,
    textAlign: 'center',
  },
  card: {
    backgroundColor: '#1E293B', // Slate-800
    borderRadius: 20,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 6,
    borderWidth: 1,
    borderColor: '#334155',
  },
  stepTitle: {
    color: '#F8FAFC',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 6,
  },
  stepDescription: {
    color: '#94A3B8',
    fontSize: 13,
    marginBottom: 18,
    lineHeight: 18,
  },
  errorBanner: {
    backgroundColor: '#451A1A',
    borderColor: '#EF4444',
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
  },
  errorText: {
    color: '#FCA5A5',
    fontSize: 13,
    fontWeight: '500',
  },
  infoBanner: {
    backgroundColor: '#0C4A6E',
    borderColor: '#0284C7',
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
  },
  infoText: {
    color: '#BAE6FD',
    fontSize: 12,
    lineHeight: 16,
  },
  inputGroup: {
    marginBottom: 18,
  },
  inputLabel: {
    color: '#CBD5E1',
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#0F172A',
    borderColor: '#334155',
    borderWidth: 1.5,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    color: '#F8FAFC',
    fontSize: 16,
  },
  inputDisabled: {
    opacity: 0.6,
  },
  otpInput: {
    letterSpacing: 8,
    fontSize: 22,
    textAlign: 'center',
    fontWeight: '700',
  },
  primaryButton: {
    backgroundColor: '#38BDF8', // Sky-400
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 6,
  },
  primaryButtonText: {
    color: '#0F172A',
    fontSize: 15,
    fontWeight: '700',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  secondaryButton: {
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  secondaryButtonText: {
    color: '#94A3B8',
    fontSize: 13,
    fontWeight: '600',
  },
  tipBox: {
    marginTop: 24,
    padding: 14,
    borderRadius: 12,
    backgroundColor: '#1E293B40',
    borderWidth: 1,
    borderColor: '#33415550',
  },
  tipTitle: {
    color: '#E2E8F0',
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 4,
  },
  tipText: {
    color: '#64748B',
    fontSize: 11,
    lineHeight: 16,
  },
});
