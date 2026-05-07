import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, Platform, ActivityIndicator, ScrollView } from 'react-native';
import * as XLSX from 'xlsx';
import { Theme } from '../constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { Question } from '../services/types';
import { CustomButton } from './CustomButton';

interface ExcelImporterProps {
  onDataImported: (questions: Question[]) => void;
  existingQuestions?: Question[];
}

export const ExcelImporter: React.FC<ExcelImporterProps> = ({ onDataImported, existingQuestions = [] }) => {
  const [loading, setLoading] = useState(false);
  const [previewData, setPreviewData] = useState<Question[] | null>(null);
  const [summary, setSummary] = useState({ total: 0, new: 0, duplicates: 0, errors: 0 });

  const validateRow = (row: any) => {
    // Với single/multiple thì cần A,B,C,D. Với các loại khác thì chỉ cần Question và Correct
    const type = String(row['Type'] || 'single').toLowerCase();
    const isTextType = type === 'single' || type === 'multiple';
    const requiredColumns = isTextType ? ['Question', 'A', 'B', 'C', 'D', 'Correct'] : ['Question', 'Correct'];
    const missing = requiredColumns.filter(col => !row[col]);
    return missing.length === 0;
  };

  const isDuplicate = (newQuestion: string) => {
    return existingQuestions.some(q => 
      q.questionText.trim().toLowerCase() === newQuestion.trim().toLowerCase()
    );
  };

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
        
        let newCount = 0;
        let duplicateCount = 0;
        let errorCount = 0;
        
        const validatedQuestions: Question[] = [];

        data.forEach((row: any, index: number) => {
          if (!validateRow(row)) {
            errorCount++;
            return;
          }

          const qText = String(row['Question']);
          if (isDuplicate(qText)) {
            duplicateCount++;
            return;
          }

          newCount++;
          const rowType = (String(row['Type'] || 'single')).toLowerCase();
          
          validatedQuestions.push({
            id: `imported-${Date.now()}-${index}`,
            domain: row['Domain'] || 'General',
            ecoTask: row['ECO_Task'] || row['Task'] || 'General Task',
            questionText: qText,
            options: [
              { id: 'A', text: String(row['A'] || '') },
              { id: 'B', text: String(row['B'] || '') },
              { id: 'C', text: String(row['C'] || '') },
              { id: 'D', text: String(row['D'] || '') },
            ],
            correctAnswers: (String(row['Correct'] || '')).split(',').map((s: string) => s.trim().toUpperCase()),
            explanation: String(row['Explanation'] || ''),
            type: rowType as any,
            mediaUrl: row['MediaURL'] || row['ImageURL'] || '',
            interactiveData: row['InteractiveData'] || '',
          });
        });

        setSummary({ total: data.length, new: newCount, duplicates: duplicateCount, errors: errorCount });
        setPreviewData(validatedQuestions);
        
        if (newCount === 0 && errorCount === 0) {
          Alert.alert('Thông báo', 'Tất cả câu hỏi trong file đều đã tồn tại trong hệ thống.');
        }
      } catch (error) {
        console.error(error);
        Alert.alert('Lỗi', 'Có lỗi khi đọc file Excel. Vui lòng kiểm tra lại định dạng.');
      } finally {
        setLoading(false);
      }
    };

    reader.readAsBinaryString(file);
  };

  const confirmImport = () => {
    if (previewData && previewData.length > 0) {
      onDataImported(previewData);
      setPreviewData(null);
    }
  };

  const downloadTemplate = () => {
    const templateData = [
      {
        Domain: 'People',
        ECO_Task: 'Manage conflicts',
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

  if (previewData) {
    return (
      <View style={styles.previewContainer}>
        <View style={styles.summaryBox}>
          <Text style={styles.summaryTitle}>📊 Tóm tắt dữ liệu</Text>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryText}>Tổng cộng: {summary.total}</Text>
            <Text style={[styles.summaryText, { color: Theme.colors.primary }]}>Mới: {summary.new}</Text>
            <Text style={[styles.summaryText, { color: Theme.colors.warning }]}>Trùng: {summary.duplicates}</Text>
            {summary.errors > 0 && <Text style={[styles.summaryText, { color: Theme.colors.error }]}>Lỗi: {summary.errors}</Text>}
          </View>
        </View>

        <Text style={styles.previewTitle}>Xem trước 3 câu đầu tiên:</Text>
        <ScrollView style={styles.previewList}>
          {previewData.slice(0, 3).map((q, idx) => (
            <View key={idx} style={styles.previewItem}>
              <Text style={styles.previewQText} numberOfLines={2}>{idx + 1}. {q.questionText}</Text>
              <Text style={styles.previewDetails}>{q.domain} • Đáp án: {q.correctAnswers.join(',')}</Text>
            </View>
          ))}
        </ScrollView>

        <View style={styles.actionRow}>
          <CustomButton 
            title="Hủy bỏ" 
            type="outline" 
            onPress={() => setPreviewData(null)} 
            style={{ flex: 1 }} 
          />
          <CustomButton 
            title={`Xác nhận nhập ${summary.new} câu`} 
            onPress={confirmImport} 
            style={{ flex: 2 }} 
            disabled={summary.new === 0}
          />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.uploadCard}>
        <Ionicons name="cloud-upload" size={48} color={Theme.colors.primary} style={{ marginBottom: 12 }} />
        <Text style={styles.uploadTitle}>Cập nhật Kho Câu hỏi</Text>
        <Text style={styles.uploadSubtitle}>Hỗ trợ file Excel (.xlsx, .xls)</Text>
        
        {loading ? (
          <ActivityIndicator size="large" color={Theme.colors.primary} style={{ marginVertical: 20 }} />
        ) : (
          <CustomButton 
            title="Chọn file từ máy tính" 
            onPress={triggerPicker} 
            style={styles.mainBtn}
          />
        )}

        <TouchableOpacity onPress={downloadTemplate} style={styles.templateLink}>
          <Ionicons name="download-outline" size={16} color={Theme.colors.primary} />
          <Text style={styles.templateText}>Tải file Excel mẫu tại đây</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: Theme.spacing.m,
  },
  uploadCard: {
    backgroundColor: '#fff',
    borderRadius: Theme.borderRadius.xl,
    padding: Theme.spacing.xl,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(67, 97, 238, 0.1)',
    borderStyle: 'dashed',
  },
  uploadTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: Theme.colors.text,
    marginBottom: 4,
  },
  uploadSubtitle: {
    fontSize: 14,
    color: Theme.colors.textLight,
    marginBottom: Theme.spacing.xl,
  },
  mainBtn: {
    width: '100%',
    height: 56,
  },
  templateLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: Theme.spacing.xl,
  },
  templateText: {
    fontSize: 13,
    color: Theme.colors.primary,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  // Preview styles
  previewContainer: {
    padding: Theme.spacing.m,
    backgroundColor: '#fff',
    borderRadius: Theme.borderRadius.xl,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 5,
  },
  summaryBox: {
    backgroundColor: 'rgba(67, 97, 238, 0.05)',
    padding: Theme.spacing.m,
    borderRadius: Theme.borderRadius.m,
    marginBottom: Theme.spacing.l,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Theme.colors.text,
    marginBottom: 8,
  },
  summaryRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  summaryText: {
    fontSize: 13,
    fontWeight: '600',
  },
  previewTitle: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: Theme.spacing.s,
    color: Theme.colors.textLight,
  },
  previewList: {
    maxHeight: 200,
    marginBottom: Theme.spacing.l,
  },
  previewItem: {
    padding: Theme.spacing.s,
    borderBottomWidth: 1,
    borderBottomColor: Theme.colors.border,
  },
  previewQText: {
    fontSize: 14,
    color: Theme.colors.text,
    marginBottom: 2,
  },
  previewDetails: {
    fontSize: 11,
    color: Theme.colors.textLight,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 12,
  }
});
