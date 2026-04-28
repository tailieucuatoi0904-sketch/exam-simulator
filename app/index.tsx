import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, TextInput, Alert, KeyboardAvoidingView, Platform, TouchableOpacity, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { Theme } from '../constants/theme';
import { CustomButton } from '../components/CustomButton';
import { auth } from '../config/firebaseConfig';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  onAuthStateChanged 
} from 'firebase/auth';
import { firebaseService } from '../services/firebaseService';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [loading, setLoading] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);

  // Kiểm tra nếu đã đăng nhập rồi thì tự chuyển hướng
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const profile = await firebaseService.getUserProfile(user.uid);
        if (profile?.role === 'admin') {
          router.replace('/(admin)');
        } else {
          router.replace('/(tabs)');
        }
      } else {
        setCheckingAuth(false);
      }
    });
    return unsubscribe;
  }, []);

  const handleAuth = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Thiếu thông tin', 'Vui lòng nhập đầy đủ Email và Mật khẩu.');
      return;
    }
    if (password.length < 6) {
      Alert.alert('Mật khẩu quá ngắn', 'Mật khẩu phải có ít nhất 6 ký tự.');
      return;
    }

    setLoading(true);
    try {
      if (isRegistering) {
        // Đăng ký tài khoản mới
        const userCredential = await createUserWithEmailAndPassword(auth, email.trim(), password);
        const user = userCredential.user;
        
        // Lưu profile với role mặc định là 'student'
        await firebaseService.saveUserProfile(user.uid, {
          email: user.email,
          role: 'student',
          displayName: email.split('@')[0]
        });
        
        router.replace('/(tabs)');
      } else {
        // Đăng nhập
        await signInWithEmailAndPassword(auth, email.trim(), password);
        // onAuthStateChanged sẽ tự xử lý chuyển hướng
      }
    } catch (error: any) {
      let message = 'Có lỗi xảy ra, vui lòng thử lại.';
      if (error.code === 'auth/user-not-found') message = 'Tài khoản không tồn tại.';
      if (error.code === 'auth/wrong-password') message = 'Mật khẩu không chính xác.';
      if (error.code === 'auth/invalid-email') message = 'Email không hợp lệ.';
      if (error.code === 'auth/email-already-in-use') message = 'Email này đã được sử dụng.';
      if (error.code === 'auth/invalid-credential') message = 'Email hoặc mật khẩu không đúng.';
      if (error.code === 'auth/network-request-failed') message = 'Lỗi mạng, vui lòng kiểm tra kết nối internet.';
      Alert.alert('Lỗi đăng nhập', message);
    } finally {
      setLoading(false);
    }
  };

  if (checkingAuth) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={Theme.colors.primary} />
        <Text style={{ marginTop: 12, color: Theme.colors.textLight }}>Đang kiểm tra phiên đăng nhập...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.card}>
        <View style={styles.logoSection}>
          <View style={styles.logoCircle}>
            <Text style={styles.logoText}>PMP</Text>
          </View>
          <Text style={styles.title}>Exam Simulator</Text>
          <Text style={styles.subtitle}>
            {isRegistering ? 'Tạo tài khoản mới' : 'Chào mừng trở lại!'}
          </Text>
        </View>

        <TextInput
          style={styles.input}
          placeholder="Email"
          placeholderTextColor={Theme.colors.textLight}
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
        />
        <TextInput
          style={styles.input}
          placeholder="Mật khẩu (ít nhất 6 ký tự)"
          placeholderTextColor={Theme.colors.textLight}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        {loading ? (
          <ActivityIndicator size="large" color={Theme.colors.primary} style={{ marginVertical: 20 }} />
        ) : (
          <CustomButton 
            title={isRegistering ? "🚀 Đăng Ký" : "🔐 Đăng Nhập"} 
            onPress={handleAuth} 
            style={styles.loginButton}
          />
        )}

        <TouchableOpacity onPress={() => setIsRegistering(!isRegistering)} style={styles.switchButton}>
          <Text style={styles.switchText}>
            {isRegistering 
              ? "Đã có tài khoản? → Đăng nhập" 
              : "Chưa có tài khoản? → Đăng ký ngay"}
          </Text>
        </TouchableOpacity>

        <View style={styles.hintContainer}>
          <Text style={styles.hintText}>
            💡 Dùng email thật để lưu kết quả thi lên Cloud và truy cập trên mọi thiết bị.
          </Text>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.colors.background,
    justifyContent: 'center',
    padding: Theme.spacing.l,
  },
  card: {
    backgroundColor: Theme.colors.surface,
    padding: Theme.spacing.xl,
    borderRadius: Theme.borderRadius.l,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.12,
    shadowRadius: 20,
  },
  logoSection: { alignItems: 'center', marginBottom: Theme.spacing.xl },
  logoCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: Theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Theme.spacing.m,
  },
  logoText: { color: '#fff', fontWeight: 'bold', fontSize: 20 },
  title: { fontSize: 24, fontWeight: 'bold', color: Theme.colors.text },
  subtitle: { fontSize: 14, color: Theme.colors.textLight, marginTop: 4 },
  input: {
    borderWidth: 1,
    borderColor: Theme.colors.border,
    borderRadius: Theme.borderRadius.m,
    padding: Theme.spacing.m,
    marginBottom: Theme.spacing.m,
    fontSize: 16,
    color: Theme.colors.text,
    backgroundColor: Theme.colors.background,
  },
  loginButton: { marginTop: Theme.spacing.s },
  switchButton: { marginTop: Theme.spacing.l, alignItems: 'center' },
  switchText: { color: Theme.colors.primary, fontWeight: '600', fontSize: 14 },
  hintContainer: {
    marginTop: Theme.spacing.xl,
    padding: Theme.spacing.m,
    backgroundColor: 'rgba(67, 97, 238, 0.06)',
    borderRadius: Theme.borderRadius.m,
    borderLeftWidth: 3,
    borderLeftColor: Theme.colors.primary,
  },
  hintText: { color: Theme.colors.textLight, fontSize: 12, lineHeight: 18 }
});
