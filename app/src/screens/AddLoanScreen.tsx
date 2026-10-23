import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Image,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { z } from 'zod';
import { createLoanApi, uploadReceiptApi } from '../api/loans.api';

// Client-side validation schema matching backend rules
const loanFormSchema = z.object({
  friendName: z.string().trim().min(1, 'Friend name is required'),
  amount: z
    .number({ invalid_type_error: 'Amount must be a valid number' })
    .positive('Amount must be greater than zero'),
  dueDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must follow YYYY-MM-DD format')
    .refine((val) => !isNaN(Date.parse(val)), {
      message: 'Due date must be a valid calendar date',
    }),
});

interface AddLoanScreenProps {
  navigation: any;
}

export const AddLoanScreen: React.FC<AddLoanScreenProps> = ({ navigation }) => {
  const [friendName, setFriendName] = useState('');
  const [amount, setAmount] = useState('');
  
  // Default to 14 days from today formatted as YYYY-MM-DD
  const getDefaultDueDate = () => {
    const d = new Date();
    d.setDate(d.getDate() + 14);
    return d.toISOString().split('T')[0];
  };

  const [dueDate, setDueDate] = useState(getDefaultDueDate());
  const [receiptImageUri, setReceiptImageUri] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  // Quick preset helper
  const setPresetDate = (daysAhead: number) => {
    const target = new Date();
    target.setDate(target.getDate() + daysAhead);
    setDueDate(target.toISOString().split('T')[0]);
  };

  // Pick receipt image from device library
  const handlePickImage = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permissionResult.granted) {
      Alert.alert(
        'Permission Denied',
        'Please allow access to your photo library to attach a receipt.'
      );
      return;
    }

    const pickerResult = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      quality: 0.8,
    });

    if (!pickerResult.canceled && pickerResult.assets && pickerResult.assets.length > 0) {
      setReceiptImageUri(pickerResult.assets[0].uri);
    }
  };

  const handleRemoveImage = () => {
    setReceiptImageUri(null);
  };

  // Form submit handler
  const handleSubmit = async () => {
    setErrors({});

    const parsedAmount = parseFloat(amount);

    // Validate form inputs
    const validationResult = loanFormSchema.safeParse({
      friendName: friendName.trim(),
      amount: parsedAmount,
      dueDate: dueDate.trim(),
    });

    if (!validationResult.success) {
      const fieldErrors: { [key: string]: string } = {};
      validationResult.error.errors.forEach((err) => {
        const fieldName = err.path[0] as string;
        fieldErrors[fieldName] = err.message;
      });
      setErrors(fieldErrors);
      return;
    }

    setIsSubmitting(true);

    try {
      // 1. Create loan record in database
      const createdLoan = await createLoanApi({
        friendName: friendName.trim(),
        amount: parsedAmount,
        dueDate: dueDate.trim(),
      });

      // 2. If a receipt image was selected, upload it
      if (receiptImageUri) {
        try {
          await uploadReceiptApi(createdLoan.id, receiptImageUri);
        } catch (uploadError: any) {
          console.warn('Receipt upload warning:', uploadError);
          Alert.alert(
            'Loan Saved (Receipt Warning)',
            'The loan was saved, but the receipt image upload encountered an issue: ' + uploadError.message
          );
        }
      }

      navigation.goBack();
    } catch (error: any) {
      console.error('Error creating loan:', error);
      Alert.alert('Error', error.message || 'Failed to save loan.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <View style={styles.formCard}>
          {/* Friend Name */}
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Friend's Name</Text>
            <TextInput
              style={[styles.input, errors.friendName && styles.inputError]}
              placeholder="e.g. Alex Smith"
              placeholderTextColor="#94A3B8"
              value={friendName}
              onChangeText={(text) => {
                setFriendName(text);
                if (errors.friendName) setErrors((prev) => ({ ...prev, friendName: '' }));
              }}
              autoCapitalize="words"
              editable={!isSubmitting}
            />
            {errors.friendName ? (
              <Text style={styles.errorText}>{errors.friendName}</Text>
            ) : null}
          </View>

          {/* Amount */}
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Amount Lent ($ USD)</Text>
            <TextInput
              style={[styles.input, errors.amount && styles.inputError]}
              placeholder="0.00"
              placeholderTextColor="#94A3B8"
              value={amount}
              onChangeText={(text) => {
                setAmount(text);
                if (errors.amount) setErrors((prev) => ({ ...prev, amount: '' }));
              }}
              keyboardType="decimal-pad"
              editable={!isSubmitting}
            />
            {errors.amount ? (
              <Text style={styles.errorText}>{errors.amount}</Text>
            ) : null}
          </View>

          {/* Due Date */}
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Due Date (YYYY-MM-DD)</Text>
            <TextInput
              style={[styles.input, errors.dueDate && styles.inputError]}
              placeholder="YYYY-MM-DD"
              placeholderTextColor="#94A3B8"
              value={dueDate}
              onChangeText={(text) => {
                setDueDate(text);
                if (errors.dueDate) setErrors((prev) => ({ ...prev, dueDate: '' }));
              }}
              editable={!isSubmitting}
            />
            {errors.dueDate ? (
              <Text style={styles.errorText}>{errors.dueDate}</Text>
            ) : null}

            {/* Quick date presets */}
            <View style={styles.presetContainer}>
              <Text style={styles.presetLabel}>Quick Select: </Text>
              <TouchableOpacity style={styles.presetChip} onPress={() => setPresetDate(7)}>
                <Text style={styles.presetChipText}>+7 Days</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.presetChip} onPress={() => setPresetDate(14)}>
                <Text style={styles.presetChipText}>+14 Days</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.presetChip} onPress={() => setPresetDate(30)}>
                <Text style={styles.presetChipText}>+30 Days</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Optional Receipt Photo */}
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Receipt or Proof (Optional)</Text>
            {receiptImageUri ? (
              <View style={styles.imagePreviewContainer}>
                <Image source={{ uri: receiptImageUri }} style={styles.imagePreview} />
                <TouchableOpacity
                  style={styles.removeImageButton}
                  onPress={handleRemoveImage}
                  activeOpacity={0.7}
                >
                  <Text style={styles.removeImageText}>✕ Remove Photo</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity
                style={styles.uploadButton}
                onPress={handlePickImage}
                activeOpacity={0.8}
                disabled={isSubmitting}
              >
                <Text style={styles.uploadButtonText}>📷 Attach Receipt Photo</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Action Buttons */}
          <TouchableOpacity
            style={[styles.submitButton, isSubmitting && styles.buttonDisabled]}
            onPress={handleSubmit}
            disabled={isSubmitting}
            activeOpacity={0.8}
          >
            {isSubmitting ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.submitButtonText}>Save Loan Entry</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.cancelButton}
            onPress={() => navigation.goBack()}
            disabled={isSubmitting}
            activeOpacity={0.7}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  scrollContent: {
    padding: 20,
    flexGrow: 1,
    justifyContent: 'center',
  },
  formCard: {
    backgroundColor: '#1E293B',
    borderRadius: 20,
    padding: 22,
    borderWidth: 1,
    borderColor: '#334155',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 4,
  },
  fieldGroup: {
    marginBottom: 18,
  },
  label: {
    color: '#CBD5E1',
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#0F172A',
    borderColor: '#334155',
    borderWidth: 1.5,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    color: '#F8FAFC',
    fontSize: 15,
  },
  inputError: {
    borderColor: '#EF4444',
  },
  errorText: {
    color: '#F87171',
    fontSize: 12,
    marginTop: 4,
    fontWeight: '500',
  },
  presetContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    flexWrap: 'wrap',
    gap: 6,
  },
  presetLabel: {
    color: '#64748B',
    fontSize: 11,
  },
  presetChip: {
    backgroundColor: '#0F172A',
    borderColor: '#334155',
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  presetChipText: {
    color: '#38BDF8',
    fontSize: 11,
    fontWeight: '600',
  },
  uploadButton: {
    backgroundColor: '#0F172A',
    borderColor: '#38BDF8',
    borderWidth: 1,
    borderStyle: 'dashed',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  uploadButtonText: {
    color: '#38BDF8',
    fontSize: 14,
    fontWeight: '600',
  },
  imagePreviewContainer: {
    alignItems: 'center',
  },
  imagePreview: {
    width: '100%',
    height: 180,
    borderRadius: 12,
    marginBottom: 8,
  },
  removeImageButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: '#334155',
    borderRadius: 8,
  },
  removeImageText: {
    color: '#F87171',
    fontSize: 12,
    fontWeight: '600',
  },
  submitButton: {
    backgroundColor: '#38BDF8',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  submitButtonText: {
    color: '#0F172A',
    fontSize: 15,
    fontWeight: '700',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  cancelButton: {
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 6,
  },
  cancelButtonText: {
    color: '#94A3B8',
    fontSize: 13,
    fontWeight: '600',
  },
});
