import React, { useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  LayoutChangeEvent,
  ScrollView,
} from 'react-native';
import { Theme } from '../../constants/theme';
import { Ionicons } from '@expo/vector-icons';

interface MatchItem {
  id: string;
  text: string;
}

interface MatchingQuestionProps {
  leftItems: MatchItem[];
  rightItems: MatchItem[];
  currentPairs: Record<string, string>; // { leftId: rightId }
  onPairsChange: (pairs: Record<string, string>) => void;
}

interface ItemLayout {
  x: number;
  y: number;
  width: number;
  height: number;
}

export const MatchingQuestion: React.FC<MatchingQuestionProps> = ({
  leftItems,
  rightItems,
  currentPairs,
  onPairsChange,
}) => {
  const [selectedLeft, setSelectedLeft] = useState<string | null>(null);
  const [pairs, setPairs] = useState<Record<string, string>>(currentPairs);
  const [leftLayouts, setLeftLayouts] = useState<Record<string, ItemLayout>>({});
  const [rightLayouts, setRightLayouts] = useState<Record<string, ItemLayout>>({});
  const containerRef = useRef<View>(null);
  const [containerLayout, setContainerLayout] = useState({ x: 0, y: 0 });

  const handleLeftPress = (leftId: string) => {
    if (selectedLeft === leftId) {
      setSelectedLeft(null);
    } else {
      setSelectedLeft(leftId);
    }
  };

  const handleRightPress = (rightId: string) => {
    if (!selectedLeft) return;

    // Check if rightId already used by another left
    const existingLeft = Object.entries(pairs).find(([, r]) => r === rightId)?.[0];

    const newPairs = { ...pairs };

    // Remove existing connection to this right
    if (existingLeft) {
      delete newPairs[existingLeft];
    }

    // Remove existing connection from this left
    if (newPairs[selectedLeft]) {
      delete newPairs[selectedLeft];
    }

    // Create new pair
    newPairs[selectedLeft] = rightId;
    setPairs(newPairs);
    onPairsChange(newPairs);
    setSelectedLeft(null);
  };

  const removePair = (leftId: string) => {
    const newPairs = { ...pairs };
    delete newPairs[leftId];
    setPairs(newPairs);
    onPairsChange(newPairs);
  };

  const isPairedLeft = (leftId: string) => leftId in pairs;
  const isPairedRight = (rightId: string) => Object.values(pairs).includes(rightId);
  const getMatchedRight = (leftId: string) => rightItems.find(r => r.id === pairs[leftId]);
  const getMatchedLeft = (rightId: string) => leftItems.find(l => pairs[l.id] === rightId);

  const getLineColor = (leftId: string, idx: number) => {
    const palette = ['#4361EE', '#E84393', '#F72585', '#4CC9F0', '#7209B7', '#06D6A0'];
    return palette[idx % palette.length];
  };

  return (
    <View style={styles.wrapper}>
      {/* Instructions */}
      <View style={styles.instructionRow}>
        <Ionicons name="git-merge-outline" size={16} color={Theme.colors.primary} />
        <Text style={styles.instruction}>
          {selectedLeft
            ? '👉 Bây giờ bấm vào một mục ở cột phải để nối'
            : '👈 Bắt đầu bằng cách bấm một mục ở cột trái'}
        </Text>
      </View>

      {/* Active pairs summary */}
      {Object.keys(pairs).length > 0 && (
        <View style={styles.pairsSummary}>
          {Object.entries(pairs).map(([leftId, rightId], idx) => {
            const l = leftItems.find(i => i.id === leftId);
            const r = rightItems.find(i => i.id === rightId);
            if (!l || !r) return null;
            const color = getLineColor(leftId, idx);
            return (
              <View key={leftId} style={[styles.pairRow, { borderLeftColor: color }]}>
                <Text style={styles.pairText} numberOfLines={1}>{l.text}</Text>
                <Ionicons name="arrow-forward" size={14} color={color} />
                <Text style={styles.pairText} numberOfLines={1}>{r.text}</Text>
                <TouchableOpacity onPress={() => removePair(leftId)} style={styles.removePairBtn}>
                  <Ionicons name="close-circle" size={16} color={Theme.colors.error} />
                </TouchableOpacity>
              </View>
            );
          })}
        </View>
      )}

      {/* Two columns */}
      <View style={styles.columnsContainer}>
        {/* LEFT column */}
        <View style={styles.column}>
          <Text style={styles.columnTitle}>Cột A</Text>
          {leftItems.map((item, idx) => {
            const isSelected = selectedLeft === item.id;
            const isPaired = isPairedLeft(item.id);
            const color = isPaired ? getLineColor(item.id, Object.keys(pairs).indexOf(item.id)) : undefined;

            return (
              <TouchableOpacity
                key={item.id}
                style={[
                  styles.matchItem,
                  isSelected && styles.matchItemSelected,
                  isPaired && { borderColor: color, borderWidth: 2 },
                ]}
                onPress={() => handleLeftPress(item.id)}
                activeOpacity={0.75}
              >
                {isPaired && (
                  <View style={[styles.pairDot, { backgroundColor: color }]} />
                )}
                <Text style={[
                  styles.matchItemText,
                  isSelected && styles.matchItemTextSelected,
                  isPaired && { color }
                ]}>
                  {item.text}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Center arrow indicator */}
        <View style={styles.centerArrow}>
          <Ionicons name="swap-horizontal" size={22} color={Theme.colors.textLight} />
        </View>

        {/* RIGHT column */}
        <View style={styles.column}>
          <Text style={styles.columnTitle}>Cột B</Text>
          {rightItems.map((item) => {
            const isPaired = isPairedRight(item.id);
            const matchedLeft = isPaired ? getMatchedLeft(item.id) : null;
            const pairIdx = matchedLeft ? Object.keys(pairs).indexOf(matchedLeft.id) : -1;
            const color = isPaired ? getLineColor(matchedLeft!.id, pairIdx) : undefined;
            const isTarget = !!selectedLeft;

            return (
              <TouchableOpacity
                key={item.id}
                style={[
                  styles.matchItem,
                  isTarget && !isPaired && styles.matchItemTargetable,
                  isPaired && { borderColor: color, borderWidth: 2 },
                ]}
                onPress={() => handleRightPress(item.id)}
                activeOpacity={0.75}
                disabled={!selectedLeft && !isPaired}
              >
                {isPaired && (
                  <View style={[styles.pairDot, { backgroundColor: color }]} />
                )}
                <Text style={[
                  styles.matchItemText,
                  isPaired && { color }
                ]}>
                  {item.text}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Reset button */}
      {Object.keys(pairs).length > 0 && (
        <TouchableOpacity
          style={styles.resetBtn}
          onPress={() => {
            setPairs({});
            onPairsChange({});
            setSelectedLeft(null);
          }}
        >
          <Ionicons name="refresh-outline" size={14} color={Theme.colors.error} />
          <Text style={styles.resetBtnText}>Xóa tất cả kết nối</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    gap: 12,
  },
  instructionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(67, 97, 238, 0.06)',
    padding: 10,
    borderRadius: Theme.borderRadius.s,
  },
  instruction: {
    flex: 1,
    fontSize: 13,
    color: Theme.colors.primary,
    fontWeight: '500',
  },
  pairsSummary: {
    gap: 6,
    padding: 10,
    backgroundColor: 'rgba(0,0,0,0.02)',
    borderRadius: Theme.borderRadius.s,
    borderWidth: 1,
    borderColor: Theme.colors.border,
  },
  pairRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingLeft: 8,
    borderLeftWidth: 3,
  },
  pairText: {
    flex: 1,
    fontSize: 12,
    color: Theme.colors.text,
  },
  removePairBtn: {
    padding: 2,
  },
  columnsContainer: {
    flexDirection: 'row',
    gap: 0,
    alignItems: 'flex-start',
  },
  column: {
    flex: 1,
    gap: 8,
  },
  columnTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: Theme.colors.textLight,
    textTransform: 'uppercase',
    letterSpacing: 1,
    textAlign: 'center',
    marginBottom: 4,
  },
  centerArrow: {
    paddingTop: 32,
    paddingHorizontal: 4,
    alignItems: 'center',
  },
  matchItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Theme.colors.surface,
    borderRadius: Theme.borderRadius.s,
    padding: 10,
    borderWidth: 1,
    borderColor: Theme.colors.border,
    minHeight: 50,
    gap: 6,
  },
  matchItemSelected: {
    borderColor: Theme.colors.primary,
    backgroundColor: 'rgba(67, 97, 238, 0.08)',
    borderWidth: 2,
  },
  matchItemTargetable: {
    borderStyle: 'dashed',
    borderColor: Theme.colors.primary,
    opacity: 0.85,
  },
  matchItemText: {
    flex: 1,
    fontSize: 13,
    color: Theme.colors.text,
    lineHeight: 18,
  },
  matchItemTextSelected: {
    color: Theme.colors.primary,
    fontWeight: '600',
  },
  pairDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    flexShrink: 0,
  },
  resetBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-end',
    padding: 6,
  },
  resetBtnText: {
    fontSize: 12,
    color: Theme.colors.error,
  },
});
