import React from 'react';
import { StyleSheet, View, Text, SafeAreaView, TouchableOpacity, Platform, StatusBar, ScrollView, Alert } from 'react-native';
import { router } from 'expo-router';
import { Theme } from '../../constants/theme';
import { auth } from '../../config/firebaseConfig';
import { signOut } from 'firebase/auth';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

export default function ProfileTab() {
  const user = auth.currentUser;
  const userEmail = user?.email || 'Học viên';

  const handleLogout = async () => {
    const doLogout = async () => {
      try {
        await signOut(auth);
        router.replace('/');
      } catch (e) {
        console.error(e);
      }
    };

    if (Platform.OS === 'web') {
      if (window.confirm('Bạn có chắc chắn muốn đăng xuất?')) {
        await doLogout();
      }
    } else {
      Alert.alert('Đăng xuất', 'Bạn có chắc chắn muốn thoát?', [
        { text: 'Hủy', style: 'cancel' },
        { text: 'Đăng xuất', onPress: doLogout }
      ]);
    }
  };

  const ProfileItem = ({ icon, title, subtitle, onPress, color = Theme.colors.text }: any) => (
    <TouchableOpacity style={styles.item} onPress={onPress}>
      <View style={[styles.iconBox, { backgroundColor: `${color}10` }]}>
        <Ionicons name={icon} size={22} color={color} />
      </View>
      <View style={styles.itemContent}>
        <Text style={styles.itemTitle}>{title}</Text>
        {subtitle && <Text style={styles.itemSubtitle}>{subtitle}</Text>}
      </View>
      <Ionicons name="chevron-forward" size={20} color={Theme.colors.textLight} />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        
        {/* Profile Header */}
        <View style={styles.header}>
          <LinearGradient
            colors={Theme.colors.primaryGradient}
            style={styles.avatarGradient}
          >
            <Text style={styles.avatarText}>{userEmail.charAt(0).toUpperCase()}</Text>
          </LinearGradient>
          <Text style={styles.userName}>Học viên PMP</Text>
          <Text style={styles.userEmail}>{userEmail}</Text>
          
          <View style={styles.badgeRow}>
            <View style={styles.badge}>
              <Ionicons name="ribbon" size={12} color={Theme.colors.warning} />
              <Text style={styles.badgeText}>Thành viên Premium</Text>
            </View>
          </View>
        </View>

        {/* Section: Account */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Tài khoản</Text>
          <View style={styles.card}>
            <ProfileItem 
              icon="person-outline" 
              title="Thông tin cá nhân" 
              subtitle="Cập nhật tên và ảnh đại diện"
              onPress={() => {}}
            />
            <View style={styles.divider} />
            <ProfileItem 
              icon="lock-closed-outline" 
              title="Đổi mật khẩu" 
              subtitle="Thay đổi mật khẩu đăng nhập"
              onPress={() => {}}
            />
          </View>
        </View>

        {/* Section: App Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Ứng dụng</Text>
          <View style={styles.card}>
            <ProfileItem 
              icon="notifications-outline" 
              title="Thông báo" 
              onPress={() => {}}
            />
            <View style={styles.divider} />
            <ProfileItem 
              icon="help-circle-outline" 
              title="Hướng dẫn sử dụng" 
              onPress={() => {}}
            />
            <View style={styles.divider} />
            <ProfileItem 
              icon="information-circle-outline" 
              title="Về ứng dụng" 
              onPress={() => {}}
            />
          </View>
        </View>

        {/* Logout Button */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Ionicons name="log-out" size={20} color={Theme.colors.error} />
          <Text style={styles.logoutButtonText}>Đăng xuất tài khoản</Text>
        </TouchableOpacity>

        <Text style={styles.versionText}>Phiên bản 1.0.0 (Premium)</Text>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Theme.colors.background,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  container: { flex: 1 },
  content: { padding: Theme.spacing.l, paddingBottom: Theme.spacing.xxl },
  header: {
    alignItems: 'center',
    marginTop: Theme.spacing.xl,
    marginBottom: Theme.spacing.xxl,
  },
  avatarGradient: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Theme.spacing.m,
    shadowColor: Theme.colors.primary,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
    elevation: 8,
  },
  avatarText: { color: '#fff', fontSize: 40, fontWeight: '800' },
  userName: { fontSize: 22, fontWeight: '800', color: Theme.colors.text },
  userEmail: { fontSize: 14, color: Theme.colors.textLight, marginTop: 4 },
  badgeRow: { marginTop: 12 },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255, 183, 3, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 183, 3, 0.2)',
  },
  badgeText: { fontSize: 11, fontWeight: '700', color: Theme.colors.warning },
  section: { marginBottom: Theme.spacing.xl },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '800',
    color: Theme.colors.textLight,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: Theme.spacing.s,
    marginLeft: Theme.spacing.s,
  },
  card: {
    backgroundColor: Theme.colors.surface,
    borderRadius: Theme.borderRadius.xl,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Theme.spacing.m,
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Theme.spacing.m,
  },
  itemContent: { flex: 1 },
  itemTitle: { fontSize: 16, fontWeight: '700', color: Theme.colors.text },
  itemSubtitle: { fontSize: 12, color: Theme.colors.textLight, marginTop: 2 },
  divider: { height: 1, backgroundColor: 'rgba(0,0,0,0.03)', marginLeft: 64 },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: 'rgba(239, 35, 60, 0.08)',
    padding: Theme.spacing.m,
    borderRadius: Theme.borderRadius.l,
    marginTop: Theme.spacing.l,
    borderWidth: 1,
    borderColor: 'rgba(239, 35, 60, 0.1)',
  },
  logoutButtonText: { color: Theme.colors.error, fontWeight: '800', fontSize: 16 },
  versionText: {
    textAlign: 'center',
    marginTop: Theme.spacing.xl,
    color: Theme.colors.textLight,
    fontSize: 12,
  }
});
