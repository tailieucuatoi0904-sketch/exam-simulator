import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Theme } from '../../constants/theme';

interface HotspotZone {
  id: string;
  label: string;
}

interface HotspotQuestionProps {
  imageUrl?: string;
  zones: HotspotZone[];
  selectedZoneId: string | null;
  onSelectZone: (zoneId: string) => void;
}

export const HotspotQuestion: React.FC<HotspotQuestionProps> = ({
  imageUrl,
  zones,
  selectedZoneId,
  onSelectZone,
}) => {
  return (
    <View style={styles.container}>
      {/* Hiển thị hình ảnh nếu có */}
      {imageUrl ? (
        <View style={styles.imageContainer}>
          <Image
            source={{ uri: imageUrl }}
            style={styles.image}
            resizeMode="contain"
            onLoad={() => console.log('Hotspot Image Loaded successfully')}
            onError={(e) => console.error('Hotspot Image Load Error:', e.nativeEvent.error)}
          />
          <View style={styles.captionRow}>
            <Ionicons name="scan-outline" size={14} color={Theme.colors.textLight} />
            <Text style={styles.imageCaption}>Xem hình và chọn vùng đúng bên dưới</Text>
          </View>
        </View>
      ) : (
        <View style={styles.imagePlaceholder}>
          <Ionicons name="image-outline" size={40} color={Theme.colors.textLight} />
          <Text style={styles.imagePlaceholderText}>Chưa có hình ảnh cho câu hỏi này</Text>
        </View>
      )}

      {/* Lưới các vùng (zones) để học viên chọn */}
      <Text style={styles.instruction}>
        👆 Chọn vùng tương ứng trên hình:
      </Text>
      <View style={styles.zonesGrid}>
        {zones.map((zone) => {
          const isSelected = selectedZoneId === zone.id;
          return (
            <TouchableOpacity
              key={zone.id}
              style={[styles.zoneBtn, isSelected && styles.zoneBtnSelected]}
              onPress={() => onSelectZone(zone.id)}
              activeOpacity={0.8}
            >
              <View style={[styles.zoneIndicator, isSelected && styles.zoneIndicatorSelected]}>
                {isSelected && (
                  <Ionicons name="checkmark" size={14} color="#fff" />
                )}
              </View>
              <Text style={[styles.zoneLabel, isSelected && styles.zoneLabelSelected]}>
                {zone.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: 12,
  },
  imageContainer: {
    borderRadius: Theme.borderRadius.m,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Theme.colors.border,
    backgroundColor: '#f0f0f0',
  },
  image: {
    width: '100%',
    height: 300,
    minHeight: 200,
    backgroundColor: '#fff',
  },
  captionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    backgroundColor: 'rgba(0,0,0,0.03)',
  },
  imageCaption: {
    fontSize: 12,
    color: Theme.colors.textLight,
    fontStyle: 'italic',
  },
  imagePlaceholder: {
    height: 120,
    borderRadius: Theme.borderRadius.m,
    borderWidth: 1,
    borderColor: Theme.colors.border,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#fafafa',
  },
  imagePlaceholderText: {
    color: Theme.colors.textLight,
    fontSize: 13,
    fontStyle: 'italic',
  },
  instruction: {
    fontSize: 13,
    color: Theme.colors.textLight,
    fontStyle: 'italic',
  },
  zonesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  zoneBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Theme.colors.surface,
    borderWidth: 1.5,
    borderColor: Theme.colors.border,
    borderRadius: Theme.borderRadius.m,
    paddingVertical: 10,
    paddingHorizontal: 16,
    minWidth: '45%',
  },
  zoneBtnSelected: {
    borderColor: Theme.colors.primary,
    backgroundColor: 'rgba(67, 97, 238, 0.08)',
  },
  zoneIndicator: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: Theme.colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  zoneIndicatorSelected: {
    backgroundColor: Theme.colors.primary,
    borderColor: Theme.colors.primary,
  },
  zoneLabel: {
    flex: 1,
    fontSize: 14,
    color: Theme.colors.text,
  },
  zoneLabelSelected: {
    color: Theme.colors.primary,
    fontWeight: '600',
  },
});
