import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { ActivityIndicator, Alert, Image, Modal, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Theme } from '../constants/theme';
import { firebaseService } from '../services/firebaseService';
import { CaseSetQuestion } from './interactive/CaseSetQuestion';
import { DragDropQuestion } from './interactive/DragDropQuestion';
import { HotspotQuestion } from './interactive/HotspotQuestion';
import { MatchingQuestion } from './interactive/MatchingQuestion';

export interface QuestionOption {
  id: string;
  text: string;
}

interface QuestionCardProps {
  questionId?: string;
  questionNumber: number;
  totalQuestions: number;
  questionText: string;
  options: QuestionOption[];
  selectedOptionIds: string[];
  onSelectOption: (optionId: string) => void;
  isMultipleChoice?: boolean;
  type?: string;
  mediaUrl?: string;
  interactiveData?: any; // Dữ liệu cho các loại tương tác
  onInteractiveAnswer?: (answer: string[]) => void; // Callback khi có câu trả lời
  showAnswers?: boolean;
  correctAnswers?: string[];
}

export const QuestionCard = React.memo<QuestionCardProps>(({
  questionId,
  questionNumber,
  totalQuestions,
  questionText,
  options,
  selectedOptionIds,
  onSelectOption,
  isMultipleChoice = false,
  type = 'single',
  mediaUrl,
  interactiveData,
  onInteractiveAnswer,
  showAnswers = false,
  correctAnswers = []
}) => {
  const lowerType = (type || '').toLowerCase();
  const isTextBased = lowerType === 'single' || lowerType === 'multiple';

  // Check if Case Set has sub-questions or if this is an expanded sub-question with a scenario
  let subQuestionsExist = false;
  let expandedScenario = '';

  try {
    const parsed = typeof interactiveData === 'string' ? JSON.parse(interactiveData) : (interactiveData || {});
    if (lowerType === 'case_set' && parsed.subQuestions && parsed.subQuestions.length > 0) {
      subQuestionsExist = true;
    }
    if (parsed.scenario && (lowerType !== 'case_set' || !subQuestionsExist)) {
      expandedScenario = parsed.scenario;
    }
    // Prevent double scenario if it's a non-expanded Case Set
    if (subQuestionsExist) {
      expandedScenario = '';
    }
  } catch (e) { }

  // Personal Note States
  const [noteModalVisible, setNoteModalVisible] = useState(false);
  const [noteText, setNoteText] = useState('');
  const [isSavingNote, setIsSavingNote] = useState(false);
  const [isLoadingNote, setIsLoadingNote] = useState(false);

  const handleOpenNote = async () => {
    if (!questionId) {
      Alert.alert('Lỗi', 'Không thể xác định câu hỏi này.');
      return;
    }
    setNoteModalVisible(true);
    setIsLoadingNote(true);
    const existingNote = await firebaseService.getQuestionNote(questionId);
    setNoteText(existingNote || '');
    setIsLoadingNote(false);
  };

  const handleSaveNote = async () => {
    if (!questionId) return;
    setIsSavingNote(true);
    const success = await firebaseService.saveQuestionNote(questionId, noteText);
    setIsSavingNote(false);
    if (success) {
      setNoteModalVisible(false);
    } else {
      Alert.alert('Lỗi', 'Không thể lưu ghi chú, vui lòng thử lại.');
    }
  };

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.questionNumber}>
          Question {questionNumber} of {totalQuestions}
        </Text>
        <View style={styles.headerActions}>
          {questionId && (
            <TouchableOpacity onPress={handleOpenNote} style={styles.noteBtn}>
              <Ionicons name="document-text-outline" size={14} color={Theme.colors.primary} />
              <Text style={styles.noteBtnText}>Ghi chú</Text>
            </TouchableOpacity>
          )}
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{(type || 'single').replace('_', ' ').toUpperCase()}</Text>
          </View>
        </View>
      </View>

      {/* Expanded Case Set Scenario */}
      {expandedScenario ? (
        <View style={styles.scenarioContainer}>
          <View style={styles.scenarioHeader}>
            <Ionicons name="document-text" size={16} color={Theme.colors.primary} />
            <Text style={styles.scenarioTitle}>Tình huống chung:</Text>
          </View>
          <Text style={styles.scenarioText}>{expandedScenario}</Text>
        </View>
      ) : null}

      {/* Question Text (Hide if Case Set has subQuestions to avoid duplication) */}
      {(!subQuestionsExist) && (
        <Text style={styles.questionText}>
          {type === 'case_set' && questionText.toLowerCase().startsWith('tình huống:')
            ? questionText.replace(/tình huống:\s*/i, '❓ ')
            : questionText}
        </Text>
      )}
      {/* Question Image (Only show if not a hotspot question to avoid duplication) */}
      {mediaUrl && lowerType !== 'hotspot' ? (
        <View style={styles.imageContainer}>
          <Image
            source={{ uri: mediaUrl }}
            style={styles.questionImage}
            resizeMode="contain"
            onLoad={() => console.log(`Question Image Loaded [${lowerType}]`)}
            onError={(e) => console.error(`Question Image Load Error [${lowerType}]:`, e.nativeEvent.error)}
          />
        </View>
      ) : null}

      {/* === FILL BLANK === */}
      {type === 'fill_blank' && (
        <View style={styles.interactiveContainer}>
          <Text style={styles.fieldLabel}>Câu trả lời của bạn:</Text>
          <TextInput
            style={[
              styles.fillBlankInput,
              showAnswers && (
                selectedOptionIds[0]?.trim().toLowerCase() === correctAnswers[0]?.trim().toLowerCase()
                  ? styles.inputCorrect : styles.inputError
              )
            ]}
            placeholder="Nhập đáp án tại đây..."
            value={selectedOptionIds[0] || ''}
            onChangeText={(text) => onSelectOption(text)}
            editable={!showAnswers}
          />
          {showAnswers && (
            <Text style={styles.correctLabel}>Đáp án đúng: <Text style={{ fontWeight: 'bold' }}>{correctAnswers[0]}</Text></Text>
          )}
        </View>
      )}

      {/* === DRAG & DROP === */}
      {type === 'drag_drop' && (() => {
        let parsedData: any = {};
        try { parsedData = typeof interactiveData === 'string' ? JSON.parse(interactiveData) : (interactiveData || {}); } catch { }
        const ddItems = parsedData.items || [];
        return ddItems.length > 0 ? (
          <DragDropQuestion
            key={questionId}
            items={ddItems}
            currentOrder={selectedOptionIds}
            onOrderChange={(orderedIds) => {
              if (onInteractiveAnswer) onInteractiveAnswer(orderedIds);
            }}
          />
        ) : (
          <Text style={styles.interactiveSubText}>⚠️ Dữ liệu câu hỏi Kéo-Thả chưa được cấu hình. Admin cần bổ sung danh sách items.</Text>
        );
      })()}

      {/* === HOTSPOT (Click vào vùng ảnh) === */}
      {lowerType === 'hotspot' && (() => {
        let parsedData: any = {};
        try { parsedData = typeof interactiveData === 'string' ? JSON.parse(interactiveData) : (interactiveData || {}); } catch { }
        const zones = parsedData.zones || [];
        const imgUrl = parsedData.imageUrl || mediaUrl || '';
        return zones.length > 0 ? (
          <HotspotQuestion
            key={questionId}
            imageUrl={imgUrl}
            zones={zones}
            selectedZoneId={selectedOptionIds[0] || null}
            onSelectZone={(zoneId) => {
              if (onInteractiveAnswer) onInteractiveAnswer([zoneId]);
            }}
          />
        ) : (
          <Text style={styles.interactiveSubText}>⚠️ Dữ liệu câu hỏi Hotspot chưa được cấu hình. Admin cần bổ sung danh sách zones.</Text>
        );
      })()}

      {/* === MATCHING === */}
      {type === 'matching' && (() => {
        let parsedData: any = {};
        try { parsedData = typeof interactiveData === 'string' ? JSON.parse(interactiveData) : (interactiveData || {}); } catch { }
        const leftItems = parsedData.left || [];
        const rightItems = parsedData.right || [];
        // Convert selectedOptionIds ("L1:R2","L2:R1") to pairs object
        const currentPairs: Record<string, string> = {};
        selectedOptionIds.forEach(pair => {
          const [l, r] = pair.split(':');
          if (l && r) currentPairs[l] = r;
        });
        return leftItems.length > 0 && rightItems.length > 0 ? (
          <MatchingQuestion
            key={questionId}
            leftItems={leftItems}
            rightItems={rightItems}
            currentPairs={currentPairs}
            onPairsChange={(pairs) => {
              const pairStrings = Object.entries(pairs).map(([l, r]) => `${l}:${r}`);
              if (onInteractiveAnswer) onInteractiveAnswer(pairStrings);
            }}
          />
        ) : (
          <Text style={styles.interactiveSubText}>⚠️ Dữ liệu câu hỏi Nối cột chưa được cấu hình. Admin cần bổ sung cột Trái và Phải.</Text>
        );
      })()}

      {/* === CASE SET === */}
      {lowerType === 'case_set' && (() => {
        let parsedData: any = {};
        try {
          parsedData = typeof interactiveData === 'string' ? JSON.parse(interactiveData) : (interactiveData || {});
        } catch (e) { }

        const scenario = parsedData.scenario || '';
        const subQuestions = parsedData.subQuestions || [];

        const subAnswers = (selectedOptionIds && typeof selectedOptionIds === 'object' && !Array.isArray(selectedOptionIds))
          ? selectedOptionIds
          : {};

        return (
          <CaseSetQuestion
            scenario={scenario || 'Đọc tình huống và trả lời câu hỏi.'}
            options={options}
            selectedOptionIds={selectedOptionIds}
            onSelectOption={onSelectOption}
            isMultipleChoice={isMultipleChoice}
            subQuestions={subQuestions}
            subAnswers={subAnswers}
            onSubAnswerChange={(newSubAnswers) => {
              if (onInteractiveAnswer) {
                onInteractiveAnswer(newSubAnswers as any);
              }
            }}
            showAnswers={showAnswers}
            correctAnswers={correctAnswers}
          />
        );
      })()}

      {/* === SINGLE / MULTIPLE === */}
      {isTextBased && (
        <View style={styles.optionsContainer}>
          {options.map((option) => {
            const isSelected = selectedOptionIds.includes(option.id);
            const isCorrect = correctAnswers.includes(option.id);

            let borderColor = Theme.colors.border;
            let bgColor = Theme.colors.surface;

            if (showAnswers) {
              if (isCorrect) {
                borderColor = Theme.colors.success;
                bgColor = 'rgba(38, 194, 129, 0.05)';
              } else if (isSelected && !isCorrect) {
                borderColor = Theme.colors.error;
                bgColor = 'rgba(235, 77, 75, 0.05)';
              }
            } else if (isSelected) {
              borderColor = Theme.colors.primary;
            }

            return (
              <TouchableOpacity
                key={option.id}
                style={[
                  styles.optionButton,
                  { borderColor, backgroundColor: bgColor }
                ]}
                onPress={() => !showAnswers && onSelectOption(option.id)}
                activeOpacity={0.7}
                disabled={showAnswers}
              >
                <View style={[
                  styles.radioIndicator,
                  isMultipleChoice && styles.checkboxIndicator,
                  isSelected && !showAnswers && styles.radioIndicatorSelected,
                  showAnswers && isCorrect && { borderColor: Theme.colors.success, backgroundColor: Theme.colors.success },
                  showAnswers && isSelected && !isCorrect && { borderColor: Theme.colors.error, backgroundColor: Theme.colors.error }
                ]}>
                  {(isSelected || (showAnswers && isCorrect)) && (
                    <Ionicons
                      name={isMultipleChoice ? "checkmark" : (isCorrect || !showAnswers ? "checkmark" : "close")}
                      size={12}
                      color="#fff"
                    />
                  )}
                </View>
                <Text style={[
                  styles.optionText,
                  isSelected && !showAnswers && styles.optionTextSelected,
                  showAnswers && isCorrect && { color: Theme.colors.success, fontWeight: '700' },
                  showAnswers && isSelected && !isCorrect && { color: Theme.colors.error }
                ]}>
                  {option.text}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      )}

      {/* Note Modal */}
      <Modal visible={noteModalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>📝 Ghi chú cá nhân</Text>
              <TouchableOpacity onPress={() => setNoteModalVisible(false)}>
                <Ionicons name="close" size={24} color={Theme.colors.text} />
              </TouchableOpacity>
            </View>

            {isLoadingNote ? (
              <ActivityIndicator size="large" color={Theme.colors.primary} style={{ marginVertical: 20 }} />
            ) : (
              <TextInput
                style={styles.noteInput}
                multiline
                numberOfLines={6}
                placeholder="Nhập ghi chú, mẹo ghi nhớ hoặc lưu ý cho câu hỏi này..."
                value={noteText}
                onChangeText={setNoteText}
                textAlignVertical="top"
              />
            )}

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setNoteModalVisible(false)}>
                <Text style={styles.cancelBtnText}>Hủy</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.saveBtn, isSavingNote && { opacity: 0.7 }]}
                onPress={handleSaveNote}
                disabled={isSavingNote || isLoadingNote}
              >
                <Text style={styles.saveBtnText}>{isSavingNote ? 'Đang lưu...' : 'Lưu ghi chú'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
});

const styles = StyleSheet.create({
  card: {
    backgroundColor: Theme.colors.card,
    borderRadius: Theme.borderRadius.l,
    padding: Theme.spacing.l,
    shadowColor: Theme.colors.shadow,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
    marginBottom: Theme.spacing.l,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Theme.spacing.m,
  },
  questionNumber: {
    color: Theme.colors.textLight,
    fontSize: Theme.typography.caption.fontSize,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  badge: {
    backgroundColor: 'rgba(67, 97, 238, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  badgeText: {
    color: Theme.colors.primary,
    fontSize: 10,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  questionText: {
    color: Theme.colors.text,
    fontSize: Theme.typography.h3.fontSize,
    fontWeight: '600',
    lineHeight: 28,
    marginBottom: Theme.spacing.xl,
  },
  optionsContainer: {
    gap: Theme.spacing.m,
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Theme.spacing.m,
    borderRadius: Theme.borderRadius.m,
    borderWidth: 1,
    borderColor: Theme.colors.border,
    backgroundColor: Theme.colors.surface,
  },
  optionButtonSelected: {
    borderColor: Theme.colors.primary,
    backgroundColor: 'rgba(67, 97, 238, 0.05)',
  },
  radioIndicator: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: Theme.colors.border,
    marginRight: Theme.spacing.m,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxIndicator: {
    borderRadius: 4,
  },
  radioIndicatorSelected: {
    borderColor: Theme.colors.primary,
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Theme.colors.primary,
  },
  checkboxInner: {
    width: 12,
    height: 12,
    borderRadius: 2,
    backgroundColor: Theme.colors.primary,
  },
  optionText: {
    flex: 1,
    fontSize: Theme.typography.body.fontSize,
    color: Theme.colors.text,
  },
  optionTextSelected: {
    fontWeight: '600',
    color: Theme.colors.primary,
  },
  imageContainer: {
    width: '100%',
    backgroundColor: '#f9f9f9',
    borderRadius: Theme.borderRadius.m,
    marginBottom: Theme.spacing.l,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Theme.colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scenarioContainer: {
    backgroundColor: 'rgba(67, 97, 238, 0.05)',
    padding: Theme.spacing.m,
    borderRadius: Theme.borderRadius.m,
    marginBottom: Theme.spacing.m,
    borderLeftWidth: 4,
    borderLeftColor: Theme.colors.primary,
  },
  scenarioHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  scenarioTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: Theme.colors.primary,
  },
  scenarioText: {
    fontSize: 15,
    color: Theme.colors.text,
    lineHeight: 22,
  },
  questionImage: {
    width: '100%',
    height: 300,
    minHeight: 200,
  },
  interactivePlaceholder: {
    backgroundColor: '#fff3cd',
    padding: Theme.spacing.l,
    borderRadius: Theme.borderRadius.m,
    borderLeftWidth: 4,
    borderLeftColor: '#ffc107',
    marginBottom: Theme.spacing.l,
  },
  interactivePlaceholderText: {
    color: '#856404',
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  interactiveSubText: {
    color: '#856404',
    fontSize: 12,
    fontStyle: 'italic',
    lineHeight: 18,
  },
  placeholderHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  interactiveContainer: {
    marginTop: Theme.spacing.m,
    padding: Theme.spacing.m,
    backgroundColor: 'rgba(67, 97, 238, 0.05)',
    borderRadius: Theme.borderRadius.m,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: Theme.colors.text,
  },
  fillBlankInput: {
    backgroundColor: Theme.colors.surface,
    borderWidth: 1.5,
    borderColor: Theme.colors.border,
    borderRadius: Theme.borderRadius.m,
    padding: Theme.spacing.m,
    fontSize: 16,
    color: Theme.colors.text,
  },
  inputCorrect: {
    borderColor: Theme.colors.success,
    backgroundColor: 'rgba(38, 194, 129, 0.05)',
  },
  inputError: {
    borderColor: Theme.colors.error,
    backgroundColor: 'rgba(235, 77, 75, 0.05)',
  },
  correctLabel: {
    marginTop: 8,
    color: Theme.colors.success,
    fontSize: 14,
  },

  // Note Button & Modal Styles
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  noteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(67, 97, 238, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    gap: 4,
  },
  noteBtnText: {
    color: Theme.colors.primary,
    fontSize: 12,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: Theme.spacing.l,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: Theme.borderRadius.l,
    padding: Theme.spacing.l,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Theme.spacing.m,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Theme.colors.text,
  },
  noteInput: {
    borderWidth: 1,
    borderColor: Theme.colors.border,
    borderRadius: Theme.borderRadius.m,
    padding: Theme.spacing.m,
    fontSize: 16,
    color: Theme.colors.text,
    backgroundColor: '#fafafa',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: Theme.spacing.l,
  },
  cancelBtn: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: Theme.borderRadius.s,
    borderWidth: 1,
    borderColor: Theme.colors.border,
  },
  cancelBtnText: {
    color: Theme.colors.textLight,
    fontWeight: '600',
  },
  saveBtn: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: Theme.borderRadius.s,
    backgroundColor: Theme.colors.primary,
  },
  saveBtnText: {
    color: '#fff',
    fontWeight: '600',
  }
});
