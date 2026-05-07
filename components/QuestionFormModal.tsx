/**
 * QuestionFormModal - Shared component for creating/editing questions.
 * Used in both question-management and assignments screens.
 */
import React, { useState, useRef } from 'react';
import {
  Modal, View, Text, ScrollView, TextInput,
  TouchableOpacity, StyleSheet, Image, ActivityIndicator, Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Theme } from '../constants/theme';
import { Question } from '../services/types';

interface QuestionFormModalProps {
  question: Question | null;
  onChange: (q: Question) => void;
  onSave: (q: Question) => void;
  onClose: () => void;
  title?: string;
}

export const QuestionFormModal: React.FC<QuestionFormModalProps> = ({
  question,
  onChange,
  onSave,
  onClose,
  title = 'Chỉnh sửa câu hỏi',
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const fileInputRef = useRef<any>(null);
  const set = (patch: Partial<Question>) => {
    if (!question) return;
    onChange({ ...question, ...patch } as Question);
  };

  const setInteractiveData = (newData: any) => {
    // Luôn giữ lại dữ liệu cũ nếu newData bị lỗi hoặc thiếu hụt không mong muốn
    if (!newData) return;
    set({ interactiveData: JSON.stringify(newData) });
  };

  const handleSave = () => {
    if (!question) return;
    const newErrors: Record<string, string> = {};

    // 1. Kiểm tra chung
    if (!question.questionText?.trim()) {
      newErrors.questionText = 'Vui lòng nhập nội dung câu hỏi hoặc tiêu đề.';
    }
    if (!question.domain?.trim()) {
      newErrors.domain = 'Vui lòng nhập Domain.';
    }
    if (!question.ecoTask?.trim()) {
      newErrors.ecoTask = 'Vui lòng nhập ECO Task.';
    }

    // 2. Kiểm tra theo loại câu hỏi
    if (question.type === 'single' || question.type === 'multiple') {
      const emptyOpt = question.options?.some(o => !o.text.trim());
      if (emptyOpt) newErrors.options = 'Vui lòng điền đầy đủ nội dung các lựa chọn A, B, C, D.';
      if (!question.correctAnswers || question.correctAnswers.length === 0 || !question.correctAnswers[0]) {
        newErrors.correctAnswers = 'Vui lòng nhập đáp án đúng.';
      }
    } else if (question.type === 'case_set') {
      try {
        const data = typeof question.interactiveData === 'string' ? JSON.parse(question.interactiveData) : question.interactiveData;
        if (!data?.subQuestions || data.subQuestions.length === 0) {
          newErrors.caseSet = 'Vui lòng tạo ít nhất một câu hỏi con.';
        } else {
          const invalidSub = data.subQuestions.some((sq: any) => !sq.questionText?.trim() || sq.options?.some((o: any) => !o.text.trim()) || !sq.correctAnswers?.[0]);
          if (invalidSub) newErrors.caseSet = 'Vui lòng điền đầy đủ nội dung, lựa chọn và đáp án cho mọi câu hỏi con.';
        }
      } catch {
        newErrors.caseSet = 'Lỗi dữ liệu Case Set.';
      }
    } else if (['drag_drop', 'hotspot', 'matching', 'fill_blank'].includes(question.type)) {
      if (!question.correctAnswers || question.correctAnswers.length === 0 || !question.correctAnswers[0]) {
        newErrors.correctAnswers = 'Vui lòng cấu hình đáp án đúng.';
      }
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      // Cuộn lên đầu hoặc hiện Alert để Admin biết
      return;
    }

    setErrors({});
    onSave(question);
  };

  const getParsedInteractive = (defaultVal: any) => {
    if (!question) return defaultVal;
    try {
      return typeof question.interactiveData === 'string'
        ? JSON.parse(question.interactiveData)
        : (question.interactiveData || defaultVal);
    } catch { return defaultVal; }
  };

  const handleClose = () => {
    if (Platform.OS === 'web') {
      if (window.confirm('Đóng trình chỉnh sửa? Các thay đổi chưa lưu sẽ bị mất.')) {
        onClose();
      }
    } else {
      Alert.alert('Xác nhận', 'Đóng trình chỉnh sửa và hủy các thay đổi?', [
        { text: 'Tiếp tục sửa', style: 'cancel' },
        { text: 'Đóng', style: 'destructive', onPress: onClose }
      ]);
    }
  };

  return (
    <Modal visible={!!question} animationType="slide" transparent>
      <View style={s.overlay}>
        <View style={s.content}>
          {/* Header */}
          <View style={s.header}>
            <Text style={s.title}>{title}</Text>
            <TouchableOpacity onPress={handleClose}>
              <Ionicons name="close" size={24} color={Theme.colors.text} />
            </TouchableOpacity>
          </View>

          <ScrollView style={s.scroll} keyboardShouldPersistTaps="handled">
            {/* Question type chips */}
            <Text style={s.label}>Loại câu hỏi</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 10 }}>
              {(['single', 'multiple', 'drag_drop', 'hotspot', 'matching', 'case_set', 'fill_blank'] as const).map(t => (
                <TouchableOpacity
                  key={t}
                  style={[s.chip, question?.type === t && s.chipActive]}
                  onPress={() => set({ type: t })}
                >
                  <Text style={[s.chipText, question?.type === t && s.chipTextActive]}>{t}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Question text / title */}
            {question?.type === 'case_set' ? (
              <>
                <Text style={[s.label, errors.questionText && { color: Theme.colors.error }]}>Tiêu đề nhận diện (Admin only)</Text>
                <Text style={s.hint}>⚠️ Học viên KHÔNG thấy trường này, chỉ dùng để quản lý.</Text>
                <TextInput
                  style={[s.input, errors.questionText && s.inputError]}
                  value={question?.questionText}
                  onChangeText={(v) => {
                    set({ questionText: v });
                    if (errors.questionText) setErrors(prev => ({ ...prev, questionText: '' }));
                  }}
                  placeholder="VD: Case Study - Project XYZ (2 câu)"
                />
                {errors.questionText && <Text style={s.errorText}>{errors.questionText}</Text>}
                {__DEV__ && (
                  <TouchableOpacity 
                    onPress={() => Alert.alert('Raw Data', question?.interactiveData || 'Empty')}
                    style={{ marginTop: 4 }}
                  >
                    <Text style={{ fontSize: 10, color: Theme.colors.textLight }}>[Debug] Xem JSON gốc</Text>
                  </TouchableOpacity>
                )}
              </>
            ) : (
              <>
                <Text style={[s.label, errors.questionText && { color: Theme.colors.error }]}>📝 Nội dung câu hỏi (Đề bài)</Text>
                {question?.type === 'case_set' ? (
                  <Text style={s.hint}>Với loại Case Set, vui lòng nhập nội dung câu hỏi chi tiết trong phần Câu hỏi con bên dưới.</Text>
                ) : (
                  <>
                    <TextInput
                      style={[s.input, s.textArea, errors.questionText && s.inputError]}
                      multiline
                      value={question?.questionText || ''}
                      onChangeText={(v) => {
                        set({ questionText: v });
                        if (errors.questionText) setErrors(prev => ({ ...prev, questionText: '' }));
                      }}
                      placeholder="Nhập nội dung câu hỏi..."
                    />
                    {errors.questionText && <Text style={s.errorText}>{errors.questionText}</Text>}
                  </>
                )}
              </>
            )}

            {/* --- Image Upload (Dành cho mọi loại câu hỏi) --- */}
            {(['single', 'multiple', 'fill_blank', 'hotspot', 'drag_drop', 'matching', 'case_set'].includes(question?.type || '')) && (
              <>
                <Text style={s.label}>Hình ảnh đính kèm (không bắt buộc)</Text>
                {/* Preview ảnh nếu đã có URL */}
                {question?.mediaUrl ? (
                  <View style={s.imgPreviewWrap}>
                    <Image source={{ uri: question.mediaUrl }} style={s.imgPreview} resizeMode="contain" />
                    <TouchableOpacity
                      style={s.imgRemoveBtn}
                      onPress={() => set({ mediaUrl: '' })}
                    >
                      <Ionicons name="close-circle" size={22} color={Theme.colors.error} />
                    </TouchableOpacity>
                  </View>
                ) : null}

                {/* Nút upload */}
                {Platform.OS === 'web' ? (
                  <View style={s.uploadRow}>
                    {/* Input file ẩn (chỉ hoạt động trên web) */}
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      style={{ display: 'none' }}
                      onChange={async (e: any) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        
                        // Kiểm tra kích thước file (Base64 làm tăng size 33%, nên giới hạn < 1MB cho an toàn database)
                        if (file.size > 1024 * 1024) {
                          alert('Ảnh quá lớn (vượt quá 1MB). Vui lòng chọn ảnh nhỏ hơn hoặc nén ảnh lại.');
                          return;
                        }

                        setIsUploading(true);
                        try {
                          const reader = new FileReader();
                          reader.onload = (event: any) => {
                            const base64 = event.target.result;
                            set({ mediaUrl: base64 });
                            setIsUploading(false);
                          };
                          reader.onerror = (err) => {
                            console.error('FileReader error:', err);
                            alert('Lỗi khi đọc file ảnh.');
                            setIsUploading(false);
                          };
                          reader.readAsDataURL(file);
                        } catch (err: any) {
                          console.error('Base64 conversion error:', err);
                          alert('Lỗi xử lý ảnh.');
                          setIsUploading(false);
                        }
                        // Reset input để có thể chọn lại cùng file
                        e.target.value = '';
                      }}
                    />
                    <TouchableOpacity
                      style={[s.uploadBtn, isUploading && s.uploadBtnDisabled]}
                      onPress={() => !isUploading && fileInputRef.current?.click()}
                      disabled={isUploading}
                    >
                      {isUploading ? (
                        <ActivityIndicator size="small" color="#fff" />
                      ) : (
                        <Ionicons name="cloud-upload-outline" size={18} color="#fff" />
                      )}
                      <Text style={s.uploadBtnText}>
                        {isUploading ? 'Đang tải lên...' : question?.mediaUrl ? 'Thay ảnh khác' : 'Chọn ảnh từ máy'}
                      </Text>
                    </TouchableOpacity>
                    {question?.mediaUrl ? (
                      <TouchableOpacity
                        style={s.urlCopyBtn}
                        onPress={() => { navigator.clipboard?.writeText(question.mediaUrl || ''); }}
                      >
                        <Ionicons name="copy-outline" size={16} color={Theme.colors.primary} />
                      </TouchableOpacity>
                    ) : null}
                  </View>
                ) : (
                  /* Trên mobile: vẫn dùng ô URL tạm thời (expo-image-picker nếu cần sau) */
                  <>
                    <Text style={s.hint}>📱 Trên mobile, vui lòng nhập URL ảnh trực tiếp.</Text>
                    <TextInput
                      style={s.input}
                      value={question?.mediaUrl || ''}
                      onChangeText={(v) => set({ mediaUrl: v })}
                      placeholder="https://example.com/image.png"
                      autoCapitalize="none"
                    />
                  </>
                )}
              </>
            )}

            {/* --- DRAG & DROP --- */}
            {question?.type === 'drag_drop' && (() => {
              const data = getParsedInteractive({ items: [] });
              const items: any[] = data.items || [];
              return (
                <>
                  <Text style={s.label}>📦 Danh sách Items (Kéo-Thả)</Text>
                  {items.map((item: any, idx: number) => (
                    <View key={item.id} style={s.row}>
                      <Text style={s.prefix}>{idx + 1}</Text>
                      <TextInput
                        style={[s.input, { flex: 1 }]}
                        value={item.text}
                        onChangeText={(v) => {
                          const ni = [...items]; ni[idx] = { ...ni[idx], text: v };
                          setInteractiveData({ items: ni });
                        }}
                        placeholder={`Item ${idx + 1}`}
                      />
                      <TouchableOpacity onPress={() => {
                        setInteractiveData({ items: items.filter((_: any, i: number) => i !== idx) });
                      }} style={{ padding: 4 }}>
                        <Ionicons name="trash-outline" size={18} color={Theme.colors.error} />
                      </TouchableOpacity>
                    </View>
                  ))}
                  <TouchableOpacity style={s.addBtn} onPress={() => {
                    setInteractiveData({ items: [...items, { id: `item${items.length + 1}`, text: '' }] });
                  }}>
                    <Ionicons name="add-circle-outline" size={16} color={Theme.colors.primary} />
                    <Text style={s.addBtnText}>Thêm item</Text>
                  </TouchableOpacity>
                  <Text style={[s.label, errors.correctAnswers && { color: Theme.colors.error }]}>✅ Thứ tự đúng (VD: item2,item1,item3)</Text>
                  <TextInput
                    style={[s.input, errors.correctAnswers && s.inputError]}
                    value={question?.correctAnswers.join(',')}
                    onChangeText={(v) => {
                      set({ correctAnswers: v.split(',').map(x => x.trim()) });
                      if (errors.correctAnswers) setErrors(prev => ({ ...prev, correctAnswers: '' }));
                    }}
                    autoCapitalize="none"
                  />
                  {errors.correctAnswers && <Text style={s.errorText}>{errors.correctAnswers}</Text>}
                </>
              );
            })()}

            {/* --- HOTSPOT: Zones --- */}
            {question?.type === 'hotspot' && (() => {
              const data = getParsedInteractive({ zones: [] });
              const zones: any[] = data.zones || [];
              return (
                <>
                  <Text style={s.label}>📍 Danh sách Zones</Text>
                  {zones.map((zone: any, idx: number) => (
                    <View key={zone.id} style={s.row}>
                      <TextInput
                        style={[s.input, { width: 80, marginRight: 8, fontSize: 11, backgroundColor: '#f5f5f5' }]}
                        value={zone.id}
                        onChangeText={(v) => {
                          const nz = [...zones]; nz[idx] = { ...nz[idx], id: v.trim() };
                          setInteractiveData({ ...data, zones: nz });
                        }}
                        placeholder="ID"
                        autoCapitalize="none"
                      />
                      <TextInput
                        style={[s.input, { flex: 1 }]}
                        value={zone.label}
                        onChangeText={(v) => {
                          const nz = [...zones]; nz[idx] = { ...nz[idx], label: v };
                          setInteractiveData({ ...data, zones: nz });
                        }}
                        placeholder={`Nhãn vùng ${idx + 1}`}
                      />
                      <TouchableOpacity onPress={() => {
                        setInteractiveData({ ...data, zones: zones.filter((_: any, i: number) => i !== idx) });
                      }} style={{ padding: 4 }}>
                        <Ionicons name="trash-outline" size={18} color={Theme.colors.error} />
                      </TouchableOpacity>
                    </View>
                  ))}
                  <TouchableOpacity style={s.addBtn} onPress={() => {
                    setInteractiveData({ ...data, zones: [...zones, { id: `zone_${String.fromCharCode(65 + zones.length)}`, label: '' }] });
                  }}>
                    <Ionicons name="add-circle-outline" size={16} color={Theme.colors.primary} />
                    <Text style={s.addBtnText}>Thêm zone</Text>
                  </TouchableOpacity>
                  <Text style={[s.label, errors.correctAnswers && { color: Theme.colors.error }]}>✅ Zone ID đúng</Text>
                  <TextInput
                    style={[s.input, errors.correctAnswers && s.inputError]}
                    value={question?.correctAnswers.join(',')}
                    onChangeText={(v) => {
                      set({ correctAnswers: v.split(',').map(x => x.trim()) });
                      if (errors.correctAnswers) setErrors(prev => ({ ...prev, correctAnswers: '' }));
                    }}
                    autoCapitalize="none"
                    placeholder="zone_A"
                  />
                  {errors.correctAnswers && <Text style={s.errorText}>{errors.correctAnswers}</Text>}
                </>
              );
            })()}

            {/* --- MATCHING --- */}
            {question?.type === 'matching' && (() => {
              const data = getParsedInteractive({ left: [], right: [] });
              const leftItems: any[] = data.left || [];
              const rightItems: any[] = data.right || [];
              return (
                <>
                  <Text style={s.label}>◀ Cột Trái</Text>
                  {leftItems.map((item: any, idx: number) => (
                    <View key={item.id} style={s.row}>
                      <Text style={s.prefix}>{item.id}</Text>
                      <TextInput
                        style={[s.input, { flex: 1 }]}
                        value={item.text}
                        onChangeText={(v) => {
                          const nl = [...leftItems]; nl[idx] = { ...nl[idx], text: v };
                          setInteractiveData({ ...data, left: nl });
                        }}
                        placeholder={`Item trái ${idx + 1}`}
                      />
                      <TouchableOpacity onPress={() => {
                        setInteractiveData({ ...data, left: leftItems.filter((_: any, i: number) => i !== idx) });
                      }} style={{ padding: 4 }}>
                        <Ionicons name="trash-outline" size={18} color={Theme.colors.error} />
                      </TouchableOpacity>
                    </View>
                  ))}
                  <TouchableOpacity style={s.addBtn} onPress={() => {
                    setInteractiveData({ ...data, left: [...leftItems, { id: `L${leftItems.length + 1}`, text: '' }] });
                  }}>
                    <Ionicons name="add-circle-outline" size={16} color={Theme.colors.primary} />
                    <Text style={s.addBtnText}>Thêm cột trái</Text>
                  </TouchableOpacity>

                  <Text style={s.label}>▶ Cột Phải</Text>
                  {rightItems.map((item: any, idx: number) => (
                    <View key={item.id} style={s.row}>
                      <Text style={s.prefix}>{item.id}</Text>
                      <TextInput
                        style={[s.input, { flex: 1 }]}
                        value={item.text}
                        onChangeText={(v) => {
                          const nr = [...rightItems]; nr[idx] = { ...nr[idx], text: v };
                          setInteractiveData({ ...data, right: nr });
                        }}
                        placeholder={`Item phải ${idx + 1}`}
                      />
                      <TouchableOpacity onPress={() => {
                        setInteractiveData({ ...data, right: rightItems.filter((_: any, i: number) => i !== idx) });
                      }} style={{ padding: 4 }}>
                        <Ionicons name="trash-outline" size={18} color={Theme.colors.error} />
                      </TouchableOpacity>
                    </View>
                  ))}
                  <TouchableOpacity style={s.addBtn} onPress={() => {
                    setInteractiveData({ ...data, right: [...rightItems, { id: `R${rightItems.length + 1}`, text: '' }] });
                  }}>
                    <Ionicons name="add-circle-outline" size={16} color={Theme.colors.primary} />
                    <Text style={s.addBtnText}>Thêm cột phải</Text>
                  </TouchableOpacity>
                  <Text style={s.label}>✅ Đáp án đúng (VD: L1:R2,L2:R1)</Text>
                  <TextInput
                    style={s.input}
                    value={question?.correctAnswers.join(',')}
                    onChangeText={(v) => set({ correctAnswers: v.split(',').map(x => x.trim()) })}
                    autoCapitalize="none"
                    placeholder="L1:R2,L2:R1"
                  />
                </>
              );
            })()}

            {/* --- CASE SET --- */}
            {question?.type === 'case_set' && (() => {
              const data = getParsedInteractive({ scenario: '', subQuestions: [] });
              const subQs: any[] = data.subQuestions || [];
              const upd = (nd: any) => setInteractiveData(nd);
              return (
                <>
                  <Text style={s.label}>📋 Đoạn tình huống chung</Text>
                  <Text style={s.hint}>Học viên đọc đoạn này cho TẤT CẢ câu hỏi bên dưới.</Text>
                  <TextInput
                    style={[s.input, s.textArea, { height: 180 }]}
                    multiline
                    value={data.scenario || ''}
                    onChangeText={(v) => upd({ ...data, scenario: v, subQuestions: subQs })}
                    placeholder="Nhập tình huống dự án..."
                  />

                  <View style={s.subQHeader}>
                    <Text style={s.label}>❓ Câu hỏi con ({subQs.length} câu)</Text>
                    <TouchableOpacity style={s.addSubBtn} onPress={() => {
                      upd({ ...data, subQuestions: [...subQs, {
                        id: `sq${subQs.length + 1}`,
                        questionText: '',
                        options: [{ id: 'A', text: '' }, { id: 'B', text: '' }, { id: 'C', text: '' }, { id: 'D', text: '' }],
                        correctAnswers: ['A'],
                        explanation: '',
                      }] });
                    }}>
                      <Ionicons name="add-circle-outline" size={14} color="#fff" />
                      <Text style={s.addSubBtnText}>Thêm câu hỏi</Text>
                    </TouchableOpacity>
                  </View>

                  {subQs.map((sq: any, qi: number) => (
                    <View key={sq.id} style={s.subQCard}>
                      <View style={s.subQCardTop}>
                        <Text style={s.subQTitle}>Câu #{qi + 1}</Text>
                        <TouchableOpacity onPress={() => {
                          if (Platform.OS === 'web') {
                            if (!window.confirm('Xóa câu hỏi con này?')) return;
                          }
                          upd({ ...data, subQuestions: subQs.filter((_: any, i: number) => i !== qi) });
                        }}>
                          <Ionicons name="trash-outline" size={16} color={Theme.colors.error} />
                        </TouchableOpacity>
                      </View>
                      <Text style={s.subLabel}>Nội dung câu hỏi</Text>
                      <TextInput
                        style={[s.input, { height: 70 }]}
                        multiline
                        value={sq.questionText}
                        onChangeText={(v) => {
                          const ns = [...subQs]; ns[qi] = { ...ns[qi], questionText: v };
                          upd({ ...data, subQuestions: ns });
                        }}
                        placeholder="Dựa vào tình huống trên..."
                      />
                      <Text style={s.subLabel}>Lựa chọn A, B, C, D</Text>
                      {(sq.options || []).map((opt: any, oi: number) => (
                        <View key={opt.id} style={s.row}>
                          <Text style={s.prefix}>{opt.id}</Text>
                          <TextInput
                            style={[s.input, { flex: 1 }]}
                            value={opt.text}
                            onChangeText={(v) => {
                              const ns = [...subQs];
                              const no = [...(ns[qi].options || [])]; no[oi] = { ...no[oi], text: v };
                              ns[qi] = { ...ns[qi], options: no };
                              upd({ ...data, subQuestions: ns });
                            }}
                            placeholder={`Lựa chọn ${opt.id}`}
                          />
                        </View>
                      ))}
                      <Text style={s.subLabel}>✅ Đáp án đúng</Text>
                      <TextInput
                        style={s.input}
                        value={(sq.correctAnswers || []).join(',')}
                        onChangeText={(v) => {
                          const ns = [...subQs];
                          ns[qi] = { ...ns[qi], correctAnswers: v.split(',').map((x: string) => x.trim().toUpperCase()) };
                          upd({ ...data, subQuestions: ns });
                        }}
                        autoCapitalize="characters"
                        placeholder="A"
                      />
                    </View>
                  ))}
                  {errors.caseSet && <Text style={s.errorText}>{errors.caseSet}</Text>}
                </>
              );
            })()}

            {/* --- SINGLE / MULTIPLE / FILL_BLANK --- */}
            {['single', 'multiple', 'fill_blank'].includes(question?.type || 'single') && question?.type !== 'case_set' && (
              <>
                {['single', 'multiple'].includes(question?.type || 'single') && (
                  <>
                    <Text style={s.label}>Các tùy chọn (A, B, C, D)</Text>
                    {(question?.options || []).map((opt, idx) => (
                      <View key={opt.id} style={s.row}>
                        <Text style={s.prefix}>{opt.id}</Text>
                        <TextInput
                          style={[s.input, { flex: 1 }]}
                          value={opt.text}
                          onChangeText={(v) => {
                            const no = [...(question?.options || [])];
                            no[idx] = { ...no[idx], text: v };
                            set({ options: no });
                          }}
                        />
                      </View>
                    ))}
                  </>
                )}
                <Text style={[s.label, errors.correctAnswers && { color: Theme.colors.error }]}>
                  {question?.type === 'fill_blank' ? 'Đáp án đúng (văn bản)' : 'Đáp án đúng (VD: A hoặc A,B)'}
                </Text>
                <TextInput
                  style={[s.input, errors.correctAnswers && s.inputError]}
                  value={question?.correctAnswers.join(',')}
                  onChangeText={(v) => {
                    set({ correctAnswers: v.split(',').map(x => x.trim()) });
                    if (errors.correctAnswers) setErrors(prev => ({ ...prev, correctAnswers: '' }));
                  }}
                  autoCapitalize={question?.type === 'fill_blank' ? 'none' : 'characters'}
                />
                {errors.correctAnswers && <Text style={s.errorText}>{errors.correctAnswers}</Text>}
              </>
            )}

            {/* Domain & ECO Task & Explanation */}
            <Text style={[s.label, errors.domain && { color: Theme.colors.error }]}>Domain</Text>
            <TextInput
              style={[s.input, errors.domain && s.inputError]}
              value={question?.domain}
              onChangeText={(v) => {
                set({ domain: v });
                if (errors.domain) setErrors(prev => ({ ...prev, domain: '' }));
              }}
              placeholder="VD: People"
            />
            {errors.domain && <Text style={s.errorText}>{errors.domain}</Text>}

            <Text style={[s.label, errors.ecoTask && { color: Theme.colors.error }]}>ECO Task</Text>
            <TextInput
              style={[s.input, errors.ecoTask && s.inputError]}
              value={question?.ecoTask}
              onChangeText={(v) => {
                set({ ecoTask: v });
                if (errors.ecoTask) setErrors(prev => ({ ...prev, ecoTask: '' }));
              }}
              placeholder="VD: Manage conflict"
            />
            {errors.ecoTask && <Text style={s.errorText}>{errors.ecoTask}</Text>}
            <Text style={s.label}>Giải thích (Explanation)</Text>
            <TextInput
              style={[s.input, s.textArea]}
              multiline
              value={question?.explanation}
              onChangeText={(v) => set({ explanation: v })}
            />
          </ScrollView>

          {/* Footer */}
          <View style={s.footer}>
            <TouchableOpacity style={s.cancelBtn} onPress={handleClose}>
              <Text style={s.cancelBtnText}>Hủy</Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.saveBtn} onPress={handleSave}>
              <Ionicons name="checkmark-circle-outline" size={16} color="#fff" />
              <Text style={s.saveBtnText}>Lưu câu hỏi</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const s = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  content: {
    backgroundColor: Theme.colors.background,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '95%',
    paddingBottom: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Theme.spacing.l,
    borderBottomWidth: 1,
    borderBottomColor: Theme.colors.border,
  },
  title: { fontSize: 17, fontWeight: 'bold', color: Theme.colors.text },
  scroll: { paddingHorizontal: Theme.spacing.l },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: Theme.colors.text,
    marginTop: 14,
    marginBottom: 4,
  },
  hint: {
    fontSize: 11,
    color: Theme.colors.textLight,
    fontStyle: 'italic',
    marginBottom: 4,
  },
  input: {
    backgroundColor: Theme.colors.surface,
    borderWidth: 1,
    borderColor: Theme.colors.border,
    borderRadius: Theme.borderRadius.s,
    padding: 10,
    fontSize: 14,
    color: Theme.colors.text,
    marginBottom: 4,
  },
  inputError: {
    borderColor: Theme.colors.error,
    backgroundColor: 'rgba(238, 67, 67, 0.05)',
  },
  errorText: {
    color: Theme.colors.error,
    fontSize: 11,
    marginTop: 2,
    marginBottom: 6,
    fontWeight: '600',
  },
  textArea: { height: 100, textAlignVertical: 'top' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  prefix: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: Theme.colors.primary,
    color: '#fff', fontWeight: 'bold', fontSize: 12,
    textAlign: 'center', lineHeight: 28,
  },
  chip: {
    paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20,
    backgroundColor: Theme.colors.surface, marginRight: 8,
    borderWidth: 1, borderColor: Theme.colors.border,
  },
  chipActive: { backgroundColor: Theme.colors.primary, borderColor: Theme.colors.primary },
  chipText: { fontSize: 12, color: Theme.colors.text },
  chipTextActive: { color: '#fff', fontWeight: 'bold' },
  addBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    borderWidth: 1, borderColor: Theme.colors.primary, borderStyle: 'dashed',
    borderRadius: Theme.borderRadius.s, padding: 8,
    justifyContent: 'center', marginVertical: 6,
  },
  addBtnText: { color: Theme.colors.primary, fontSize: 13, fontWeight: '600' },
  subQHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 },
  addSubBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: Theme.colors.primary,
    paddingHorizontal: 10, paddingVertical: 6,
    borderRadius: Theme.borderRadius.s,
  },
  addSubBtnText: { color: '#fff', fontSize: 12, fontWeight: '600' },
  subQCard: {
    backgroundColor: 'rgba(67,97,238,0.04)',
    borderWidth: 1, borderColor: 'rgba(67,97,238,0.2)',
    borderRadius: Theme.borderRadius.m,
    padding: Theme.spacing.m, marginTop: 10, gap: 4,
  },
  subQCardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  subQTitle: { fontSize: 13, fontWeight: 'bold', color: Theme.colors.primary },
  subLabel: { fontSize: 12, fontWeight: '600', color: Theme.colors.text, marginTop: 6, marginBottom: 2 },
  footer: {
    flexDirection: 'row', gap: 12,
    paddingHorizontal: Theme.spacing.l,
    paddingTop: Theme.spacing.m,
    borderTopWidth: 1,
    borderTopColor: Theme.colors.border,
  },
  cancelBtn: {
    flex: 1, padding: 12, borderRadius: Theme.borderRadius.m,
    borderWidth: 1, borderColor: Theme.colors.border,
    alignItems: 'center',
  },
  cancelBtnText: { color: Theme.colors.text, fontWeight: '600' },
  saveBtn: {
    flex: 2, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, padding: 12, borderRadius: Theme.borderRadius.m,
    backgroundColor: Theme.colors.primary,
  },
  saveBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 15 },

  // --- Image upload styles ---
  imgPreviewWrap: {
    position: 'relative',
    marginBottom: 8,
    borderRadius: Theme.borderRadius.m,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Theme.colors.border,
    backgroundColor: '#f0f0f0',
  },
  imgPreview: {
    width: '100%',
    height: 180,
  },
  imgRemoveBtn: {
    position: 'absolute',
    top: 6,
    right: 6,
    backgroundColor: '#fff',
    borderRadius: 11,
  },
  uploadRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  uploadBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Theme.colors.primary,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: Theme.borderRadius.m,
  },
  uploadBtnDisabled: {
    opacity: 0.6,
  },
  uploadBtnText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  urlCopyBtn: {
    padding: 10,
    borderRadius: Theme.borderRadius.s,
    backgroundColor: 'rgba(67, 97, 238, 0.08)',
    borderWidth: 1,
    borderColor: Theme.colors.border,
  },
});
