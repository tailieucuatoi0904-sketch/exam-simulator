import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, SafeAreaView, Platform, StatusBar } from 'react-native';
import { Theme } from '../../constants/theme';
import { firebaseService } from '../../services/firebaseService';
import { Ionicons } from '@expo/vector-icons';
import { auth } from '../../config/firebaseConfig';

export default function LeaderboardScreen() {
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const currentUserId = auth.currentUser?.uid;

  useEffect(() => {
    const fetchLeaderboard = async () => {
      setLoading(true);
      const data = await firebaseService.getLeaderboardData();
      setLeaderboard(data);
      setLoading(false);
    };

    fetchLeaderboard();
  }, []);

  const renderTopThree = () => {
    if (leaderboard.length === 0) return null;
    
    const top3 = leaderboard.slice(0, 3);
    
    return (
      <View style={styles.topThreeContainer}>
        {/* Hạng 2 */}
        {top3[1] && (
          <View style={[styles.topAvatar, { marginTop: 40 }]}>
            <View style={[styles.medalCircle, { backgroundColor: '#C0C0C0' }]}>
              <Text style={styles.medalRank}>2</Text>
            </View>
            <View style={[styles.avatarPlaceholder, { borderColor: '#C0C0C0', borderWidth: 3 }]}>
              <Text style={styles.avatarInitial}>{top3[1].name.charAt(0).toUpperCase()}</Text>
            </View>
            <Text style={styles.topName} numberOfLines={1}>{top3[1].name}</Text>
            <Text style={styles.topScore}>{top3[1].score} câu</Text>
          </View>
        )}
        
        {/* Hạng 1 */}
        {top3[0] && (
          <View style={styles.topAvatar}>
            <Ionicons name="trophy" size={36} color="#FFD700" style={{ marginBottom: -10, zIndex: 1 }} />
            <View style={[styles.avatarPlaceholder, { borderColor: '#FFD700', borderWidth: 4, width: 80, height: 80 }]}>
              <Text style={[styles.avatarInitial, { fontSize: 36 }]}>{top3[0].name.charAt(0).toUpperCase()}</Text>
            </View>
            <Text style={[styles.topName, { fontWeight: 'bold', fontSize: 16 }]} numberOfLines={1}>{top3[0].name}</Text>
            <Text style={[styles.topScore, { color: Theme.colors.primary, fontWeight: 'bold' }]}>{top3[0].score} câu</Text>
          </View>
        )}
        
        {/* Hạng 3 */}
        {top3[2] && (
          <View style={[styles.topAvatar, { marginTop: 50 }]}>
            <View style={[styles.medalCircle, { backgroundColor: '#CD7F32' }]}>
              <Text style={styles.medalRank}>3</Text>
            </View>
            <View style={[styles.avatarPlaceholder, { borderColor: '#CD7F32', borderWidth: 3 }]}>
              <Text style={styles.avatarInitial}>{top3[2].name.charAt(0).toUpperCase()}</Text>
            </View>
            <Text style={styles.topName} numberOfLines={1}>{top3[2].name}</Text>
            <Text style={styles.topScore}>{top3[2].score} câu</Text>
          </View>
        )}
      </View>
    );
  };

  const renderItem = ({ item, index }: { item: any; index: number }) => {
    // Skip top 3 as they are rendered separately
    if (index < 3) return null;
    
    const isMe = item.uid === currentUserId;

    return (
      <View style={[styles.listItem, isMe && styles.myListItem]}>
        <Text style={styles.rankNumber}>{index + 1}</Text>
        <View style={styles.listAvatar}>
          <Text style={styles.listAvatarText}>{item.name.charAt(0).toUpperCase()}</Text>
        </View>
        <Text style={[styles.listName, isMe && { fontWeight: 'bold', color: Theme.colors.primary }]} numberOfLines={1}>
          {item.name} {isMe ? '(Bạn)' : ''}
        </Text>
        <View style={styles.scoreBadge}>
          <Text style={[styles.scoreText, isMe && { color: Theme.colors.primary }]}>{item.score}</Text>
          <Ionicons name="checkmark-circle" size={14} color={Theme.colors.success} style={{ marginLeft: 4 }} />
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Bảng Vàng PMP 🏆</Text>
        <Text style={styles.headerSub}>Dựa trên số câu hỏi chinh phục</Text>
      </View>

      {loading ? (
        <View style={styles.loading}>
          <ActivityIndicator size="large" color={Theme.colors.primary} />
          <Text style={styles.loadingText}>Đang cập nhật bảng xếp hạng...</Text>
        </View>
      ) : leaderboard.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="trophy-outline" size={64} color={Theme.colors.border} />
          <Text style={styles.emptyText}>Chưa có dữ liệu xếp hạng.</Text>
          <Text style={styles.emptySubText}>Hãy làm bài tập để ghi tên mình lên bảng vàng!</Text>
        </View>
      ) : (
        <FlatList
          data={leaderboard}
          keyExtractor={item => item.uid}
          renderItem={renderItem}
          ListHeaderComponent={renderTopThree}
          contentContainerStyle={styles.listContainer}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Theme.colors.background,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  header: {
    padding: Theme.spacing.l,
    backgroundColor: Theme.colors.surface,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: Theme.colors.border,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: Theme.colors.text,
  },
  headerSub: {
    fontSize: 13,
    color: Theme.colors.textLight,
    marginTop: 4,
  },
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    color: Theme.colors.textLight,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Theme.spacing.xl,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Theme.colors.textLight,
    marginTop: 16,
  },
  emptySubText: {
    fontSize: 14,
    color: Theme.colors.textLight,
    marginTop: 8,
    textAlign: 'center',
  },
  listContainer: {
    paddingBottom: 40,
  },
  topThreeContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'flex-start',
    paddingVertical: 30,
    gap: 16,
    backgroundColor: '#fff',
    marginBottom: 8,
  },
  topAvatar: {
    alignItems: 'center',
    width: 90,
  },
  avatarPlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 40,
    backgroundColor: Theme.colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
  },
  avatarInitial: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Theme.colors.text,
  },
  medalCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: -12,
    zIndex: 1,
  },
  medalRank: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  topName: {
    fontSize: 14,
    color: Theme.colors.text,
    textAlign: 'center',
    marginBottom: 2,
  },
  topScore: {
    fontSize: 13,
    color: Theme.colors.textLight,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: Theme.spacing.m,
    marginHorizontal: Theme.spacing.m,
    marginBottom: 8,
    borderRadius: Theme.borderRadius.m,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  myListItem: {
    backgroundColor: 'rgba(67, 97, 238, 0.05)',
    borderColor: Theme.colors.primary,
    borderWidth: 1,
  },
  rankNumber: {
    width: 30,
    fontSize: 16,
    fontWeight: 'bold',
    color: Theme.colors.textLight,
    textAlign: 'center',
  },
  listAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.05)',
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 12,
  },
  listAvatarText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Theme.colors.textLight,
  },
  listName: {
    flex: 1,
    fontSize: 15,
    color: Theme.colors.text,
  },
  scoreBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(38, 194, 129, 0.1)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  scoreText: {
    fontWeight: 'bold',
    color: Theme.colors.text,
  }
});
