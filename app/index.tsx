import React, { useState, useEffect, useRef } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  TextInput, 
  Alert, 
  KeyboardAvoidingView, 
  Platform, 
  TouchableOpacity, 
  ActivityIndicator, 
  ImageBackground,
  Animated
} from 'react-native';
import { router } from 'expo-router';
import { Theme } from '../constants/theme';
import { CustomButton } from '../components/CustomButton';
import { auth } from '../config/firebaseConfig';
import { 
  signInWithEmailAndPassword, 
  onAuthStateChanged 
} from 'firebase/auth';
import { firebaseService } from '../services/firebaseService';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  const passwordRef = useRef<TextInput>(null);

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
        // Bắt đầu hiệu ứng hiện ra
        Animated.parallel([
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: Platform.OS !== 'web',
          }),
          Animated.timing(slideAnim, {
            toValue: 0,
            duration: 800,
            useNativeDriver: Platform.OS !== 'web',
          })
        ]).start();
      }
    });
    return unsubscribe;
  }, []);

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Thiếu thông tin', 'Vui lòng nhập đầy đủ Email và Mật khẩu.');
      return;
    }

    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email.trim(), password);
    } catch (error: any) {
      let message = 'Có lỗi xảy ra, vui lòng thử lại.';
      if (error.code === 'auth/user-not-found') message = 'Tài khoản không tồn tại.';
      if (error.code === 'auth/wrong-password') message = 'Mật khẩu không chính xác.';
      if (error.code === 'auth/invalid-email') message = 'Email không hợp lệ.';
      if (error.code === 'auth/invalid-credential') message = 'Email hoặc mật khẩu không đúng.';
      Alert.alert('Lỗi', message);
    } finally {
      setLoading(false);
    }
  };

  if (checkingAuth) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={Theme.colors.primary} />
        <Text style={{ marginTop: 12, color: Theme.colors.textLight }}>Đang kiểm tra...</Text>
      </View>
    );
  }

  return (
    <ImageBackground 
      source={require('../assets/images/login_bg.png')} 
      style={styles.backgroundImage}
      resizeMode="cover"
    >
      <KeyboardAvoidingView 
        style={styles.container} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <Animated.View style={[
          styles.card, 
          { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }
        ]}>
          <View style={styles.logoSection}>
            <View style={styles.logoCircle}>
              <Text style={styles.logoText}>PMP</Text>
            </View>
            <Text style={styles.title}>Exam Simulator</Text>
            <Text style={styles.subtitle}>Kiến tạo chuyên gia dự án</Text>
          </View>

          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="Email"
              placeholderTextColor={Theme.colors.textLight}
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              returnKeyType="next"
              onSubmitEditing={() => passwordRef.current?.focus()}
              blurOnSubmit={false}
            />
            <TextInput
              ref={passwordRef}
              style={styles.input}
              placeholder="Mật khẩu"
              placeholderTextColor={Theme.colors.textLight}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              returnKeyType="go"
              onSubmitEditing={handleLogin}
            />
          </View>

          {loading ? (
            <ActivityIndicator size="large" color={Theme.colors.primary} style={{ marginVertical: 20 }} />
          ) : (
            <CustomButton 
              title="🔐 Đăng Nhập Hệ Thống" 
              onPress={handleLogin} 
              style={styles.loginButton}
            />
          )}

          <View style={styles.hintContainer}>
            <Text style={styles.hintText}>
              🔒 Tài khoản được cấp bởi quản trị viên. Liên hệ Admin để được hỗ trợ.
            </Text>
          </View>
        </Animated.View>
      </KeyboardAvoidingView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  backgroundImage: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  container: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.1)',
    justifyContent: 'center',
    padding: Theme.spacing.l,
  },
  card: {
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    padding: Theme.spacing.xl,
    borderRadius: Theme.borderRadius.xl,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.2,
    shadowRadius: 30,
    elevation: 10,
    maxWidth: 450,
    alignSelf: 'center',
    width: '100%',
  },
  logoSection: { alignItems: 'center', marginBottom: Theme.spacing.xl },
  logoCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Theme.spacing.m,
    shadowColor: Theme.colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 15,
    elevation: 8,
  },
  logoText: { color: '#fff', fontWeight: 'bold', fontSize: 24 },
  title: { fontSize: 28, fontWeight: 'bold', color: Theme.colors.text, letterSpacing: -0.5 },
  subtitle: { fontSize: 16, color: Theme.colors.textLight, marginTop: 4 },
  inputContainer: { marginBottom: Theme.spacing.m },
  input: {
    borderWidth: 1,
    borderColor: 'rgba(67, 97, 238, 0.15)',
    borderRadius: Theme.borderRadius.m,
    padding: Theme.spacing.m,
    marginBottom: Theme.spacing.m,
    fontSize: 16,
    color: Theme.colors.text,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
  },
  loginButton: { marginTop: Theme.spacing.s, height: 56 },
  hintContainer: {
    marginTop: Theme.spacing.xl,
    padding: Theme.spacing.m,
    backgroundColor: 'rgba(67, 97, 238, 0.05)',
    borderRadius: Theme.borderRadius.m,
    borderLeftWidth: 4,
    borderLeftColor: Theme.colors.primary,
  },
  hintText: { color: Theme.colors.text, fontSize: 13, lineHeight: 20, textAlign: 'center' }
});
