import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  ImageBackground,
  StyleSheet
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import Icon from 'react-native-vector-icons/Feather';
import { authService } from '../../services/authService';
import * as Haptics from 'expo-haptics';

export default function ResetPassword() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    new_password: '',
    confirm_password: ''
  });

 useEffect(() => {
  const urlToken = params.token as string;
  if (urlToken) {
    setToken(urlToken);
  } else {
    setMessage({
      type: 'error',
      text: 'No reset token found. Please request a new password reset link.'
    });
  }
}, [params.token]); // Depend on the specific token value, not the whole params object
  const handleInputChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
    if (message) setMessage(null);
  };

  const validatePasswords = () => {
    if (formData.new_password.length < 8) {
      setMessage({
        type: 'error',
        text: 'Password must be at least 8 characters long'
      });
      return false;
    }
    
    if (formData.new_password !== formData.confirm_password) {
      setMessage({
        type: 'error',
        text: 'Passwords do not match'
      });
      return false;
    }
    
    return true;
  };

  const passwordStrength = () => {
    const password = formData.new_password;
    if (!password) return 0;
    
    let strength = 0;
    if (password.length >= 8) strength += 1;
    if (/[A-Z]/.test(password)) strength += 1;
    if (/[0-9]/.test(password)) strength += 1;
    if (/[^A-Za-z0-9]/.test(password)) strength += 1;
    
    return strength;
  };

  const getStrengthColor = () => {
    const strength = passwordStrength();
    if (strength === 0) return '#6b7280';
    if (strength <= 2) return '#ef4444';
    if (strength === 3) return '#eab308';
    return '#10b981';
  };

  const getStrengthText = () => {
    const strength = passwordStrength();
    if (strength === 0) return 'Enter password';
    if (strength <= 2) return 'Weak';
    if (strength === 3) return 'Good';
    return 'Strong';
  };

  const showMessageAlert = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    Haptics.notificationAsync(
      type === 'error' ? Haptics.NotificationFeedbackType.Error : Haptics.NotificationFeedbackType.Success
    );
    setTimeout(() => setMessage(null), 3000);
  };

  const handleSubmit = async () => {
    if (!token) {
      showMessageAlert('error', 'Invalid or missing reset token');
      return;
    }

    if (!validatePasswords()) {
      return;
    }

    setLoading(true);

    try {
      await authService.resetPassword(token, formData.new_password);
      showMessageAlert('success', 'Password has been reset successfully!');
      setTimeout(() => {
        router.back();
      }, 2000);
    } catch (error: any) {
      showMessageAlert('error', error.response?.data?.error || error.response?.data?.message || 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  const features = [
    { icon: 'shield', title: 'Secure Reset', desc: 'Enterprise-grade security for your password reset.' },
    { icon: 'key', title: 'Strong Password', desc: 'Create a strong password to protect your account.' },
    { icon: 'lock', title: 'Encrypted', desc: 'All data is encrypted during transmission.' },
  ];

  return (
    <ImageBackground
      source={{ uri: 'https://images.unsplash.com/photo-1552566626-52f8b828add9?q=80&w=2070&auto=format&fit=crop' }}
      style={styles.background}
    >
      <LinearGradient
        colors={['rgba(0,0,0,0.7)', 'rgba(0,0,0,0.5)']}
        style={styles.overlay}
      >
        <StatusBar style="light" />
        <SafeAreaView style={styles.safeArea}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.keyboardView}
          >
            <ScrollView
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={false}
            >
              {/* Header */}
              <View style={styles.header}>
                <Text style={styles.title}>Reset Your Password</Text>
                <Text style={styles.subtitle}>
                  Create a new strong password to secure your account
                </Text>
              </View>

              {/* Reset Card */}
              <View style={styles.card}>
                <View style={styles.cardHeader}>
                  <View style={styles.badge}>
                    <Icon name="key" size={16} color="#fff" />
                    <Text style={styles.badgeText}>Password Reset</Text>
                  </View>
                  <Text style={styles.cardTitle}>Reset Password</Text>
                  <Text style={styles.cardSubtitle}>
                    Enter your new password below
                  </Text>
                </View>

                {/* Message Display */}
                {message && (
                  <View style={[
                    styles.messageContainer,
                    message.type === 'success' ? styles.successMessage : styles.errorMessage
                  ]}>
                    <Icon 
                      name={message.type === 'success' ? 'check-circle' : 'alert-circle'} 
                      size={18} 
                      color={message.type === 'success' ? '#10b981' : '#ef4444'} 
                    />
                    <Text style={styles.messageText}>{message.text}</Text>
                  </View>
                )}

                {/* Form */}
                <View style={styles.form}>
                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>New Password</Text>
                    <View style={styles.inputWrapper}>
                      <Icon name="lock" size={18} color="#9ca3af" style={styles.inputIcon} />
                      <TextInput
                        style={styles.input}
                        placeholder="Enter new password"
                        placeholderTextColor="rgba(255,255,255,0.5)"
                        secureTextEntry={!showPassword}
                        value={formData.new_password}
                        onChangeText={(text) => handleInputChange('new_password', text)}
                      />
                      <TouchableOpacity
                        style={styles.eyeIcon}
                        onPress={() => setShowPassword(!showPassword)}
                      >
                        <Icon name={showPassword ? 'eye-off' : 'eye'} size={18} color="#9ca3af" />
                      </TouchableOpacity>
                    </View>
                  </View>

                  {/* Password Strength */}
                  {formData.new_password.length > 0 && (
                    <View style={styles.strengthContainer}>
                      <View style={styles.strengthBars}>
                        {[1, 2, 3, 4].map((level) => (
                          <View
                            key={level}
                            style={[
                              styles.strengthBar,
                              {
                                backgroundColor: level <= passwordStrength() 
                                  ? getStrengthColor() 
                                  : 'rgba(75,85,99,0.5)'
                              }
                            ]}
                          />
                        ))}
                      </View>
                      <Text style={[styles.strengthText, { color: getStrengthColor() }]}>
                        Password strength: {getStrengthText()}
                      </Text>
                    </View>
                  )}

                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>Confirm Password</Text>
                    <View style={styles.inputWrapper}>
                      <Icon name="lock" size={18} color="#9ca3af" style={styles.inputIcon} />
                      <TextInput
                        style={styles.input}
                        placeholder="Confirm new password"
                        placeholderTextColor="rgba(255,255,255,0.5)"
                        secureTextEntry={!showConfirmPassword}
                        value={formData.confirm_password}
                        onChangeText={(text) => handleInputChange('confirm_password', text)}
                      />
                      <TouchableOpacity
                        style={styles.eyeIcon}
                        onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                      >
                        <Icon name={showConfirmPassword ? 'eye-off' : 'eye'} size={18} color="#9ca3af" />
                      </TouchableOpacity>
                    </View>
                  </View>

                  {/* Password Requirements */}
                  <View style={styles.requirements}>
                    <Text style={styles.requirementsTitle}>Password requirements:</Text>
                    <View style={styles.requirementsGrid}>
                      <View style={styles.requirementItem}>
                        <View style={[styles.dot, formData.new_password.length >= 8 && styles.dotSuccess]} />
                        <Text style={[styles.requirementText, formData.new_password.length >= 8 && styles.requirementSuccess]}>
                          8+ characters
                        </Text>
                      </View>
                      <View style={styles.requirementItem}>
                        <View style={[styles.dot, /[A-Z]/.test(formData.new_password) && styles.dotSuccess]} />
                        <Text style={[styles.requirementText, /[A-Z]/.test(formData.new_password) && styles.requirementSuccess]}>
                          Uppercase
                        </Text>
                      </View>
                      <View style={styles.requirementItem}>
                        <View style={[styles.dot, /[0-9]/.test(formData.new_password) && styles.dotSuccess]} />
                        <Text style={[styles.requirementText, /[0-9]/.test(formData.new_password) && styles.requirementSuccess]}>
                          Number
                        </Text>
                      </View>
                      <View style={styles.requirementItem}>
                        <View style={[styles.dot, /[^A-Za-z0-9]/.test(formData.new_password) && styles.dotSuccess]} />
                        <Text style={[styles.requirementText, /[^A-Za-z0-9]/.test(formData.new_password) && styles.requirementSuccess]}>
                          Special character
                        </Text>
                      </View>
                    </View>
                  </View>

                  <TouchableOpacity
                    style={[styles.submitButton, loading && styles.disabledButton]}
                    onPress={handleSubmit}
                    disabled={loading || !formData.new_password || !formData.confirm_password}
                    activeOpacity={0.8}
                  >
                    {loading ? (
                      <ActivityIndicator color="#fff" />
                    ) : (
                      <Text style={styles.submitButtonText}>Reset Password</Text>
                    )}
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => router.back()}
                  >
                    <Icon name="arrow-left" size={16} color="rgba(255,255,255,0.7)" />
                    <Text style={styles.backButtonText}>Back to Login</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Features */}
              <View style={styles.features}>
                {features.map((feature, index) => (
                  <View key={index} style={styles.featureItem}>
                    <View style={styles.featureIcon}>
                      <Icon name={feature.icon as any} size={20} color="#60a5fa" />
                    </View>
                    <View style={styles.featureContent}>
                      <Text style={styles.featureTitle}>{feature.title}</Text>
                      <Text style={styles.featureDesc}>{feature.desc}</Text>
                    </View>
                  </View>
                ))}
              </View>

              {/* Footer Note */}
              <Text style={styles.footerNote}>
                This link will expire in 24 hours for security purposes
              </Text>
            </ScrollView>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </LinearGradient>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  overlay: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingVertical: 40,
  },
  header: {
    marginBottom: 30,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.7)',
  },
  card: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  cardHeader: {
    marginBottom: 24,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(59,130,246,0.3)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    alignSelf: 'flex-start',
    gap: 8,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(59,130,246,0.5)',
  },
  badgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '500',
  },
  cardTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
  },
  messageContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    marginBottom: 20,
    gap: 8,
  },
  successMessage: {
    backgroundColor: 'rgba(16,185,129,0.2)',
    borderWidth: 1,
    borderColor: 'rgba(16,185,129,0.4)',
  },
  errorMessage: {
    backgroundColor: 'rgba(239,68,68,0.2)',
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.4)',
  },
  messageText: {
    color: '#fff',
    fontSize: 14,
    flex: 1,
  },
  form: {
    gap: 20,
  },
  inputGroup: {
    gap: 8,
  },
  label: {
    fontSize: 12,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.8)',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  inputIcon: {
    paddingLeft: 16,
  },
  input: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 14,
    color: '#fff',
    fontSize: 16,
  },
  eyeIcon: {
    paddingRight: 16,
  },
  strengthContainer: {
    gap: 8,
  },
  strengthBars: {
    flexDirection: 'row',
    gap: 4,
  },
  strengthBar: {
    flex: 1,
    height: 4,
    borderRadius: 2,
  },
  strengthText: {
    fontSize: 10,
  },
  requirements: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  requirementsTitle: {
    fontSize: 10,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.6)',
    marginBottom: 8,
  },
  requirementsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  requirementItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(75,85,99,0.5)',
  },
  dotSuccess: {
    backgroundColor: '#10b981',
  },
  requirementText: {
    fontSize: 9,
    color: 'rgba(255,255,255,0.5)',
  },
  requirementSuccess: {
    color: '#10b981',
  },
  submitButton: {
    backgroundColor: '#3b82f6',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  disabledButton: {
    opacity: 0.5,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
  },
  backButtonText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 14,
  },
  features: {
    marginTop: 30,
    gap: 16,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  featureIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: 'rgba(59,130,246,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  featureContent: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  featureDesc: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.6)',
  },
  footerNote: {
    textAlign: 'center',
    fontSize: 10,
    color: 'rgba(255,255,255,0.4)',
    marginTop: 20,
  },
});