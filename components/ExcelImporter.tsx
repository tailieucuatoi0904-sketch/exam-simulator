import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, Platform } from 'react-native';
import * as XLSX from 'xlsx';
import { Theme } from '../constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { Question } from '../services/types';

interface ExcelImporterProps {
  onDataImported: (questions: Question[]) => void;
}

export const ExcelImporter: React.FC<ExcelImporterProps> = ({ onDataImported }) => {
  const [loading, setLoading] = useState(false);

  const handleFileUpload = (event: any) => {
    const file = event.target.files[0];
    if (!file) return;

    setLoading(true);
    const reader = new FileReader();
    
    reader.onload = (e: any) => {
      try {
        const bstr = e.target.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json(ws);
        
        // Transform Excel data to PMP Question format
        const importedQuestions: Question[] = data.map((row: any, index: number) => {
          // Giả định các cột trong Excel: Domain, Task, Question, A, B, C, D, Correct, Explanation, Type
          return {
            id: `imported-${Date.now()}-${index}`,
            domain: row['Domain'] || 'General',
            ecoTask: row['Task'] || 'General Task',
            questionText: row['Question'] || '',
            options: [
              { id: 'A', text: row['A'] || '' },
              { id: 'B', text: row['B'] || '' },
              { id: 'C', text: row['C'] || '' },
              { id: 'D', text: row['D'] || '' },
            ],
            correctAnswers: (row['Correct'] || '').split(',').map((s: string) => s.trim()),
            explanation: row['Explanation'] || '',
            type: (row['Type'] || 'single').toLowerCase() === 'multiple' ? 'multiple' : 'single',
          };
        });

        onDataImported(importedQuestions);
        Alert.alert('Thành công', `Đã import thành công ${importedQuestions.length} câu hỏi.`);
      } catch (error) {
        console.error(error);
        Alert.alert('Lỗi', 'Định dạng file không hợp lệ hoặc có lỗi khi đọc file.');
      } finally {
        setLoading(false);
      }
    };

    reader.readAsBinaryString(file);
  };

  const downloadTemplate = () => {
    const templateData = [
      {
        Domain: 'People',
        Task: 'Manage conflicts',
        Question: 'Một xung đột xảy ra giữa hai thành viên, bạn nên làm gì?',
        A: 'Phớt lờ nó',
        B: 'Giải quyết ngay lập tức',
        C: 'Báo cáo cấp trên',
        D: 'Kỷ luật cả hai',
        Correct: 'B',
        Explanation: 'Xung đột nên được giải quyết trực tiếp và sớm.',
        Type: 'single'
      }
    ];

    const ws = XLSX.utils.json_to_sheet(templateData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Template");
    XLSX.writeFile(wb, "PMP_Question_Template.xlsx");
  };

  const triggerPicker = () => {
    if (Platform.OS === 'web') {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = '.xlsx, .xls';
      input.onchange = handleFileUpload;
      input.click();
    } else {
      Alert.alert('Thông báo', 'Tính năng Import Excel hiện chỉ hỗ trợ trên nền tảng Web.');
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity 
        style={[styles.importBtn, loading && styles.disabled]} 
        onPress={triggerPicker}
        disabled={loading}
      >
        <Ionicons name="cloud-upload-outline" size={20} color={Theme.colors.textInverse} />
        <Text style={styles.importBtnText}>
          {loading ? 'Đang xử lý...' : 'Import từ Excel (.xlsx)'}
        </Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={downloadTemplate}>
        <Text style={styles.hint}>Tải file mẫu để biết định dạng chuẩn</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: Theme.spacing.m,
    alignItems: 'center',
  },
  importBtn: {
    backgroundColor: Theme.colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: Theme.borderRadius.m,
    width: '100%',
    justifyContent: 'center',
  },
  disabled: { opacity: 0.6 },
  importBtnText: {
    color: Theme.colors.textInverse,
    fontWeight: 'bold',
    fontSize: 16,
  },
  hint: {
    marginTop: 8,
    fontSize: 12,
    color: Theme.colors.textLight,
    textDecorationLine: 'underline',
  },
});
