import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Theme } from '../constants/theme';

export interface QuestionOption {
  id: string;
  text: string;
}

interface QuestionCardProps {
  questionNumber: number;
  totalQuestions: number;
  questionText: string;
  options: QuestionOption[];
  selectedOptionIds: string[];
  onSelectOption: (optionId: string) => void;
  isMultipleChoice?: boolean;
}

export const QuestionCard: React.FC<QuestionCardProps> = ({
  questionNumber,
  totalQuestions,
  questionText,
  options,
  selectedOptionIds,
  onSelectOption,
  isMultipleChoice = false,
}) => {
  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.questionNumber}>
          Question {questionNumber} of {totalQuestions}
        </Text>
        {isMultipleChoice && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>Multiple Answers</Text>
          </View>
        )}
      </View>
      
      <Text style={styles.questionText}>{questionText}</Text>
      
      <View style={styles.optionsContainer}>
        {options.map((option) => {
          const isSelected = selectedOptionIds.includes(option.id);
          
          return (
            <TouchableOpacity
              key={option.id}
              style={[
                styles.optionButton,
                isSelected && styles.optionButtonSelected
              ]}
              onPress={() => onSelectOption(option.id)}
              activeOpacity={0.7}
            >
              <View style={[
                styles.radioIndicator,
                isMultipleChoice && styles.checkboxIndicator,
                isSelected && styles.radioIndicatorSelected
              ]}>
                {isSelected && <View style={isMultipleChoice ? styles.checkboxInner : styles.radioInner} />}
              </View>
              <Text style={[
                styles.optionText,
                isSelected && styles.optionTextSelected
              ]}>
                {option.text}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

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
});
