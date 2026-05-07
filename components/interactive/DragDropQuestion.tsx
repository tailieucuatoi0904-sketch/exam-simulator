import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { Theme } from '../../constants/theme';
import { Ionicons } from '@expo/vector-icons';

interface DragDropItem {
  id: string;
  text: string;
}

interface DragDropQuestionProps {
  items: DragDropItem[];
  onOrderChange: (orderedIds: string[]) => void;
  currentOrder: string[];
}

// Web-only DnD using HTML5 Drag & Drop API (compatible with @dnd-kit behavior)
function WebDragDrop({ items, onOrderChange, currentOrder }: DragDropQuestionProps) {
  const [orderedIds, setOrderedIds] = useState<string[]>(
    currentOrder.length === items.length ? currentOrder : items.map(i => i.id)
  );
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [overIndex, setOverIndex] = useState<number | null>(null);

  const orderedItems = orderedIds.map(id => items.find(i => i.id === id)!).filter(Boolean);

  const handleDragStart = (id: string) => {
    setDraggingId(id);
  };

  const handleDragOver = (e: any, toId: string) => {
    e.preventDefault();
    const toIndex = orderedIds.indexOf(toId);
    setOverIndex(toIndex);
  };

  const handleDrop = (toId: string) => {
    if (!draggingId || draggingId === toId) {
      setDraggingId(null);
      setOverIndex(null);
      return;
    }
    const fromIndex = orderedIds.indexOf(draggingId);
    const toIndex = orderedIds.indexOf(toId);
    const newOrder = [...orderedIds];
    newOrder.splice(fromIndex, 1);
    newOrder.splice(toIndex, 0, draggingId);
    setOrderedIds(newOrder);
    onOrderChange(newOrder);
    setDraggingId(null);
    setOverIndex(null);
  };

  const handleDragEnd = () => {
    setDraggingId(null);
    setOverIndex(null);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.instruction}>
        🖐️ Kéo và thả để sắp xếp đúng thứ tự:
      </Text>
      {orderedItems.map((item, index) => (
        <div
          key={item.id}
          draggable
          onDragStart={() => handleDragStart(item.id)}
          onDragOver={(e) => handleDragOver(e, item.id)}
          onDrop={() => handleDrop(item.id)}
          onDragEnd={handleDragEnd}
          style={{
            opacity: draggingId === item.id ? 0.4 : 1,
            borderWidth: overIndex === index ? 2 : 0,
            borderColor: '#4361EE',
            borderStyle: 'dashed',
            cursor: 'grab',
          }}
        >
          <View style={[styles.item, draggingId === item.id && styles.itemDragging]}>
            <View style={styles.dragHandle}>
              <Ionicons name="reorder-three-outline" size={20} color={Theme.colors.textLight} />
            </View>
            <View style={styles.rank}>
              <Text style={styles.rankText}>{index + 1}</Text>
            </View>
            <Text style={styles.itemText}>{item.text}</Text>
          </View>
        </div>
      ))}
    </View>
  );
}

// Native fallback with Up/Down buttons
function NativeDragDrop({ items, onOrderChange, currentOrder }: DragDropQuestionProps) {
  const [orderedIds, setOrderedIds] = useState<string[]>(
    currentOrder.length === items.length ? currentOrder : items.map(i => i.id)
  );

  const orderedItems = orderedIds.map(id => items.find(i => i.id === id)!).filter(Boolean);

  const moveItem = (fromIndex: number, toIndex: number) => {
    if (toIndex < 0 || toIndex >= orderedIds.length) return;
    const newOrder = [...orderedIds];
    const [moved] = newOrder.splice(fromIndex, 1);
    newOrder.splice(toIndex, 0, moved);
    setOrderedIds(newOrder);
    onOrderChange(newOrder);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.instruction}>
        ☝️ Nhấn mũi tên để sắp xếp đúng thứ tự:
      </Text>
      {orderedItems.map((item, index) => (
        <View key={item.id} style={styles.item}>
          <View style={styles.rank}>
            <Text style={styles.rankText}>{index + 1}</Text>
          </View>
          <Text style={styles.itemText}>{item.text}</Text>
          <View style={styles.arrowButtons}>
            <TouchableOpacity
              onPress={() => moveItem(index, index - 1)}
              disabled={index === 0}
              style={[styles.arrowBtn, index === 0 && { opacity: 0.3 }]}
            >
              <Ionicons name="chevron-up" size={18} color={Theme.colors.primary} />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => moveItem(index, index + 1)}
              disabled={index === orderedItems.length - 1}
              style={[styles.arrowBtn, index === orderedItems.length - 1 && { opacity: 0.3 }]}
            >
              <Ionicons name="chevron-down" size={18} color={Theme.colors.primary} />
            </TouchableOpacity>
          </View>
        </View>
      ))}
    </View>
  );
}

export const DragDropQuestion: React.FC<DragDropQuestionProps> = (props) => {
  if (Platform.OS === 'web') {
    return <WebDragDrop {...props} />;
  }
  return <NativeDragDrop {...props} />;
};

const styles = StyleSheet.create({
  container: {
    gap: 8,
  },
  instruction: {
    fontSize: 13,
    color: Theme.colors.textLight,
    fontStyle: 'italic',
    marginBottom: 8,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Theme.colors.surface,
    borderRadius: Theme.borderRadius.m,
    padding: Theme.spacing.m,
    borderWidth: 1,
    borderColor: Theme.colors.border,
    gap: 10,
    marginBottom: 6,
    userSelect: 'none' as any,
  },
  itemDragging: {
    borderColor: Theme.colors.primary,
    backgroundColor: 'rgba(67, 97, 238, 0.05)',
  },
  dragHandle: {
    padding: 2,
  },
  rank: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rankText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 13,
  },
  itemText: {
    flex: 1,
    fontSize: 15,
    color: Theme.colors.text,
    lineHeight: 20,
  },
  arrowButtons: {
    flexDirection: 'column',
    gap: 2,
  },
  arrowBtn: {
    padding: 4,
  },
});
