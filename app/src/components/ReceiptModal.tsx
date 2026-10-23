import React from 'react';
import { Modal, View, Image, StyleSheet, TouchableOpacity, Text, SafeAreaView } from 'react-native';
import { getFullReceiptUrl } from '../config';

interface ReceiptModalProps {
  visible: boolean;
  receiptUrl: string | null;
  onClose: () => void;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({
  visible,
  receiptUrl,
  onClose,
}) => {
  if (!receiptUrl) return null;

  const fullUrl = getFullReceiptUrl(receiptUrl);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <SafeAreaView style={styles.modalOverlay}>
        <View style={styles.header}>
          <Text style={styles.title}>Attached Receipt</Text>
          <TouchableOpacity style={styles.closeButton} onPress={onClose} activeOpacity={0.7}>
            <Text style={styles.closeButtonText}>✕ Close</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.imageContainer}>
          {fullUrl && (
            <Image
              source={{ uri: fullUrl }}
              style={styles.image}
              resizeMode="contain"
            />
          )}
        </View>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.95)', // Deep slate with high opacity
    justifyContent: 'space-between',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  title: {
    color: '#F8FAFC',
    fontSize: 16,
    fontWeight: '700',
  },
  closeButton: {
    backgroundColor: '#334155',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  closeButtonText: {
    color: '#F1F5F9',
    fontSize: 13,
    fontWeight: '600',
  },
  imageContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  image: {
    width: '100%',
    height: '100%',
  },
});
