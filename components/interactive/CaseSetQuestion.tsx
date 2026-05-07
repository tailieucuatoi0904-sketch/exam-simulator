import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Theme } from '../../constants/theme';
import { Ionicons } from '@expo/vector-icons';

interface QuestionOption {
  id: string;
  text: string;
}

interface CaseSetQuestionProps {
  scenario: string;
  options: QuestionOption[];
  selectedOptionIds: string[];
  onSelectOption: (optionId: string) => void;
  isMultipleChoice?: boolean;
  subIndex?: string; // e.g. "1/2"
  subQuestions?: any[];
  onSubAnswerChange?: (subAnswers: Record<string, string[]>) => void;
  subAnswers?: Record<string, string[]>;
  showAnswers?: boolean;
  correctAnswers?: string[];
}

export const CaseSetQuestion: React.FC<CaseSetQuestionProps> = ({
  scenario,
  options,
  selectedOptionIds,
  onSelectOption,
  isMultipleChoice = false,
  subIndex,
  subQuestions = [],
  onSubAnswerChange,
  subAnswers = {},
  showAnswers = false,
}) => {
  return (
    <View style={styles.container}>
      {/* Scenario box — shared context */}
      <View style={styles.scenarioBox}>
        <View style={styles.scenarioHeader}>
          <Ionicons name="document-text" size={16} color={Theme.colors.primary} />
          <Text style={styles.scenarioTitle}>
            📋 Tình huống{subIndex ? ` (câu ${subIndex})` : ''}
          </Text>
        </View>
        <Text style={styles.scenarioText}>{scenario}</Text>
      </View>

      {/* Standard Case Set (Legacy/Single) */}
      {!subQuestions || subQuestions.length === 0 ? (
        <>
          <Text style={styles.questionNote}>
            {isMultipleChoice
              ? '📌 Nhiều đáp án — Chọn tất cả đáp án đúng dựa vào tình huống trên.'
              : '📌 Dựa vào tình huống trên, chọn một đáp án tốt nhất.'}
          </Text>

          <View style={styles.optionsContainer}>
            {options.map((option) => {
              const isSelected = selectedOptionIds.includes(option.id);
              return (
                <TouchableOpacity
                  key={option.id}
                  style={[styles.optionBtn, isSelected && styles.optionBtnSelected]}
                  onPress={() => onSelectOption(option.id)}
                  activeOpacity={0.7}
                  disabled={showAnswers}
                >
                  <View style={[
                    styles.indicator,
                    isMultipleChoice && styles.checkboxIndicator,
                    isSelected && styles.indicatorSelected,
                  ]}>
                    {isSelected && (
                      <View style={isMultipleChoice ? styles.checkboxInner : styles.radioInner} />
                    )}
                  </View>
                  <Text style={[styles.optionText, isSelected && styles.optionTextSelected]}>
                    {option.text}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </>
      ) : (
        /* Complex Case Set (With Sub-questions) */
        <View style={styles.subQuestionsWrapper}>
          {subQuestions.map((sq, idx) => (
            <View key={sq.id} style={styles.subQuestionCard}>
              <Text style={styles.subQuestionText}>
                <Text style={{ fontWeight: 'bold', color: Theme.colors.primary }}>Câu {idx + 1}:</Text> {sq.questionText}
              </Text>
              <View style={styles.subOptionsGrid}>
                {(sq.options || []).map((opt: any) => {
                  const currentAnswers = subAnswers[sq.id] || [];
                  const isSelected = currentAnswers.includes(opt.id);
                  const isCorrect = (sq.correctAnswers || []).includes(opt.id);
                  const isMulti = (sq.correctAnswers || []).length > 1;

                  let borderColor = Theme.colors.border;
                  let bgColor = '#fafafa';
                  
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
                    bgColor = 'rgba(67, 97, 238, 0.05)';
                  }

                  return (
                    <TouchableOpacity
                      key={opt.id}
                      style={[styles.subOptionBtn, { borderColor, backgroundColor: bgColor }]}
                      disabled={showAnswers}
                      onPress={() => {
                        if (!onSubAnswerChange) return;
                        let newAnswers = [...currentAnswers];
                        if (isMulti) {
                          newAnswers = isSelected ? newAnswers.filter(a => a !== opt.id) : [...newAnswers, opt.id];
                        } else {
                          newAnswers = [opt.id];
                        }
                        onSubAnswerChange({ ...subAnswers, [sq.id]: newAnswers });
                      }}
                    >
                      <View style={[
                        styles.subIndicator,
                        isMulti && { borderRadius: 4 },
                        isSelected && !showAnswers && { backgroundColor: Theme.colors.primary, borderColor: Theme.colors.primary },
                        showAnswers && isCorrect && { backgroundColor: Theme.colors.success, borderColor: Theme.colors.success },
                        showAnswers && isSelected && !isCorrect && { backgroundColor: Theme.colors.error, borderColor: Theme.colors.error }
                      ]}>
                        <Text style={[styles.subIndicatorLabel, (isSelected || (showAnswers && isCorrect)) && { color: '#fff' }]}>
                          {opt.id}
                        </Text>
                      </View>
                      <Text style={[
                        styles.subOptionText, 
                        isSelected && !showAnswers && { color: Theme.colors.primary, fontWeight: '600' },
                        showAnswers && isCorrect && { color: Theme.colors.success, fontWeight: '700' },
                        showAnswers && isSelected && !isCorrect && { color: Theme.colors.error }
                      ]}>
                        {opt.text}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
              {showAnswers && sq.explanation && (
                <View style={styles.subExplanation}>
                  <Text style={styles.subExplanationText}>💡 {sq.explanation}</Text>
                </View>
              )}
            </View>
          ))}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: 14,
  },
  scenarioBox: {
    backgroundColor: 'rgba(67, 97, 238, 0.04)',
    borderRadius: Theme.borderRadius.m,
    padding: Theme.spacing.l,
    borderLeftWidth: 4,
    borderLeftColor: Theme.colors.primary,
    borderWidth: 1,
    borderColor: 'rgba(67, 97, 238, 0.15)',
  },
  scenarioHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  scenarioTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    color: Theme.colors.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  scenarioText: {
    fontSize: 14,
    color: Theme.colors.text,
    lineHeight: 22,
  },
  questionNote: {
    fontSize: 12,
    color: Theme.colors.textLight,
    fontStyle: 'italic',
    backgroundColor: 'rgba(0,0,0,0.03)',
    padding: 8,
    borderRadius: Theme.borderRadius.s,
  },
  optionsContainer: {
    gap: Theme.spacing.m,
  },
  optionBtn: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: Theme.spacing.m,
    borderRadius: Theme.borderRadius.m,
    borderWidth: 1,
    borderColor: Theme.colors.border,
    backgroundColor: Theme.colors.surface,
    gap: 10,
  },
  optionBtnSelected: {
    borderColor: Theme.colors.primary,
    backgroundColor: 'rgba(67, 97, 238, 0.05)',
  },
  indicator: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: Theme.colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    marginTop: 1,
  },
  checkboxIndicator: {
    borderRadius: 4,
  },
  indicatorSelected: {
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
    fontSize: 14,
    color: Theme.colors.text,
    lineHeight: 20,
  },
  optionTextSelected: {
    color: Theme.colors.primary,
    fontWeight: '500',
  },
  subQuestionsWrapper: {
    gap: 20,
    marginTop: 10,
  },
  subQuestionCard: {
    backgroundColor: '#fff',
    borderRadius: Theme.borderRadius.m,
    padding: Theme.spacing.l,
    borderWidth: 1,
    borderColor: Theme.colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  subQuestionText: {
    fontSize: 15,
    color: Theme.colors.text,
    lineHeight: 22,
    marginBottom: 16,
  },
  subOptionsGrid: {
    gap: 10,
  },
  subOptionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Theme.colors.border,
    backgroundColor: '#fafafa',
  },
  subIndicator: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: Theme.colors.border,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  subIndicatorLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    color: Theme.colors.textLight,
  },
  subOptionText: {
    flex: 1,
    fontSize: 14,
    color: Theme.colors.text,
  },
  subExplanation: {
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
  },
  subExplanationText: {
    fontSize: 13,
    color: Theme.colors.textLight,
    fontStyle: 'italic',
    lineHeight: 18,
  },
});
